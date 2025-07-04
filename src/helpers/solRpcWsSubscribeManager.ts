import { Logger } from "../utils/logging";


import { SolRpcWsHelper } from "./solRpcWsClient/client";

import {
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "./copyTradeHelper/dtos";
import { CopyTradeHelper } from "./copyTradeHelper";

////////////////////////////////////////////////////////////////////////////////

// Define interface for the strategy object returned to CLI
interface CopyTradeStrategy {
  id: string;
  name: string;
  type: "Buy" | "Sell";
  targetWallet: string;
  config: any;
}

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsSubscribeManager {
  constructor(
    private readonly solRpcWsHelper: SolRpcWsHelper,
    private readonly copyTradeHelper: CopyTradeHelper,
    private readonly logger: Logger,
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  async createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy,
  ): Promise<void> {
    this.logger.info(`Creating CopyTradeRecordOnBuyStrategy: ${strategyName}`);
    await this.copyTradeHelper.createCopyTradeRecordOnBuyStrategy(
      targetPublicKey,
      strategyName,
      strategy,
    );
    this.solRpcWsHelper.updateLogsSubscription();
  }

  async createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy,
  ): Promise<void> {
    this.logger.info(`Create CopyTradeRecordOnSellStrategy: ${strategyName}`);
    await this.copyTradeHelper.createCopyTradeRecordOnSellStrategy(
      targetPublicKey,
      strategyName,
      strategy,
    );
    this.solRpcWsHelper.updateLogsSubscription();
  }

  // Get all copy trade records for CLI display
  getAllCopyTradeRecords(): CopyTradeStrategy[] {
    const strategies: CopyTradeStrategy[] = [];
    const targetPublicKeys =
      this.copyTradeHelper.getCopyTradeTargetPublicKeys();

    // Access the private copyTradeRecordMap through a special accessor method
    const copyTradeRecordMap = this.copyTradeHelper["copyTradeRecordMap"];

    if (!copyTradeRecordMap) {
      this.logger.error("Unable to access copyTradeRecordMap");
      return [];
    }

    for (const targetPublicKey of targetPublicKeys) {
      const record = copyTradeRecordMap.get(targetPublicKey);

      if (!record) continue;

      // Process buy strategies
      record.onBuyStrategiesMap.forEach((config, name) => {
        strategies.push({
          id: `${targetPublicKey}-buy-${name}`,
          name,
          type: "Buy",
          targetWallet: targetPublicKey,
          config: {
            sellCoinType: config.sellCoinType.toString(),
            sellCoinAmount: config.sellCoinAmount.toString(),
            slippageBps: config.slippageBps,
          },
        });
      });

      // Process sell strategies
      record.onSellStrategiesMap.forEach((config, name) => {
        strategies.push({
          id: `${targetPublicKey}-sell-${name}`,
          name,
          type: "Sell",
          targetWallet: targetPublicKey,
          config: {
            fixedSellingBps: config.fixedSellingBps,
            slippageBps: config.slippageBps,
          },
        });
      });
    }

    return strategies;
  }

  // Remove a strategy by its ID
  async removeCopyTradeRecord(id: string): Promise<boolean> {
    const [targetWallet, type, strategyName] = RegExp(
      /^(.*?)-(buy|sell)-(.*)$/,
    ).exec(id)?.slice(1) || [];

    if (type === "buy") {
      const result = await this.copyTradeHelper.removeCopyTradeOnBuyStrategy(
        targetWallet,
        strategyName,
      );
      if (result) {
        this.solRpcWsHelper.updateLogsSubscription();
      }
      return result;
    } else if (type === "sell") {
      const result = await this.copyTradeHelper.removeCopyTradeOnSellStrategy(
        targetWallet,
        strategyName,
      );
      if (result) {
        this.solRpcWsHelper.updateLogsSubscription();
      }
      return result;
    }

    return false;
  }

  //////////////////////////////////////////////////////////////////////////////

  async gracefulStop(): Promise<void> {
    this.copyTradeHelper.clearAll4GracefulStop();
    await this.solRpcWsHelper.stop();
  }
}
