import {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "./dtos";
import { COMMON_DEX_POOLS } from "./const";

import {
  Connection,
  Keypair,
  Logs,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import BN from "bn.js";

import { safe } from "../../utils/exceptions";
import { ConsoleLogger, Logger } from "../../utils/logging";
import * as txHelper from "../transactionHelper";
import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../3rdParties/jup";
import { TransactionBuilder } from "../transactionBuilder";
import { JitoClient } from "../3rdParties/jito";
import { GetPercentileTip } from "../3rdParties/jito";

////////////////////////////////////////////////////////////////////////////////

export class CopyTradeHelper {
  private copyTradeRecordMap: Map<string, CopyTradeRecord> = new Map(); // publicKey -> CopyTradeRecord

  public constructor(
    private readonly playerKeypair: Keypair,
    private readonly solWeb3Conn: Connection,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly logger: Logger = new ConsoleLogger("CopyTradeHelper")
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  public getCopyTradeTargetPublicKeys(): string[] {
    return Array.from(this.copyTradeRecordMap.keys());
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
    this.logger.warn(`🚨 策略 ${strategyName} 已存在`);
    return false;
  }

  public removeCopyTradeOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.logger.warn(`🚨 未找到目標 ${targetPublicKey}`);
      return false;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onBuyStrategiesMap.get(strategyName)
    ) {
      this.logger.warn(`🚨 策略 ${strategyName} 不存在`);
      return false;
    }
    this.copyTradeRecordMap
      .get(targetPublicKey)!
      .onBuyStrategiesMap.delete(strategyName);
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
    this.logger.warn(`🚨 策略 ${strategyName} 已存在`);
    return false;
  }

  public removeCopyTradeOnSellStrategy(
    targetPublicKey: string,
    strategyName: string
  ): boolean {
    if (!this.copyTradeRecordMap.get(targetPublicKey)) {
      this.logger.warn(`🚨 未找到目標 ${targetPublicKey}`);
      return false;
    }
    if (
      !this.copyTradeRecordMap
        .get(targetPublicKey)!
        .onSellStrategiesMap.get(strategyName)
    ) {
      this.logger.warn(`🚨 策略 ${strategyName} 不存在`);
      return false;
    }
    this.copyTradeRecordMap
      .get(targetPublicKey)!
      .onSellStrategiesMap.delete(strategyName);
    return true;
  }

  public clearAll4GracefulStop(): void {
    this.logger.log("Clearing all copy trade records");
    this.copyTradeRecordMap.clear();
  }

  //////////////////////////////////////////////////////////////////////////////

  private async copyTradeHandleOnBuyStrategyWithSol(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    const copyTradeRecord = this.copyTradeRecordMap.get(swapInfo.signer);
    if (!copyTradeRecord) {
      return;
    }
    const onBuyStrategiesWithSol = Array.from(
      copyTradeRecord.onBuyStrategiesMap.entries()
    ).filter((strategy) => strategy[1].sellCoinType === "SOL");
    if (onBuyStrategiesWithSol.length === 0) {
      return;
    }

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
        this.logger.warn(`❌ 無法解析 strategy: ${strategyName}`);
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(`❌ 無法取得 quote: ${strategyName}`);
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(`❌ quote 不存在: ${strategyName}`);
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        userPublicKey: this.playerKeypair.publicKey,
        // TODO: additional config
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(`❌ 無法解析 quote: ${strategyName}`);
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(`❌ 無法建立 Swap: ${strategyName}`);
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(`❌ Swap 不存在: ${strategyName}`);
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
      const currentTips = await this.jitoClient.getTipInfoV1();
      if (
        !currentTips ||
        currentTips.length === 0 ||
        !GetPercentileTip(currentTips, strategy.jitoTipPercentile)
      ) {
        this.logger.warn(`❌ 無法取得 tips: ${strategyName}`);
        continue;
      }
      // TODO: not sure how to calculate fee
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
        this.logger.warn(`❌ 無法發送交易: ${strategyName}`);
        continue;
      }
      this.logger.log(`✅ 交易已發送: ${strategyName}. ${sendTxRes.result}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  // TODO:
  private async getPlayerTokenBalance(
    tokenAccountPubkey: PublicKey
  ): Promise<BN> {
    const tokenAccount = await getAccount(this.solWeb3Conn, tokenAccountPubkey);
    if (!tokenAccount) {
      return new BN(0);
    }
    return new BN(tokenAccount.amount.toString());
  }

  private async copyTradeHandleOnSellStrategyWithSol(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    const copyTradeRecord = this.copyTradeRecordMap.get(swapInfo.signer);
    if (!copyTradeRecord) {
      return;
    }
    const onSellStrategiesWithSol = Array.from(
      copyTradeRecord.onSellStrategiesMap.entries()
    );
    if (onSellStrategiesWithSol.length === 0) {
      return;
    }

    // TODO: parallelize this
    for (const [strategyName, strategy] of onSellStrategiesWithSol) {
      // Resolve: use swapInfo to get quote
      const amount = await this.getPlayerTokenBalance(
        new PublicKey(swapInfo.fromCoinType)
      );
      if (amount.lte(new BN(0))) {
        this.logger.warn(`❌ 無法取得 token: ${strategyName}`);
        continue;
      }
      const sellPercent = new BN(
        strategy.fixedPercentage ||
          swapInfo.fromCoinAmount.div(swapInfo.fromCoinPreBalance)
      );
      const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
        inputMint: swapInfo.fromCoinType,
        outputMint: "SOL",
        amount: amount.mul(sellPercent),
        slippageBps: strategy.slippageBps,
      });
      if (!getQuoteV1Res.success) {
        this.logger.warn(`❌ 無法解析 strategy: ${strategyName}`);
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(`❌ 無法取得 quote: ${strategyName}`);
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(`❌ quote 不存在: ${strategyName}`);
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        userPublicKey: this.playerKeypair.publicKey,
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(`❌ 無法解析 quote: ${strategyName}`);
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(`❌ 無法建立 Swap: ${strategyName}`);
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(`❌ Swap 不存在: ${strategyName}`);
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
      const currentTips = await this.jitoClient.getTipInfoV1();
      if (
        !currentTips ||
        currentTips.length === 0 ||
        !GetPercentileTip(currentTips, strategy.jitoTipPercentile)
      ) {
        this.logger.warn(`❌ 無法取得 tips: ${strategyName}`);
        continue;
      }
      // TODO: not sure how to calculate fee
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
        this.logger.warn(`❌ 無法發送交易: ${strategyName}`);
        continue;
      }
      this.logger.log(`✅ 交易已發送: ${strategyName}. ${sendTxRes.result}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async copyTradeHandler(solRpcWsLogs: Logs): Promise<void> {
    // Validate
    // TODO: need improvement maybe
    const isSwap = solRpcWsLogs.logs.some((log) =>
      Array.from(COMMON_DEX_POOLS).some((dexPool) => log.includes(dexPool))
    );
    if (!isSwap) {
      return;
    }

    // Resolve: target tx
    const signature = solRpcWsLogs.signature;
    this.logger.log(`🔄 目標地址正在 Swap，開始跟單，交易哈希: ${signature}`);
    const txRes = await safe(this.solWeb3Conn.getParsedTransaction(signature));
    if (!txRes.success) {
      this.logger.warn(`❌ 無法解析交易: ${signature}`);
      return;
    }
    if (!txRes.data) {
      this.logger.warn(`❌ 交易不存在: ${signature}`);
      return;
    }

    const swapInfo = txHelper.toSwapInfoDto(txRes.data);
    if (!swapInfo) {
      this.logger.warn(`❌ 無法解析 SwapInfo: ${signature}`);
      return;
    }
    if (!swapInfo.solChanging) {
      this.logger.warn(`❌ 交易不涉及 SOL: ${signature}`);
      return;
    }

    // Resolve
    this.copyTradeHandleOnBuyStrategyWithSol(swapInfo);
    this.copyTradeHandleOnSellStrategyWithSol(swapInfo);
  }

  //////////////////////////////////////////////////////////////////////////////
}
