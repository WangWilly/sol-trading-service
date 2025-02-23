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
import {
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import BN from "bn.js";

import { safe } from "../../utils/exceptions";
import { TsLogLogger } from "../../utils/logging";
import type { Logger } from "../../utils/logging";
import * as txHelper from "../transactionHelper";
import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../3rdParties/jup";
import { TransactionBuilder } from "../transactionBuilder";
import { JitoClient } from "../3rdParties/jito";
import { GetPercentileTip } from "../3rdParties/jito";
import { COIN_TYPE_SOL_NATIVE } from "../solRpcWsClient/const";

////////////////////////////////////////////////////////////////////////////////

type AtaPubKey = PublicKey;

////////////////////////////////////////////////////////////////////////////////

export class CopyTradeHelper {
  private copyTradeRecordMap: Map<string, CopyTradeRecord> = new Map(); // publicKey -> CopyTradeRecord

  public constructor(
    private readonly playerKeypair: Keypair,
    private readonly solWeb3Conn: Connection,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly logger: Logger = new TsLogLogger({
      name: "CopyTradeHelper",
    })
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
    return true;
  }

  public clearAll4GracefulStop(): void {
    this.logger.info("Clearing all copy trade records");
    this.copyTradeRecordMap.clear();
  }

  //////////////////////////////////////////////////////////////////////////////

  private getAtaPubkey(
    mintAccountPubkey: PublicKey,
    mintOwnerProgramId: PublicKey
  ): AtaPubKey {
    const tokenAccountPubkey = getAssociatedTokenAddressSync(
      mintAccountPubkey,
      this.playerKeypair.publicKey,
      false,
      mintOwnerProgramId
    );
    return tokenAccountPubkey;
  }

  // https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-look-up-the-address-of-a-token-account#link-web3
  // https://spl.solana.com/token
  // https://spl.solana.com/token-2022/extensions
  // https://spl.solana.com/associated-token-account
  private async getPlayerTokenBalance(
    tokenAccountPubkey: AtaPubKey,
    mintOwnerProgramId: PublicKey
  ): Promise<BN | null> {
    const ata = await getAccount(
      this.solWeb3Conn,
      tokenAccountPubkey,
      "confirmed",
      mintOwnerProgramId
    );
    if (ata.owner.toBase58() !== this.playerKeypair.publicKey.toBase58()) {
      this.logger.warn(`Invalid token account owner: ${ata.owner.toBase58()}`);
      return null;
    }
    return new BN(ata.amount.toString());
  }

  //////////////////////////////////////////////////////////////////////////////

  // https://solana.com/developers/cookbook/tokens/create-token-account
  private async copyTradeHandleOnBuyStrategyWithSol(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    if (!swapInfo.toCoinType) {
      this.logger.debug(
        `[copyTradeHandleOnBuyStrategyWithSol] No toCoinType found in swapInfo, tx: ${swapInfo.txSignature}`
      );
      return;
    }
    const copyTradeRecord = this.copyTradeRecordMap.get(swapInfo.signer);
    if (!copyTradeRecord) {
      this.logger.debug(`[copyTradeHandleOnBuyStrategyWithSol] No strategy matchs the signer on [Tx]${swapInfo.txSignature}`);
      return;
    }
    const onBuyStrategiesWithSol = Array.from(
      copyTradeRecord.onBuyStrategiesMap.entries()
    ).filter((strategy) => strategy[1].sellCoinType === COIN_TYPE_SOL_NATIVE);
    if (onBuyStrategiesWithSol.length === 0) {
      this.logger.debug(`[copyTradeHandleOnBuyStrategyWithSol] No strategy is applied to [Tx]${swapInfo.txSignature}`);
      return;
    }
    this.logger.debug(`[copyTradeHandleOnBuyStrategyWithSol] onBuy w/ sol strategies processing: [Tx]${swapInfo.txSignature}`);

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
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot parse strategy: ${strategyName}`);
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot get quote: ${strategyName}`);
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Quote data not found: ${strategyName}`);
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        userPublicKey: this.playerKeypair.publicKey,
        // TODO: additional config
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot parse quote: ${strategyName}`);
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot build Swap: ${strategyName}`);
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Swap data not found: ${strategyName}`);
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
      const ataPubkey = this.getAtaPubkey(
        swapInfo.toCoinType,
        swapInfo.toCoinOwnerProgramId
      );
      const ataBalance = await this.getPlayerTokenBalance(
        ataPubkey,
        swapInfo.toCoinOwnerProgramId
      );
      if (!ataBalance) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          this.playerKeypair.publicKey,
          ataPubkey,
          this.playerKeypair.publicKey,
          swapInfo.toCoinType,
          swapInfo.toCoinOwnerProgramId
        );
        builder = builder.appendIx(createAtaIx);
      }
      const currentTips = await this.jitoClient.getTipInfoV1();
      if (
        !currentTips ||
        currentTips.length === 0 ||
        !GetPercentileTip(currentTips, strategy.jitoTipPercentile)
      ) {
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot get tips: ${strategyName}`);
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
        this.logger.warn(`[copyTradeHandleOnBuyStrategyWithSol] Cannot send transaction: ${strategyName}`);
        continue;
      }
      this.logger.info(
        `[copyTradeHandleOnBuyStrategyWithSol] Transaction sent: ${strategyName}. Followed tx sign: ${swapInfo.txSignature}. Issued tx sign: ${sendTxRes.result}.`
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async copyTradeHandleOnSellStrategyWithSol(
    swapInfo: txHelper.SwapInfoDto
  ): Promise<void> {
    // Validate
    if (!swapInfo.fromCoinType) {
      this.logger.debug(
        `[copyTradeHandleOnSellStrategyWithSol] No fromCoinType found in swapInfo, tx: ${swapInfo.txSignature}`
      );
      return;
    }
    const copyTradeRecord = this.copyTradeRecordMap.get(swapInfo.signer);
    if (!copyTradeRecord) {
      this.logger.debug(`[copyTradeHandleOnSellStrategyWithSol] No strategy matchs the signer on [Tx]${swapInfo.txSignature}`);
      return;
    }
    const onSellStrategiesWithSol = Array.from(
      copyTradeRecord.onSellStrategiesMap.entries()
    );
    if (onSellStrategiesWithSol.length === 0) {
      this.logger.debug(`[copyTradeHandleOnSellStrategyWithSol] No strategy is applied to [Tx]${swapInfo.txSignature}`);
      return;
    }
    this.logger.debug(`[copyTradeHandleOnSellStrategyWithSol] onSell w/ sol strategies processing: [Tx]${swapInfo.txSignature}`);

    // TODO: parallelize this
    for (const [strategyName, strategy] of onSellStrategiesWithSol) {
      // Resolve: use swapInfo to get quote
      const ataPubkey = this.getAtaPubkey(
        swapInfo.fromCoinType,
        swapInfo.fromCoinOwnerProgramId
      );
      const amount = await this.getPlayerTokenBalance(
        ataPubkey,
        swapInfo.fromCoinType
      );
      if (!amount || amount.lte(new BN(0))) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot get sell amount: ${strategyName}`);
        continue;
      }
      const sellPercent = new BN(
        strategy.fixedPercentage ||
          swapInfo.fromCoinAmount.div(swapInfo.fromCoinPreBalance)
      );
      const sellAmount = amount.mul(sellPercent);
      if (sellAmount.lte(new BN(0))) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Sell amount is zero: ${strategyName}`);
        continue;
      }
      const getQuoteV1Res = GetQuoteV1ParamDtoSchema.safeParse({
        inputMint: swapInfo.fromCoinType,
        outputMint: COIN_TYPE_SOL_NATIVE,
        amount: sellAmount,
        slippageBps: strategy.slippageBps,
      });
      if (!getQuoteV1Res.success) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot parse strategy: ${strategyName}`);
        continue;
      }
      const quoteRes = await safe(
        this.jupSwapClient.getQuote(getQuoteV1Res.data)
      );
      if (!quoteRes.success) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot get quote: ${strategyName}`);
        continue;
      }
      if (!quoteRes.data) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Quote data not found: ${strategyName}`);
        continue;
      }

      // Resolve: build swap transaction
      const buildSwapV1BodyDtoRes = BuildSwapV1BodyDtoSchema.safeParse({
        quoteResponse: quoteRes.data,
        userPublicKey: this.playerKeypair.publicKey,
      });
      if (!buildSwapV1BodyDtoRes.success) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot parse quote: ${strategyName}`);
        continue;
      }
      const buildSwapRes = await safe(
        this.jupSwapClient.buildSwapTx(buildSwapV1BodyDtoRes.data)
      );
      if (!buildSwapRes.success) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot build Swap: ${strategyName}`);
        continue;
      }
      if (!buildSwapRes.data) {
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Swap data not found: ${strategyName}`);
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
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot get tips: ${strategyName}`);
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
        this.logger.warn(`[copyTradeHandleOnSellStrategyWithSol] Cannot send transaction: ${strategyName}`);
        continue;
      }
      this.logger.info(`[copyTradeHandleOnSellStrategyWithSol] Transaction sent: ${strategyName}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async copyTradeHandler(subId: number, solRpcWsLogs: Logs): Promise<void> {
    // Validate
    if (solRpcWsLogs.err) {
      this.logger.debug(`[copyTradeHandler] [Tx]${solRpcWsLogs.signature} is failed, skip.`);
      return;
    }
    // TODO: need improvement maybe
    const isSwap = solRpcWsLogs.logs.some((log) =>
      Array.from(COMMON_DEX_POOLS).some((dexPool) => log.includes(dexPool))
    );
    if (!isSwap) {
      this.logger.debug(`[copyTradeHandler] [Tx]${solRpcWsLogs.signature} is not identified as swap, skip.`);
      return;
    }

    // Resolve: target tx
    const signature = solRpcWsLogs.signature;
    this.logger.debug(`[copyTradeHandler] Get detailed info for tx: ${signature}`);
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
      this.logger.warn(`[copyTradeHandler] No SOL involved in swap: ${signature}`);
      return;
    }

    // Resolve
    this.copyTradeHandleOnBuyStrategyWithSol(swapInfo);
    this.copyTradeHandleOnSellStrategyWithSol(swapInfo);
  }

  //////////////////////////////////////////////////////////////////////////////
}
