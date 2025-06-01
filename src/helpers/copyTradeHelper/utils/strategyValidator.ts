import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type * as txHelper from "../../transactionHelper";
import type {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "../dtos";
import { COIN_TYPE_WSOL_MINT } from "../../solRpcWsClient/const";
import { TokenHelper } from "../tokenHelper";
import { FULL_SELLING_BPS } from "../../../utils/constants";
import type { Logger } from "../../../utils/logging";

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

/**
 * Validates and prepares copy trade strategies for execution
 */
export class StrategyValidator {
  constructor(
    private readonly connection: Connection,
    private readonly playerPublicKey: PublicKey,
    private readonly logger: Logger,
  ) {}

  /**
   * Validate and get applicable buy strategies
   */
  getBuyStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: CopyTradeRecord,
  ): BuyStrategyContext[] {
    // Validate swap info
    if (!swapInfo.toCoinType || swapInfo.toSol) {
      return [];
    }

    // Filter strategies that match WSOL selling
    const applicableStrategies = Array.from(
      copyTradeRecord.onBuyStrategiesMap.entries(),
    ).filter(([_, strategy]) => strategy.sellCoinType.equals(COIN_TYPE_WSOL_MINT));

    if (applicableStrategies.length === 0) {
      this.logger.debug(
        `No buy strategies applicable for tx: ${swapInfo.txSignature}`,
      );
      return [];
    }

    return applicableStrategies.map(([strategyName, strategy]) => ({
      swapInfo,
      strategy,
      strategyName,
    }));
  }

  /**
   * Validate and get applicable sell strategies with calculated amounts
   */
  async getSellStrategies(
    swapInfo: txHelper.SwapInfoDto,
    copyTradeRecord: CopyTradeRecord,
  ): Promise<Array<SellStrategyContext>> {
    // Validate swap info
    if (!swapInfo.fromCoinType || swapInfo.fromSol) {
      return [];
    }

    const strategies = Array.from(copyTradeRecord.onSellStrategiesMap.entries());
    if (strategies.length === 0) {
      this.logger.debug(
        `No sell strategies applicable for tx: ${swapInfo.txSignature}`,
      );
      return [];
    }

    // Get player token balance
    const playerBalance = await TokenHelper.getPlayerTokenBalanceForSell(
      this.connection,
      this.playerPublicKey,
      swapInfo.fromCoinType,
      swapInfo.fromCoinOwnerProgramId,
    );

    if (!playerBalance || playerBalance.lte(new BN(0))) {
      this.logger.error(
        `No token balance for sell from mint: ${swapInfo.fromCoinType.toBase58()}`,
      );
      return [];
    }

    if (swapInfo.fromCoinPreBalance.isZero()) {
      this.logger.error(
        `Invalid fromCoinPreBalance for tx: ${swapInfo.txSignature}`,
      );
      return [];
    }

    const results: Array<SellStrategyContext> = [];

    for (const [strategyName, strategy] of strategies) {
      const sellAmount = this.calculateSellAmount(
        playerBalance,
        strategy,
        swapInfo,
      );

      if (sellAmount.lte(new BN(0))) {
        this.logger.error(
          `Invalid sell amount for strategy ${strategyName}, tx: ${swapInfo.txSignature}`,
        );
        continue;
      }

      results.push({
        swapInfo,
        strategy,
        strategyName,
        sellAmount,
      });
    }

    return results;
  }

  private calculateSellAmount(
    playerBalance: BN,
    strategy: CopyTradeRecordOnSellStrategy,
    swapInfo: txHelper.SwapInfoDto,
  ): BN {
    if (strategy.fixedSellingBps) {
      return playerBalance.muln(strategy.fixedSellingBps).divn(FULL_SELLING_BPS);
    } else {
      return playerBalance
        .mul(swapInfo.fromCoinAmount)
        .div(swapInfo.fromCoinPreBalance);
    }
  }
}
