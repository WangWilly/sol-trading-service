import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "../dtos";

import type { Logger } from "../../../utils/logging";

import type * as txHelper from "../../transactionHelper";
import { TokenHelper } from "../../tokenHelper";
import { FULL_SELLING_BPS } from "../../../utils/constants";

////////////////////////////////////////////////////////////////////////////////

export interface BuyStrategyContext {
  swapInfo: txHelper.SwapInfoDto;
  strategy: CopyTradeRecordOnBuyStrategy;
  strategyName: string;
}

export interface SellStrategyContext {
  swapInfo: txHelper.SwapInfoDto;
  strategy: CopyTradeRecordOnSellStrategy;
  strategyName: string;
  sellAmount: BN;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates and prepares copy trade strategies for execution
 */
export class StrategyValidator {
  constructor(
    private readonly connection: Connection,
    private readonly playerPublicKey: PublicKey,
    private readonly logger: Logger
  ) {}

  /**
   * Validate and get applicable buy strategies
   */
  async getBuyStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: CopyTradeRecord
  ): Promise<BuyStrategyContext[]> {
    // Validate swap info
    if (!swapInfo.toCoinType || swapInfo.toSol) {
      return [];
    }
    if (!swapInfo.fromCoinType) {
      this.logger.error(
        `Invalid swap info for buy strategy, tx: ${swapInfo.txSignature}`
      );
      return [];
    }

    const applicableStrategies = Array.from(
      copyTradeRecord.onBuyStrategiesMap.entries()
    ).filter(([_, strategy]) =>
      strategy.sellCoinType.equals(swapInfo.fromCoinType!)
    );

    if (applicableStrategies.length === 0) {
      this.logger.debug(
        `No buy strategies applicable for tx: ${swapInfo.txSignature}`
      );
      return [];
    }

    // Get player Quote token balance
    let playerBalance = await TokenHelper.getUserQuoteBalance(
      this.connection,
      this.playerPublicKey,
      swapInfo.fromCoinType
    );

    if (!playerBalance || playerBalance.lte(new BN(0))) {
      this.logger.error(
        `No token balance for buy from mint: ${swapInfo.fromCoinType.toBase58()}`
      );
      return [];
    }

    if (swapInfo.fromCoinPreBalance.isZero()) {
      this.logger.error(
        `Invalid fromCoinPreBalance for tx: ${swapInfo.txSignature}`
      );
      return [];
    }

    const results: Array<BuyStrategyContext> = [];
    for (const [strategyName, strategy] of applicableStrategies) {
      // Calculate buy amount based on strategy
      if (playerBalance.lt(strategy.sellCoinAmount)) {
        this.logger.error(
          `Insufficient balance for strategy ${strategyName}, tx: ${swapInfo.txSignature}`
        );
        continue;
      }
      playerBalance = playerBalance.sub(strategy.sellCoinAmount);

      results.push({
        swapInfo,
        strategy,
        strategyName,
      });
    }

    return results;
  }

  /**
   * Validate and get applicable sell strategies with calculated amounts
   */
  async getSellStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: CopyTradeRecord
  ): Promise<Array<SellStrategyContext>> {
    // Validate swap info
    if (!swapInfo.fromCoinType || swapInfo.fromSol) {
      return [];
    }

    const strategies = Array.from(
      copyTradeRecord.onSellStrategiesMap.entries()
    );
    if (strategies.length === 0) {
      this.logger.debug(
        `No sell strategies applicable for tx: ${swapInfo.txSignature}`
      );
      return [];
    }

    // Get player token balance
    let playerBalance = await TokenHelper.getUserTokenBalance(
      this.connection,
      this.playerPublicKey,
      swapInfo.fromCoinType,
      swapInfo.fromCoinOwnerProgramId
    );

    if (!playerBalance || playerBalance.lte(new BN(0))) {
      this.logger.error(
        `No token balance for sell from mint: ${swapInfo.fromCoinType.toBase58()}`
      );
      return [];
    }

    if (swapInfo.fromCoinPreBalance.isZero()) {
      this.logger.error(
        `Invalid fromCoinPreBalance for tx: ${swapInfo.txSignature}`
      );
      return [];
    }

    const results: Array<SellStrategyContext> = [];
    for (const [strategyName, strategy] of strategies) {
      const sellAmount = StrategyValidator.calculateSellAmount(
        playerBalance,
        strategy,
        swapInfo
      );

      if (sellAmount.lte(new BN(0))) {
        this.logger.error(
          `Invalid sell amount for strategy ${strategyName}, tx: ${swapInfo.txSignature}`
        );
        continue;
      }

      if (playerBalance.lt(sellAmount)) {
        this.logger.error(
          `Insufficient balance for strategy ${strategyName}, tx: ${swapInfo.txSignature}`
        );
        continue;
      }
      playerBalance = playerBalance.sub(sellAmount);

      results.push({
        swapInfo,
        strategy,
        strategyName,
        sellAmount,
      });
    }

    return results;
  }

  //////////////////////////////////////////////////////////////////////////////

  private static calculateSellAmount(
    playerBalance: BN,
    strategy: CopyTradeRecordOnSellStrategy,
    swapInfo: txHelper.SwapInfoDto
  ): BN {
    if (strategy.fixedSellingBps) {
      return playerBalance
        .muln(strategy.fixedSellingBps)
        .divn(FULL_SELLING_BPS);
    }

    return playerBalance
      .mul(swapInfo.fromCoinAmount)
      .div(swapInfo.fromCoinPreBalance);
  }
}
