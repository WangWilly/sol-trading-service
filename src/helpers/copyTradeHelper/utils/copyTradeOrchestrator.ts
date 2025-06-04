import { Connection, Keypair, Logs } from "@solana/web3.js";
import type { Logger } from "../../../utils/logging";
import { JupSwapClient } from "../../3rdParties/jup";
import { JitoClient } from "../../3rdParties/jito";
import { FeeHelper } from "../feeHelper/helper";
import { StrategyManager } from "./strategyManager";
import { SwapExecutor } from "./swapExecutor";
import {
  BuyStrategyContext,
  SellStrategyContext,
  StrategyValidator,
} from "./strategyValidator";
import { TransactionProcessor } from "./transactionProcessor";
import type * as txHelper from "../../transactionHelper";
import { CopyTradeRecord } from "../dtos";
import { COIN_TYPE_WSOL_MINT } from "../../../utils/constants";

//////////////////////////////////////////////////////////////////////////////

/**
 * Orchestrates copy trading operations by coordinating all components
 */
export class CopyTradeOrchestrator {
  private readonly strategyValidator: StrategyValidator;
  private readonly swapExecutor: SwapExecutor;
  private readonly transactionProcessor: TransactionProcessor;

  constructor(
    private readonly strategyManager: StrategyManager,
    readonly playerKeypair: Keypair,
    readonly connection: Connection,
    readonly jupSwapClient: JupSwapClient,
    readonly jitoClient: JitoClient,
    readonly feeHelper: FeeHelper,
    private readonly logger: Logger
  ) {
    this.strategyValidator = new StrategyValidator(
      connection,
      playerKeypair.publicKey,
      logger
    );
    this.swapExecutor = new SwapExecutor(
      connection,
      playerKeypair,
      jupSwapClient,
      jitoClient,
      feeHelper,
      logger
    );
    this.transactionProcessor = new TransactionProcessor(connection, logger);
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Process incoming transaction logs and execute copy trades
   */
  async processTransaction(subId: number, logs: Logs): Promise<void> {
    // Process and validate transaction
    const processingResult = await this.transactionProcessor.processLogs(
      subId,
      logs
    );
    if (!processingResult?.isValid) {
      return;
    }

    const { swapInfo } = processingResult;

    // Get copy trade record
    const copyTradeRecord = this.strategyManager.getCopyTradeRecord(subId);
    if (!copyTradeRecord) {
      this.logger.error(
        `No strategy matches the signer on tx: ${swapInfo.txSignature}`
      );
      return;
    }

    // Execute buy and sell strategies concurrently
    await Promise.all([
      this.executeBuyStrategies(swapInfo, copyTradeRecord),
      this.executeSellStrategies(swapInfo, copyTradeRecord),
    ]);
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Execute buy strategies for WSOL
   */
  private async executeBuyStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: CopyTradeRecord
  ): Promise<void> {
    const buyStrategies = await this.strategyValidator.getBuyStrategies(
      swapInfo,
      copyTradeRecord
    );

    if (buyStrategies.length === 0) {
      this.logger.debug(
        `No buy strategies applicable for tx: ${swapInfo.txSignature}`
      );
      return;
    }

    this.logger.debug(
      `Processing ${buyStrategies.length} buy strategies for tx: ${swapInfo.txSignature}`
    );

    // Execute strategies in parallel for better performance
    const promises = buyStrategies.map((strategyContext) =>
      this.executeBuyStrategy(strategyContext)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Execute sell strategies for tokens
   */
  private async executeSellStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: any
  ): Promise<void> {
    const sellStrategies = await this.strategyValidator.getSellStrategies(
      swapInfo,
      copyTradeRecord
    );

    if (sellStrategies.length === 0) {
      this.logger.debug(
        `No sell strategies applicable for tx: ${swapInfo.txSignature}`
      );
      return;
    }

    this.logger.debug(
      `Processing ${sellStrategies.length} sell strategies for tx: ${swapInfo.txSignature}`
    );

    // Execute strategies in parallel for better performance
    const promises = sellStrategies.map((strategyContext) =>
      this.executeSellStrategy(strategyContext)
    );

    await Promise.allSettled(promises);
  }

  //////////////////////////////////////////////////////////////////////////////

  private async executeBuyStrategy(
    strategyContext: BuyStrategyContext
  ): Promise<void> {
    const { swapInfo, strategy, strategyName } = strategyContext;
    const contextInfo = `[BuyStrategy][${strategyName}][Tx]${swapInfo.txSignature}`;

    // TODO:
    if (swapInfo.toCoinType === null) {
      this.logger.warn(
        `${contextInfo} No fromCoinType found in swap info, skipping sell strategy`
      );
      return;
    }

    const swapParams = {
      fromMint: strategy.sellCoinType,
      toMint: swapInfo.toCoinType,
      amount: strategy.sellCoinAmount,
      slippageBps: strategy.slippageBps,
      jitoTipPercentile: strategy.jitoTipPercentile,
    };

    const result = await this.swapExecutor.executeSwap(swapParams, contextInfo);
    if (result?.success) {
      this.logger.info(`${contextInfo} Copy trade executed successfully`);
    }
  }

  private async executeSellStrategy(
    strategyContext: SellStrategyContext
  ): Promise<void> {
    const { swapInfo, strategy, strategyName, sellAmount } = strategyContext;
    const contextInfo = `[SellStrategy][${strategyName}][Tx]${swapInfo.txSignature}`;

    // TODO:
    if (swapInfo.fromCoinType === null) {
      this.logger.warn(
        `${contextInfo} No fromCoinType found in swap info, skipping sell strategy`
      );
      return;
    }

    const swapParams = {
      fromMint: swapInfo.fromCoinType,
      toMint: COIN_TYPE_WSOL_MINT,
      amount: sellAmount,
      slippageBps: strategy.slippageBps,
      jitoTipPercentile: strategy.jitoTipPercentile,
    };

    const result = await this.swapExecutor.executeSwap(swapParams, contextInfo);
    if (result?.success) {
      this.logger.info(`${contextInfo} Copy trade executed successfully`);
    }
  }
}
