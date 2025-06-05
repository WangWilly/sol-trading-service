import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import type { Logger } from "../../utils/logging";
import { TsLogLogger } from "../../utils/logging";
import { transportFunc } from "../logHistoryHelper/helper";
import { LOG_TYPE, NOT_USE_CLI } from "../../config";

import { JupSwapClient } from "../3rdParties/jup";
import { JitoClient } from "../3rdParties/jito";
import { FeeHelper } from "../feeHelper/helper";
import { SwapExecutor } from "../swapExecutor/swapExecutor";

import {
  SwapConfig,
  SwapConfigSchema,
  BuyParams,
  SellParams,
  SwapOperationResult,
  SwapHistoryEntry,
  SwapHelperData,
} from "./dtos";

import { SwapValidator, JsonSwapPersistence, SwapPersistence } from "./utils";

import { TokenHelper } from "../tokenHelper/helper";
import { TokenBalanceDto, WalletBalancesDto } from "../tokenHelper/dtos";

import { COIN_TYPE_WSOL_MINT } from "../../utils/constants";
import { UUID } from "../../utils/uuid";
import { ResultUtils } from "../../utils/result";

////////////////////////////////////////////////////////////////////////////////

export class SwapHelper {
  private config: SwapConfig;
  private readonly swapValidator: SwapValidator;
  private readonly swapExecutor: SwapExecutor;
  private readonly persistence?: SwapPersistence;

  public constructor(
    private readonly playerKeypair: Keypair,
    private readonly solWeb3Conn: Connection,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly feeHelper: FeeHelper,
    initialConfig: Partial<SwapConfig> = {},
    private readonly logger: Logger = new TsLogLogger({
      name: "SwapHelper",
      type: LOG_TYPE,
      overwrite: {
        transportJSON: NOT_USE_CLI
          ? undefined
          : (json: unknown) => {
              transportFunc(json);
            },
      },
    }),
    enablePersistence: boolean = true,
    persistenceDataPath: string = "data/swap-data.json"
  ) {
    // Initialize configuration
    this.config = SwapConfigSchema.parse(initialConfig);

    // Initialize utilities
    this.swapValidator = new SwapValidator(
      this.solWeb3Conn,
      this.config,
      this.logger
    );

    this.swapExecutor = new SwapExecutor(
      this.solWeb3Conn,
      this.playerKeypair,
      this.jupSwapClient,
      this.jitoClient,
      this.feeHelper,
      this.logger
    );

    // Initialize persistence if enabled
    if (enablePersistence) {
      this.persistence = new JsonSwapPersistence(
        persistenceDataPath,
        this.logger
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Configuration Management
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get current configuration
   */
  getConfig(): SwapConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<SwapConfig>): Promise<void> {
    const newConfig = { ...this.config, ...updates };
    const validated = SwapConfigSchema.parse(newConfig);

    this.config = validated;

    if (this.persistence) {
      await this.saveToStorage();
    }

    this.logger.info("Swap configuration updated");
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<void> {
    this.config = SwapConfigSchema.parse({});

    if (this.persistence) {
      await this.saveToStorage();
    }

    this.logger.info("Swap configuration reset to defaults");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Balance Management
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get wallet SOL balance
   */
  async getSolBalance(): Promise<BN> {
    const solBalance = await TokenHelper.getUserSolWrappedAndUnwrapped(
      this.solWeb3Conn,
      this.playerKeypair.publicKey
    );
    return solBalance.total;
  }

  /**
   * Get token balance for specific mint
   */
  async getTokenBalance(tokenMint: PublicKey): Promise<TokenBalanceDto> {
    return await TokenHelper.getUserTokenBalanceDto(
      this.solWeb3Conn,
      this.playerKeypair.publicKey,
      tokenMint,
      TOKEN_PROGRAM_ID // TODO: Use correct token program ID
    );
  }

  /**
   * Get all wallet balances
   */
  async getWalletBalances(): Promise<WalletBalancesDto> {
    return await TokenHelper.getUserWalletBalancesDto(
      this.solWeb3Conn,
      this.playerKeypair.publicKey,
      TOKEN_PROGRAM_ID // TODO: Use correct token program ID
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Swap Operations
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Execute a buy operation (SOL -> Token)
   */
  async buy(params: BuyParams): Promise<SwapOperationResult> {
    const contextInfo = `[SwapHelper][Buy][${UUID.generate()}]`;
    this.logger.info(
      `${contextInfo} Starting buy operation for ${params.toTokenMint.toBase58()} w/ ${params.amount.toString()} ${params.fromTokenMint.toBase58()}`
    );

    // Validate parameters
    const validation = this.swapValidator.validateBuyParams(params);
    if (!validation.valid) {
      const error = `Buy validation failed: ${validation.error}`;
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }

    // Check SOL balance
    const hasSufficient = await ResultUtils.wrap(
      TokenHelper.hasSufficientBalance(
        this.solWeb3Conn,
        this.playerKeypair.publicKey,
        params.fromTokenMint,
        params.amount
      )
    );
    if (ResultUtils.isErr(hasSufficient)) {
      const error = `Failed to check SOL balance: ${hasSufficient.error}`;
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }
    if (!hasSufficient.data) {
      const error = "Insufficient SOL balance";
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }

    // Calculate slippage
    const slippageBps = this.swapValidator.calculateSlippage({
      customSlippageBps: params.slippageBps,
      fromMint: params.fromTokenMint,
      toMint: params.toTokenMint,
      amount: params.amount,
    });

    // Get priority fee
    // TODO:
    const priorityFee = this.swapValidator.getPriorityFee(
      true,
      params.priorityFee
    );

    // Execute swap
    const swapParams = {
      fromMint: params.fromTokenMint,
      toMint: params.toTokenMint,
      amount: params.amount,
      slippageBps,
      jitoTipPercentile: this.config.jitoTipPercentile,
    };

    const swapResult = await this.swapExecutor.executeSwap(
      swapParams,
      contextInfo
    );

    if (!swapResult || !swapResult.success) {
      const error = "Swap execution failed";
      this.logger.error(`${contextInfo} ${error}`);

      // Log failed transaction
      await this.logSwapHistory({
        id: contextInfo,
        timestamp: Date.now(),
        type: "buy",
        fromTokenMint: params.fromTokenMint.toBase58(),
        toTokenMint: params.toTokenMint.toBase58(),
        signature: swapResult?.signature || "",
        success: false,
        amount: params.amount,
        slippageBps,
        priorityFee,
        error,
      });

      return { success: false, error, signature: swapResult?.signature };
    }

    this.logger.info(
      `${contextInfo} Buy completed successfully: ${swapResult.signature}`
    );

    // Log successful transaction
    await this.logSwapHistory({
      id: contextInfo,
      timestamp: Date.now(),
      type: "buy",
      fromTokenMint: params.fromTokenMint.toBase58(),
      toTokenMint: params.toTokenMint.toBase58(),
      signature: swapResult.signature,
      success: true,
      amount: params.amount,
      slippageBps,
      priorityFee,
    });

    return {
      success: true,
      signature: swapResult.signature,
      amount: params.amount,
      actualSlippageBps: slippageBps,
    };
  }

  /**
   * Execute a sell operation (Token -> SOL)
   */
  async sell(params: SellParams): Promise<SwapOperationResult> {
    const contextInfo = `[SwapHelper][Sell][${UUID.generate()}]`;
    this.logger.info(
      `${contextInfo} Starting sell operation for swapping ${params.fromTokenMint.toBase58()} back to ${params.toTokenMint.toBase58()}`
    );

    // Calculate actual token amount to sell
    let tokenAmount = params.tokenAmount;

    if (params.percentage !== undefined) {
      const calculatedAmount = await ResultUtils.wrap(
        TokenHelper.calculateSellAmount(
          this.solWeb3Conn,
          this.playerKeypair.publicKey,
          params.fromTokenMint,
          params.percentage
        )
      );
      if (ResultUtils.isErr(calculatedAmount)) {
        const error = `Failed to calculate sell amount: ${calculatedAmount.error}`;
        this.logger.error(`${contextInfo} ${error}`);
        return { success: false, error };
      }

      if (!calculatedAmount.data) {
        const error = "No tokens found to sell";
        this.logger.error(`${contextInfo} ${error}`);
        return { success: false, error };
      }

      tokenAmount = calculatedAmount.data;
    }

    // Update params with calculated amount for validation
    const validationParams = { ...params, tokenAmount };

    // Validate parameters
    const validation = this.swapValidator.validateSellParams(validationParams);
    if (!validation.valid) {
      const error = `Sell validation failed: ${validation.error}`;
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }

    // Check token balance
    const hasSufficientTokens = await ResultUtils.wrap(
      TokenHelper.hasSufficientTokens(
        this.solWeb3Conn,
        this.playerKeypair.publicKey,
        params.fromTokenMint,
        tokenAmount
      )
    );
    if (ResultUtils.isErr(hasSufficientTokens)) {
      const error = `Failed to check token balance: ${hasSufficientTokens.error}`;
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }
    if (!hasSufficientTokens.data) {
      const error = "Insufficient token balance";
      this.logger.error(`${contextInfo} ${error}`);
      return { success: false, error };
    }

    // Calculate slippage
    const slippageBps = this.swapValidator.calculateSlippage({
      customSlippageBps: params.slippageBps,
      fromMint: params.fromTokenMint,
      toMint: params.toTokenMint,
      amount: tokenAmount,
    });

    // Get priority fee
    // TODO:
    const priorityFee = this.swapValidator.getPriorityFee(
      false,
      params.priorityFee
    );

    // Execute swap
    const swapParams = {
      fromMint: params.fromTokenMint,
      toMint: params.toTokenMint,
      amount: tokenAmount,
      slippageBps,
      jitoTipPercentile: this.config.jitoTipPercentile,
    };

    const swapResult = await this.swapExecutor.executeSwap(
      swapParams,
      contextInfo
    );

    if (!swapResult || !swapResult.success) {
      const error = "Swap execution failed";
      this.logger.error(`${contextInfo} ${error}`);

      // Log failed transaction
      await this.logSwapHistory({
        id: contextInfo,
        timestamp: Date.now(),
        type: "sell",
        fromTokenMint: params.fromTokenMint.toBase58(),
        toTokenMint: params.toTokenMint.toBase58(),
        signature: swapResult?.signature || "",
        success: false,
        tokenAmount,
        slippageBps,
        priorityFee,
        error,
      });

      return { success: false, error, signature: swapResult?.signature };
    }

    this.logger.info(
      `${contextInfo} Sell completed successfully: ${swapResult.signature}`
    );

    // Log successful transaction
    await this.logSwapHistory({
      id: contextInfo,
      timestamp: Date.now(),
      type: "sell",
      fromTokenMint: params.fromTokenMint.toBase58(),
      toTokenMint: params.toTokenMint.toBase58(),
      signature: swapResult.signature,
      success: true,
      tokenAmount,
      slippageBps,
      priorityFee,
    });

    return {
      success: true,
      signature: swapResult.signature,
      amount: tokenAmount,
      actualSlippageBps: slippageBps,
    };
  }

  //////////////////////////////////////////////////////////////////////////////
  // Quick Operations
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Quick buy with predefined SOL amounts
   */
  async quickBuy(
    tokenMint: PublicKey,
    solAmountIndex: number
  ): Promise<SwapOperationResult> {
    if (
      solAmountIndex < 0 ||
      solAmountIndex >= this.config.customBuyAmounts.length
    ) {
      return { success: false, error: "Invalid buy amount index" };
    }

    const solAmount = this.config.customBuyAmounts[solAmountIndex];
    const solAmountBN = TokenHelper.solToLamports(solAmount);

    return this.buy({
      fromTokenMint: COIN_TYPE_WSOL_MINT,
      toTokenMint: tokenMint,
      amount: solAmountBN,
    });
  }

  /**
   * Quick sell with predefined percentages
   */
  async quickSell(
    tokenMint: PublicKey,
    percentageIndex: number
  ): Promise<SwapOperationResult> {
    if (
      percentageIndex < 0 ||
      percentageIndex >= this.config.customSellPercentages.length
    ) {
      return { success: false, error: "Invalid sell percentage index" };
    }

    const percentage = this.config.customSellPercentages[percentageIndex];

    return this.sell({
      fromTokenMint: tokenMint,
      toTokenMint: COIN_TYPE_WSOL_MINT,
      tokenAmount: new BN(0), // Will be calculated from percentage
      percentage,
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // History and Persistence
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get swap history
   */
  async getSwapHistory(limit: number = 50): Promise<SwapHistoryEntry[]> {
    if (this.persistence) {
      return this.persistence.getHistory(limit);
    }
    return [];
  }

  //////////////////////////////////////////////////////////////////////////////
  // Lifecycle Management
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Initialize the service by loading persisted data
   */
  async initialize(): Promise<void> {
    if (!this.persistence) {
      this.logger.info("Persistence disabled, starting with in-memory data");
      return;
    }

    this.logger.info("Loading persisted swap data...");
    const data = await this.persistence.load();
    if (data) {
      // Merge loaded config with current config
      this.config = SwapConfigSchema.parse({ ...this.config, ...data.config });
      this.logger.info("Swap data loaded successfully");
      return;
    }

    this.logger.info("No persisted swap data found, starting fresh");
    await this.saveToStorage();
  }

  /**
   * Graceful shutdown with data persistence
   */
  async gracefulShutdown(): Promise<void> {
    this.logger.info("Starting SwapHelper graceful shutdown...");

    try {
      if (this.persistence) {
        this.logger.info("Saving swap data before shutdown...");
        await this.saveToStorage();
      }

      this.logger.info("SwapHelper graceful shutdown completed");
    } catch (error) {
      this.logger.error(`Error during SwapHelper graceful shutdown: ${error}`);
      throw error;
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Utility Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Check if a token is safe to trade
   */
  async isTokenSafe(
    tokenMint: PublicKey
  ): Promise<{ safe: boolean; warnings: string[] }> {
    return this.swapValidator.isTokenSafe(tokenMint);
  }

  /**
   * Get current wallet address
   */
  getWalletAddress(): string {
    return this.playerKeypair.publicKey.toBase58();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Log swap history entry
   */
  private async logSwapHistory(entry: SwapHistoryEntry): Promise<void> {
    if (!this.persistence) {
      this.logger.debug("Persistence is disabled, skipping history log");
      return;
    }
    const res = await ResultUtils.wrap(this.persistence.addHistoryEntry(entry));
    if (ResultUtils.isErr(res)) {
      const error = res.error.message || res.error.toString();
      this.logger.error(`Failed to log swap history entry: ${error}`);
      return;
    }
    this.logger.debug(
      `Swap history logged: ${entry.id} - ${entry.type} - ${entry.fromTokenMint} - ${entry.toTokenMint}`
    );
  }

  /**
   * Save current state to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.persistence) {
      this.logger.debug("Persistence is disabled, skipping save");
      return;
    }

    const history = await ResultUtils.wrap(this.persistence.getHistory(1000));
    if (ResultUtils.isErr(history)) {
      this.logger.error(
        `Failed to retrieve swap history for saving: ${history.error}`
      );
      return;
    }

    const data: SwapHelperData = {
      config: this.config,
      history: history.data,
    };
    const res = await ResultUtils.wrap(this.persistence.save(data));
    if (ResultUtils.isErr(res)) {
      this.logger.error(`Failed to save swap data: ${res.error}`);
      throw res.error;
    }
    this.logger.debug(`Swap data saved successfully`);
  }
}
