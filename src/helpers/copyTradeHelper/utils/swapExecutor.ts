import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";
import type { Logger } from "../../../utils/logging";
import { safe } from "../../../utils/exceptions";
import { JupSwapClient, GetQuoteV1ParamDtoSchema } from "../../3rdParties/jup";
import {
  BuildSwapWithIxsV1BodyDtoSchema,
  getComputeBudgetFromBuildSwapWithIxsV1Result,
  getTxFromBuildSwapWithIxsV1Result,
} from "../../3rdParties/jup/dtos";
import { JitoClient } from "../../3rdParties/jito";
import { FeeHelper } from "../feeHelper/helper";
import { versionedTxToSerializedBase64 } from "../../../utils/transaction";

export interface SwapParams {
  fromMint: PublicKey;
  toMint: PublicKey;
  amount: BN;
  slippageBps: number;
  jitoTipPercentile: string;
}

export interface SwapResult {
  signature: string;
  success: boolean;
}

/**
 * Handles swap transaction execution with Jupiter and Jito
 */
export class SwapExecutor {
  constructor(
    private readonly connection: Connection,
    private readonly playerKeypair: Keypair,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly feeHelper: FeeHelper,
    private readonly logger: Logger,
  ) {}

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    params: SwapParams,
    contextInfo: string = "",
  ): Promise<SwapResult | null> {
    try {
      // Get quote
      const quoteResult = await this.getQuote(params, contextInfo);
      if (!quoteResult) return null;

      // Build transaction
      const transaction = await this.buildTransaction(params, quoteResult, contextInfo);
      if (!transaction) return null;

      // Send transaction
      return await this.sendTransaction(transaction, contextInfo);
    } catch (error) {
      this.logger.error(`${contextInfo} Unexpected error: ${error}`);
      return null;
    }
  }

  private async getQuote(params: SwapParams, contextInfo: string) {
    const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
      inputMint: params.fromMint,
      outputMint: params.toMint,
      amount: params.amount,
      slippageBps: params.slippageBps,
    });

    if (!getQuoteV1Res.success) {
      this.logger.error(`${contextInfo} Cannot parse quote parameters: ${getQuoteV1Res.error}`);
      return null;
    }

    const quoteRes = await safe(this.jupSwapClient.getQuote(getQuoteV1Res.data));
    if (!quoteRes.success) {
      this.logger.error(`${contextInfo} Cannot get quote`);
      return null;
    }

    if (!quoteRes.data) {
      this.logger.error(`${contextInfo} Quote data not found`);
      return null;
    }

    return quoteRes.data;
  }

  private async buildTransaction(
    params: SwapParams,
    quoteResponse: any,
    contextInfo: string,
  ): Promise<VersionedTransaction | null> {
    // Get Jito tip
    const jitoTipLamports = await this.jitoClient.getLatestXpercentileTipInLamportsV1(
      params.jitoTipPercentile,
    );
    if (!jitoTipLamports) {
      this.logger.error(`${contextInfo} Cannot get Jito tips`);
      return null;
    }

    // Build swap with instructions
    const buildSwapWithIxsV1BodyDtoRes = BuildSwapWithIxsV1BodyDtoSchema.safeParse({
      userPublicKey: this.playerKeypair.publicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: {
        jitoTipLamports,
      },
      quoteResponse,
    });

    if (!buildSwapWithIxsV1BodyDtoRes.success) {
      this.logger.error(`${contextInfo} Cannot parse swap build parameters`);
      return null;
    }

    const buildSwapWithIxsRes = await safe(
      this.jupSwapClient.buildSwapWithIxs(buildSwapWithIxsV1BodyDtoRes.data),
    );

    if (!buildSwapWithIxsRes.success) {
      this.logger.error(`${contextInfo} Cannot build swap`);
      return null;
    }

    if (!buildSwapWithIxsRes.data) {
      this.logger.error(`${contextInfo} Swap data not found`);
      return null;
    }

    // Replace fee/tip
    const computeBudget = getComputeBudgetFromBuildSwapWithIxsV1Result(
      buildSwapWithIxsRes.data,
    );
    const { transferFeeIx, newComputeBudget } = this.feeHelper.transferFeeIxProc(
      computeBudget,
      this.playerKeypair.publicKey,
    );

    const builtTx = await getTxFromBuildSwapWithIxsV1Result(
      this.connection,
      this.playerKeypair.publicKey,
      buildSwapWithIxsRes.data,
      newComputeBudget,
      [transferFeeIx],
    );

    try {
      builtTx.sign([this.playerKeypair]);
      return builtTx;
    } catch (error) {
      this.logger.error(`${contextInfo} Cannot sign transaction: ${error}`);
      return null;
    }
  }

  private async sendTransaction(
    transaction: VersionedTransaction,
    contextInfo: string,
  ): Promise<SwapResult | null> {
    const sendTxRes = await this.jitoClient.sendTransactionV1(
      versionedTxToSerializedBase64(transaction),
    );

    if (!sendTxRes) {
      this.logger.error(`${contextInfo} Cannot send transaction`);
      return null;
    }

    this.logger.info(`${contextInfo} Transaction sent: ${sendTxRes.result}`);
    return {
      signature: sendTxRes.result,
      success: true,
    };
  }
}
