import { Logger, TsLogLogger } from "../utils/logging";

import {
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
} from "./copyTradeHelperV2/dtos";
import { CopyTradeHelperV2 } from "./copyTradeHelperV2";
import { SolRpcWsHelper } from "./solRpcWsHelper/helper";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsSubscribeManager {
  constructor(
    private readonly solRpcWsHelper: SolRpcWsHelper,
    private readonly copyTradeHelper: CopyTradeHelperV2,
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
    const subId = await this.solRpcWsHelper.getSubId(targetPublicKey);
    this.copyTradeHelper.registerCopyTradeTargetPublicKey(subId, targetPublicKey);
    this.logger.info(`CopyTradeRecordOnBuyStrategy: ${strategyName} created`);
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
    const subId = await this.solRpcWsHelper.getSubId(targetPublicKey);
    this.copyTradeHelper.registerCopyTradeTargetPublicKey(subId, targetPublicKey);
    this.logger.info(`CopyTradeRecordOnSellStrategy: ${strategyName} created`);
  }

  // TODO: removeCopyTradeRecordOnBuyStrategy
  // TODO: removeCopyTradeRecordOnSellStrategy

  //////////////////////////////////////////////////////////////////////////////

  async gracefulStop(): Promise<void> {
    this.copyTradeHelper.clearAll4GracefulStop();
    await this.solRpcWsHelper.stop();
  }
}
