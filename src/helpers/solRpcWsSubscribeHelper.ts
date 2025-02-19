import { Logger, ConsoleLogger } from "../utils/logging";
import { CopyTradeHelper } from "./copyTradeHelper";
import { CopyTradeRecordOnBuyStrategy, CopyTradeRecordOnSellStrategy } from "./copyTradeHelper/dtos";
import { SolRpcWsHelper } from "./solRpcWsHelper/helper";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsSubscribeHelper {
  constructor(
    private readonly solRpcWsHelper: SolRpcWsHelper,
    private readonly copyTradeHelper: CopyTradeHelper,
    private readonly logger: Logger = new ConsoleLogger("SolRpcWsSubscribe"),
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  public createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy,
  ): void {
    this.logger.log(`📝 創建 CopyTradeRecordOnBuyStrategy: ${strategyName}`);
    this.copyTradeHelper.createCopyTradeRecordOnBuyStrategy(targetPublicKey, strategyName, strategy);
    this.solRpcWsHelper.updateLogsSubscription();
  }

  public createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy,
  ): void {
    this.logger.log(`📝 創建 CopyTradeRecordOnSellStrategy: ${strategyName}`);
    this.copyTradeHelper.createCopyTradeRecordOnSellStrategy(targetPublicKey, strategyName, strategy);
    this.solRpcWsHelper.updateLogsSubscription();
  }
}
