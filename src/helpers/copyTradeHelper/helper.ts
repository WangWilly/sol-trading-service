import type {
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
  RecordMap,
  SubIdTarPubkeyMap,
} from "./dtos";

import { Connection, Keypair, Logs } from "@solana/web3.js";

import { TsLogLogger } from "../../utils/logging";
import { LOG_TYPE, NOT_USE_CLI } from "../../config";
import type { Logger } from "../../utils/logging";
import { JupSwapClient } from "../3rdParties/jup";
import { JitoClient } from "../3rdParties/jito";
import { FeeHelper } from "./feeHelper/helper";
import { transportFunc } from "../logHistoryHelper/helper";
import { StrategyManager, CopyTradeOrchestrator } from "./utils";

////////////////////////////////////////////////////////////////////////////////

export class CopyTradeHelper {
  private readonly copyTradeSubIdTarPubkeyMap: SubIdTarPubkeyMap = new Map();
  private readonly copyTradeRecordMap: RecordMap = new Map();
  private readonly strategyManager: StrategyManager;
  private readonly orchestrator: CopyTradeOrchestrator;

  public constructor(
    private readonly playerKeypair: Keypair,
    private readonly solWeb3Conn: Connection,
    private readonly jupSwapClient: JupSwapClient,
    private readonly jitoClient: JitoClient,
    private readonly feeHelper: FeeHelper,
    private readonly logger: Logger = new TsLogLogger({
      name: "CopyTradeHelper",
      type: LOG_TYPE,
      overwrite: {
        transportJSON: NOT_USE_CLI
          ? undefined
          : (json: unknown) => {
              transportFunc(json);
            },
      },
    }),
  ) {
    this.strategyManager = new StrategyManager(
      this.copyTradeSubIdTarPubkeyMap,
      this.copyTradeRecordMap,
      this.logger,
    );

    this.orchestrator = new CopyTradeOrchestrator(
      this.strategyManager,
      this.playerKeypair,
      this.solWeb3Conn,
      this.jupSwapClient,
      this.jitoClient,
      this.feeHelper,
      this.logger,
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  public getCopyTradeTargetPublicKeys(): string[] {
    return this.strategyManager.getTargetPublicKeys();
  }

  public registerCopyTradeTargetPublicKey(
    subId: number,
    targetPublicKey: string,
  ): void {
    this.strategyManager.registerSubscription(subId, targetPublicKey);
  }

  public createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy,
  ): boolean {
    return this.strategyManager.addBuyStrategy(targetPublicKey, strategyName, strategy);
  }

  public removeCopyTradeOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
  ): boolean {
    return this.strategyManager.removeBuyStrategy(targetPublicKey, strategyName);
  }

  public createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy,
  ): boolean {
    return this.strategyManager.addSellStrategy(targetPublicKey, strategyName, strategy);
  }

  public removeCopyTradeOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
  ): boolean {
    return this.strategyManager.removeSellStrategy(targetPublicKey, strategyName);
  }

  public clearAll4GracefulStop(): void {
    this.logger.info("Clearing all copy trade records");
    this.strategyManager.clearAll();
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Main entry point for processing copy trade transactions
   * Now delegates to the orchestrator for cleaner separation of concerns
   */
  async copyTradeHandler(subId: number, solRpcWsLogs: Logs): Promise<void> {
    await this.orchestrator.processTransaction(subId, solRpcWsLogs);
  }

  //////////////////////////////////////////////////////////////////////////////
}
