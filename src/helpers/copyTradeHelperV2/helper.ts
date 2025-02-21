import {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "./dtos";
import { COMMON_DEX_REGEX } from "./const";

import {
  Connection,
  Keypair,
  Logs,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";

import { safe } from "../../utils/exceptions";
import { TsLogLogger } from "../../utils/logging";
import type { Logger } from "../../utils/logging";
import * as txHelper from "../transactionHelper";
import { TokenHelper } from "../tokenHelper";
import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../3rdParties/jup";
import { TransactionBuilder } from "../transactionBuilder";
import { JitoClient } from "../3rdParties/jito";
import { GetPercentileTip } from "../3rdParties/jito";
import { COIN_TYPE_WSOL_MINT } from "../solRpcWsHelper/const";

////////////////////////////////////////////////////////////////////////////////

export class CopyTradeHelperV2 {
  private copyTradeSubIdTarPubkeyMap: Map<number, string> = new Map(); // subId -> targetPublicKey
  private copyTradeRecordMap: Map<string, CopyTradeRecord> = new Map(); // targetPublicKey -> CopyTradeRecord

  public constructor(
    private readonly playerKeypair: Keypair,
    private readonly solWeb3Conn: Connection,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly logger: Logger = new TsLogLogger({
      name: "CopyTradeHelperV2",
    })
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  public getCopyTradeTargetPublicKeys(): string[] {
    return Array.from(this.copyTradeRecordMap.keys());
  }

  public registerCopyTradeTargetPublicKey(
    subId: number,
    targetPublicKey: string
  ): void {
    if (this.copyTradeSubIdTarPubkeyMap.has(subId)) {
      this.logger.debug(`SubId ${subId} already exists`);
      return;
    }
    this.logger.debug(
      `Registering subId ${subId} with target ${targetPublicKey}`
    );
    this.copyTradeSubIdTarPubkeyMap.set(subId, targetPublicKey);
  }

  public createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.copyTradeRecordMap.set(targetPublicKey, {
        onBuyStrategiesMap: new Map([[strategyName, strategy]]),
        onSellStrategiesMap: new Map(),
      });
      return true;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onBuyStrategiesMap.get(strategyName)
    ) {
      this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onBuyStrategiesMap.set(strategyName, strategy);
      return true;
    }
    this.logger.warn(`Strategy ${strategyName} already exists`);
    return false;
  }

  public removeCopyTradeOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.logger.warn(`Strategy ${strategyName} not found`);
      return false;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onBuyStrategiesMap.get(strategyName)
    ) {
      this.logger.warn(`Strategy ${strategyName} not found`);
      return false;
    }
    this.copyTradeRecordMap
      .get(targetPublicKey)!
      .onBuyStrategiesMap.delete(strategyName);
    if (
      this.copyTradeRecordMap.get(targetPublicKey)!.onBuyStrategiesMap.size ===
        0 &&
      this.copyTradeRecordMap.get(targetPublicKey)!.onSellStrategiesMap.size ===
        0
    ) {
      this.copyTradeRecordMap.delete(targetPublicKey);
      this.copyTradeSubIdTarPubkeyMap = new Map(
        Array.from(this.copyTradeSubIdTarPubkeyMap.entries()).filter(
          ([_, target]) => target !== targetPublicKey
        )
      );
    }
    return true;
  }

  public createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.copyTradeRecordMap.set(targetPublicKey, {
        onBuyStrategiesMap: new Map(),
        onSellStrategiesMap: new Map([[strategyName, strategy]]),
      });
      return true;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onSellStrategiesMap.get(strategyName)
    ) {
      this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onSellStrategiesMap.set(strategyName, strategy);
      return true;
    }
    this.logger.error(`Strategy ${strategyName} already exists`);
    return false;
  }

  public removeCopyTradeOnSellStrategy(
    targetPublicKey: string,
    strategyName: string
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.logger.warn(`No target found: ${targetPublicKey}`);
      return false;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onSellStrategiesMap.get(strategyName)
    ) {
      this.logger.warn(`No strategy found: ${strategyName}`);
      return false;
    }
    this.copyTradeRecordMap
      .get(targetPublicKey)!
      .onSellStrategiesMap.delete(strategyName);
    if (
      this.copyTradeRecordMap.get(targetPublicKey)!.onBuyStrategiesMap.size ===
        0 &&
      this.copyTradeRecordMap.get(targetPublicKey)!.onSellStrategiesMap.size ===
        0
    ) {
      this.copyTradeRecordMap.delete(targetPublicKey);
      this.copyTradeSubIdTarPubkeyMap = new Map(
        Array.from(this.copyTradeSubIdTarPubkeyMap.entries()).filter(
          ([_, target]) => target !== targetPublicKey
        )
      );
    }
    return true;
  }

  public clearAll4GracefulStop(): void {
    this.logger.info("Clearing all copy trade records");
    this.copyTradeRecordMap.clear();
  }

  //////////////////////////////////////////////////////////////////////////////

  // https://solana.com/developers/cookbook/tokens/create-token-account
  private async copyTradeHandleOnBuyStrategyWithWSOL(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    if (!swapInfo.toCoinType) {
      // this.logger.debug(
      //   `[copyTradeHandleOnBuyStrategyWithSol] No toCoinType found in swapInfo, tx: ${swapInfo.txSignature}`
      // );
      return;
    }
    const targetPublicKey = this.copyTradeSubIdTarPubkeyMap.get(swapInfo.subId);
    if (!targetPublicKey) {
      this.logger.error(
        `[copyTradeHandleOnBuyStrategyWithSol] No target found in [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    const copyTradeRecord = this.copyTradeRecordMap.get(targetPublicKey);
    if (!copyTradeRecord) {
      this.logger.error(
        `[copyTradeHandleOnBuyStrategyWithSol] No strategy matchs the target PK on [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    const onBuyStrategiesWithSol = Array.from(
      copyTradeRecord.onBuyStrategiesMap.entries()
    ).filter((strategy) => strategy[1].sellCoinType === COIN_TYPE_WSOL_MINT);
    if (onBuyStrategiesWithSol.length === 0) {
      this.logger.debug(
        `[copyTradeHandleOnBuyStrategyWithSol] No strategy is applied to [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    this.logger.debug(
      `[copyTradeHandleOnBuyStrategyWithSol] onBuy w/ sol strategies processing: [Tx]${swapInfo.txSignature}`
    );

    // TODO: parallelize this
    for (const [strategyName, strategy] of onBuyStrategiesWithSol) {
      // Resolve: use swapInfo to get quote
      const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
        inputMint: strategy.sellCoinType,
        outputMint: swapInfo.toCoinType,
        amount: swapInfo.fromCoinAmount,
        slippageBps: strategy.slippageBps,
      });
      if (!getQuoteV1Res.success) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot parse strategy: ${strategyName}. Error: ${getQuoteV1Res.error}`
        );
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot get quote: ${strategyName}`
        );
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Quote data not found: ${strategyName}`
        );
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        // FIXME:
        // userPublicKey: this.playerKeypair.publicKey,
        userPublicKey: new PublicKey(
          "ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv"
        ),
        // TODO: additional config
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot parse quote: ${strategyName}`
        );
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot build Swap: ${strategyName}`
        );
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Swap data not found: ${strategyName}`
        );
        continue;
      }

      // Arrange: replace fee/tip
      // https://solana.com/docs/core/fees
      // https://solana.com/developers/guides/advanced/how-to-use-priority-fees
      // https://docs.helius.dev/solana-apis/priority-fee-api
      // https://docs.jito.wtf/lowlatencytxnsend/#tip-amount
      // https://www.reddit.com/r/solana/comments/1bjh2g5/understanding_the_transaction_fees_on_a_jupiter/
      const tx = VersionedTransaction.deserialize(
        Buffer.from(buildSwapRes.data.swapTransaction, "base64")
      );
      let builder = await TransactionBuilder.fromVersionedTxV2(
        this.solWeb3Conn,
        tx
      );
      // 1. check and create ATA for toCoinType
      const toCoinIx = await TokenHelper.getCreateIxPlayerTokenForDeposit(
        this.solWeb3Conn,
        // FIXME:
        // this.playerKeypair.publicKey,
        new PublicKey("ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv"),
        swapInfo.toCoinType,
        swapInfo.toCoinOwnerProgramId
      );
      if (toCoinIx) {
        builder = builder.pushIxToFront(toCoinIx);
      }
      // 2. check and create ATA for sellCoinType
      const sellCoinIx = await TokenHelper.getIxsPlayerAmpleWsolForSell(
        this.solWeb3Conn,
        // FIXME:
        // this.playerKeypair.publicKey,
        new PublicKey("ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv"),
        strategy.sellCoinAmount
      );
      builder = builder.batchPushIxsToFront(sellCoinIx);
      // FIXME: not sure how to calculate fee
      const currentTips = await this.jitoClient.getTipInfoV1();
      this.logger.debug(
        `[copyTradeHandleOnBuyStrategyWithSol] currentTips: ${JSON.stringify(
          currentTips
        )}`
      );
      /**
      if (
        !currentTips ||
        currentTips.length === 0 ||
        !GetPercentileTip(currentTips, strategy.jitoTipPercentile)
      ) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot get tips: ${strategyName}`
        );
        continue;
      }
      const tip = GetPercentileTip(currentTips, strategy.jitoTipPercentile);
      const fee = tip * strategy.jitoTxFeeTipRatio;
      builder = builder.setComputeUnitPrice(fee);
      const builtTx = builder.build(
        await this.solWeb3Conn.getLatestBlockhash()
      );
      builtTx.sign([this.playerKeypair]);

      // Resolve: send transaction
      const sendTxRes = await this.jitoClient.sendTransactionV1(
        Buffer.from(builtTx.serialize()).toString("base64")
      );
      if (!sendTxRes) {
        this.logger.warn(
          `[copyTradeHandleOnBuyStrategyWithSol] Cannot send transaction: ${strategyName}`
        );
        continue;
      }
      this.logger.info(
        `[copyTradeHandleOnBuyStrategyWithSol] Transaction sent: ${strategyName}. Followed tx sign: ${swapInfo.txSignature}. Issued tx sign: ${sendTxRes.result}.`
      );
      */
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async copyTradeHandleOnSellStrategyWithWSOL(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    if (!swapInfo.fromCoinType) {
      // this.logger.debug(
      //   `[copyTradeHandleOnSellStrategyWithSol] No fromCoinType found in swapInfo, tx: ${swapInfo.txSignature}`
      // );
      return;
    }
    const targetPublicKey = this.copyTradeSubIdTarPubkeyMap.get(swapInfo.subId);
    if (!targetPublicKey) {
      this.logger.error(
        `[copyTradeHandleOnSellStrategyWithSol] No target found in [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    const copyTradeRecord = this.copyTradeRecordMap.get(targetPublicKey);
    if (!copyTradeRecord) {
      this.logger.error(
        `[copyTradeHandleOnSellStrategyWithSol] No strategy matchs the signer on [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    const onSellStrategiesWithSol = Array.from(
      copyTradeRecord.onSellStrategiesMap.entries()
    );
    if (onSellStrategiesWithSol.length === 0) {
      this.logger.debug(
        `[copyTradeHandleOnSellStrategyWithSol] No strategy is applied to [Tx]${swapInfo.txSignature}`
      );
      return;
    }
    this.logger.debug(
      `[copyTradeHandleOnSellStrategyWithSol] onSell w/ sol strategies processing: [Tx]${swapInfo.txSignature}`
    );

    // TODO: parallelize this
    for (const [strategyName, strategy] of onSellStrategiesWithSol) {
      // Resolve: use swapInfo to get quote
      const amount = await TokenHelper.getPlayerTokenBalanceForSell(
        this.solWeb3Conn,
        // FIXME:
        // this.playerKeypair.publicKey,
        new PublicKey("ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv"),
        swapInfo.fromCoinType,
        swapInfo.fromCoinOwnerProgramId
      );
      if (!amount || amount.lte(new BN(0))) {
        this.logger.error(
          `[copyTradeHandleOnSellStrategyWithSol][${strategyName}] Cannot get sell amount from ${swapInfo.fromCoinType.toBase58()}`
        );
        continue;
      }
      const sellPercent = new BN(
        strategy.fixedPercentage ||
          swapInfo.fromCoinAmount.div(swapInfo.fromCoinPreBalance)
      );
      const sellAmount = amount.mul(sellPercent);
      if (sellAmount.lte(new BN(0))) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Sell amount is zero: ${strategyName}`
        );
        continue;
      }
      const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
        inputMint: swapInfo.fromCoinType,
        outputMint: COIN_TYPE_WSOL_MINT,
        amount: sellAmount,
        slippageBps: strategy.slippageBps,
      });
      if (!getQuoteV1Res.success) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot parse strategy: ${strategyName}`
        );
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot get quote: ${strategyName}`
        );
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Quote data not found: ${strategyName}`
        );
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        // FIXME:
        // userPublicKey: this.playerKeypair.publicKey,
        userPublicKey: new PublicKey(
          "ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv"
        ),
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot parse quote: ${strategyName}`
        );
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot build Swap: ${strategyName}`
        );
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Swap data not found: ${strategyName}`
        );
        continue;
      }

      // Arrange: replace fee/tip
      const tx = VersionedTransaction.deserialize(
        Buffer.from(buildSwapRes.data.swapTransaction, "base64")
      );
      let builder = await TransactionBuilder.fromVersionedTxV2(
        this.solWeb3Conn,
        tx
      );
      // 1. check and create ATA for toCoinType
      const toCoinIx = await TokenHelper.getCreateIxPlayerWsolForDeposit(
        this.solWeb3Conn,
        // FIXME:
        // this.playerKeypair.publicKey,
        new PublicKey("ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv")
      );
      if (toCoinIx) {
        builder = builder.pushIxToFront(toCoinIx);
      }
      // FIXME: not sure how to calculate fee
      const currentTips = await this.jitoClient.getTipInfoV1();
      this.logger.debug(
        `[copyTradeHandleOnSellStrategyWithSol] currentTips: ${JSON.stringify(
          currentTips
        )}`
      );
      /**
      if (
        !currentTips ||
        currentTips.length === 0 ||
        !GetPercentileTip(currentTips, strategy.jitoTipPercentile)
      ) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot get tips: ${strategyName}`
        );
        continue;
      }

      const tip = GetPercentileTip(currentTips, strategy.jitoTipPercentile);
      const fee = tip * strategy.jitoTxFeeTipRatio;
      builder = builder.setComputeUnitPrice(fee);
      const builtTx = builder.build(
        await this.solWeb3Conn.getLatestBlockhash()
      );
      builtTx.sign([this.playerKeypair]);

      // Resolve: send transaction
      const sendTxRes = await this.jitoClient.sendTransactionV1(
        Buffer.from(builtTx.serialize()).toString("base64")
      );
      if (!sendTxRes) {
        this.logger.warn(
          `[copyTradeHandleOnSellStrategyWithSol] Cannot send transaction: ${strategyName}`
        );
        continue;
      }
      this.logger.info(
        `[copyTradeHandleOnSellStrategyWithSol] Transaction sent: ${strategyName}`
      );
      */
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async copyTradeHandler(subId: number, solRpcWsLogs: Logs): Promise<void> {
    // Validate
    if (solRpcWsLogs.err) {
      // this.logger.debug(
      //   `[copyTradeHandler] [Tx]${solRpcWsLogs.signature} is failed, skip.`
      // );
      return;
    }
    const isSwap = solRpcWsLogs.logs.some((log) => COMMON_DEX_REGEX.test(log));
    if (!isSwap) {
      // this.logger.debug(
      //   `[copyTradeHandler] [Tx]${solRpcWsLogs.signature} is not identified as swap, skip.`
      // );
      return;
    }

    // Resolve: target tx
    const signature = solRpcWsLogs.signature;
    // this.logger.debug(
    //   `[copyTradeHandler] Get detailed info for tx: ${signature}`
    // );
    const txRes = await safe(
      this.solWeb3Conn.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      })
    );
    if (!txRes.success) {
      this.logger.debug(`[copyTradeHandler] Failed to get tx: ${signature}`);
      return;
    }
    if (!txRes.data) {
      this.logger.debug(`[copyTradeHandler] Tx data not found: ${signature}`);
      this.logger.debug(txRes);
      return;
    }

    const swapInfoRes = await safe(
      txHelper.toSwapInfoDto(this.solWeb3Conn, subId, signature, txRes.data)
    );
    if (!swapInfoRes.success) {
      this.logger.error(
        `[copyTradeHandler] Failed to get swap info: ${signature}, ${swapInfoRes.error}`
      );
      return;
    }
    const swapInfo = swapInfoRes.data;
    if (!swapInfo.fromSol && !swapInfo.toSol) {
      this.logger.warn(
        `[copyTradeHandler] No SOL involved in swap: ${signature}`
      );
      return;
    }

    // Resolve
    this.copyTradeHandleOnBuyStrategyWithWSOL(swapInfo);
    this.copyTradeHandleOnSellStrategyWithWSOL(swapInfo);
  }

  //////////////////////////////////////////////////////////////////////////////
}
