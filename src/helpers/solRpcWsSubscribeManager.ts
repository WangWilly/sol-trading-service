import { Logger, TsLogLogger } from "../utils/logging";

import {
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "./copyTradeHelper/dtos";
import { CopyTradeHelper } from "./copyTradeHelper";
import { SolRpcWsHelper } from "./solRpcWsClient/client";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsSubscribeManager {
  constructor(
    private readonly solRpcWsHelper: SolRpcWsHelper,
    private readonly copyTradeHelper: CopyTradeHelper,
    private readonly logger: Logger = new TsLogLogger({
      name: "SolRpcWsSubscribe",
    })
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  async createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy
  ): Promise<void> {
    this.logger.info(`Creating CopyTradeRecordOnBuyStrategy: ${strategyName}`);
    this.copyTradeHelper.createCopyTradeRecordOnBuyStrategy(
      targetPublicKey,
      strategyName,
      strategy
    );
    this.solRpcWsHelper.updateLogsSubscription();
  }

  async createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy
  ): Promise<void> {
    this.logger.info(`Create CopyTradeRecordOnSellStrategy: ${strategyName}`);
    this.copyTradeHelper.createCopyTradeRecordOnSellStrategy(
      targetPublicKey,
      strategyName,
      strategy
    );
    this.solRpcWsHelper.updateLogsSubscription();
  }

  // TODO: removeCopyTradeRecordOnBuyStrategy
  // TODO: removeCopyTradeRecordOnSellStrategy

  //////////////////////////////////////////////////////////////////////////////

  async gracefulStop(): Promise<void> {
    this.copyTradeHelper.clearAll4GracefulStop();
    await this.solRpcWsHelper.stop();
  }
}
