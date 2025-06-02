import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import type { Logger } from "../../../utils/logging";
import { JupSwapClient, GetQuoteV1ParamDtoSchema } from "../../3rdParties/jup";
import {
  BuildSwapWithIxsV1BodyDtoSchema,
  getComputeBudgetFromBuildSwapWithIxsV1Result,
  GetQuoteV1ResultDto,
  getTxFromBuildSwapWithIxsV1Result,
} from "../../3rdParties/jup/dtos";
import { JitoClient } from "../../3rdParties/jito";
import { FeeHelper } from "../feeHelper/helper";
import { versionedTxToSerializedBase64 } from "../../../utils/transaction";
import { ResultUtils } from "../../../utils/result";

////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////

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
    private readonly logger: Logger
  ) {}

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    params: SwapParams,
    contextInfo: string
  ): Promise<SwapResult | null> {
    // Get quote
    const quoteResult = await ResultUtils.wrap(
      this.getQuote(params, contextInfo)
    );
    if (ResultUtils.isErr(quoteResult)) {
      this.logger.error(
        `${contextInfo} Failed to get quote: ${quoteResult.error}`
      );
      return null;
    }
    if (!quoteResult.data) {
      this.logger.error(`${contextInfo} Quote data is empty`);
      return null;
    }

    // Build transaction
    const transaction = await ResultUtils.wrap(
      this.buildTransaction(params, quoteResult.data, contextInfo)
    );
    if (ResultUtils.isErr(transaction)) {
      this.logger.error(
        `${contextInfo} Failed to build transaction: ${transaction.error}`
      );
      return null;
    }
    if (!transaction.data) {
      this.logger.error(`${contextInfo} Built transaction is empty`);
      return null;
    }

    // Send transaction
    const res = await ResultUtils.wrap(
      this.sendTransaction(transaction.data, contextInfo)
    );
    if (!ResultUtils.isOk(res)) {
      this.logger.error(
        `${contextInfo} Failed to send transaction: ${res.error}`
      );
      return null;
    }
    if (!res.data) {
      this.logger.error(`${contextInfo} Transaction result is empty`);
      return null;
    }
    return res.data;
  }

  private async getQuote(
    params: SwapParams,
    contextInfo: string
  ): Promise<GetQuoteV1ResultDto | null> {
    const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
      inputMint: params.fromMint,
      outputMint: params.toMint,
      amount: params.amount,
      slippageBps: params.slippageBps,
    });

    if (!getQuoteV1Res.success) {
      this.logger.error(
        `${contextInfo} Cannot parse quote parameters: ${getQuoteV1Res.error}`
      );
      return null;
    }

    const quoteRes = await ResultUtils.wrap(
      this.jupSwapClient.getQuote(getQuoteV1Res.data)
    );
    if (!ResultUtils.isOk(quoteRes)) {
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
    quoteResponse: GetQuoteV1ResultDto,
    contextInfo: string
  ): Promise<VersionedTransaction | null> {
    // Get Jito tip
    const jitoTipLamports =
      await this.jitoClient.getLatestXpercentileTipInLamportsV1(
        params.jitoTipPercentile
      );
    if (!jitoTipLamports) {
      this.logger.error(`${contextInfo} Cannot get Jito tips`);
      return null;
    }

    // Check if this involves Simple AMMs (like Pump.fun) which don't support shared accounts
    const isSimpleAMM = this.isSimpleAMM(quoteResponse);
    this.logger.info(`${contextInfo} Simple AMM detected: ${isSimpleAMM}`);

    // Build swap with instructions
    const buildSwapWithIxsV1BodyDtoRes =
      BuildSwapWithIxsV1BodyDtoSchema.safeParse({
        userPublicKey: this.playerKeypair.publicKey,
        wrapAndUnwrapSol: true,
        useSharedAccounts: !isSimpleAMM, // Disable shared accounts for Simple AMMs
        prioritizationFeeLamports: {
          jitoTipLamports,
        },
        quoteResponse,
      });

    if (!buildSwapWithIxsV1BodyDtoRes.success) {
      this.logger.error(`${contextInfo} Cannot parse swap build parameters`);
      return null;
    }

    const buildSwapWithIxsRes = await ResultUtils.wrap(
      this.jupSwapClient.buildSwapWithIxs(buildSwapWithIxsV1BodyDtoRes.data)
    );

    if (ResultUtils.isErr(buildSwapWithIxsRes)) {
      this.logger.error(`${contextInfo} Cannot build swap`);
      return null;
    }

    // Replace fee/tip
    const computeBudget = ResultUtils.wrapSync(() =>
      getComputeBudgetFromBuildSwapWithIxsV1Result(
        ResultUtils.unwrap(buildSwapWithIxsRes)
      )
    );
    if (ResultUtils.isErr(computeBudget)) {
      this.logger.error(
        `${contextInfo} Cannot get compute budget: ${computeBudget.error}`
      );
      return null;
    }
    if (!computeBudget.data) {
      this.logger.error(`${contextInfo} Compute budget data is empty`);
      return null;
    }
    const feeInfo = this.feeHelper.transferFeeIxProc(
      computeBudget.data,
      this.playerKeypair.publicKey
    );

    const builtTx = await getTxFromBuildSwapWithIxsV1Result(
      this.connection,
      this.playerKeypair.publicKey,
      buildSwapWithIxsRes.data,
      feeInfo?.newComputeBudget,
      feeInfo?.transferFeeIx ? [feeInfo.transferFeeIx] : undefined
    );

    const res = ResultUtils.wrapSync(() => builtTx.sign([this.playerKeypair]));
    if (ResultUtils.isErr(res)) {
      this.logger.error(`${contextInfo} Cannot sign transaction: ${res.error}`);
      return null;
    }
    return builtTx;
  }

  /**
   * Check if the quote response involves Simple AMMs that don't support shared accounts
   */
  private isSimpleAMM(quoteResponse: GetQuoteV1ResultDto): boolean {
    if (!quoteResponse.routePlan.length) {
      return false;
    }

    // Simple AMMs that don't support shared accounts
    const simpleAMMs = [
      "Pump.fun",
      "Raydium CP", // Constant Product pools might also have issues
      // Add other Simple AMMs as needed
    ];

    return quoteResponse.routePlan.some(
      (route) =>
        route.swapInfo.label && simpleAMMs.includes(route.swapInfo.label)
    );
  }

  private async sendTransaction(
    transaction: VersionedTransaction,
    contextInfo: string
  ): Promise<SwapResult | null> {
    const sendTxRes = await this.jitoClient.sendTransactionV1(
      versionedTxToSerializedBase64(transaction)
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
