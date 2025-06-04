import type {
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
  RecordMap,
  SubIdTarPubkeyMap,
} from "./dtos";
import { FeeHelper } from "./feeHelper/helper";
import {
  StrategyManager,
  CopyTradeOrchestrator,
  JsonStrategyPersistence,
} from "./utils";

import { Connection, Keypair, Logs } from "@solana/web3.js";

import { LOG_TYPE, NOT_USE_CLI } from "../../config";

import { TsLogLogger } from "../../utils/logging";
import type { Logger } from "../../utils/logging";
import { transportFunc } from "../logHistoryHelper/helper";

import { JupSwapClient } from "../3rdParties/jup";
import { JitoClient } from "../3rdParties/jito";

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
    enablePersistence: boolean,
    persistenceDataPath: string
  ) {
    // Initialize persistence if enabled
    const persistence = enablePersistence
      ? new JsonStrategyPersistence(persistenceDataPath, this.logger)
      : undefined;

    this.strategyManager = new StrategyManager(
      this.copyTradeSubIdTarPubkeyMap,
      this.copyTradeRecordMap,
      this.logger,
      persistence
    );

    this.orchestrator = new CopyTradeOrchestrator(
      this.strategyManager,
      this.playerKeypair,
      this.solWeb3Conn,
      this.jupSwapClient,
      this.jitoClient,
      this.feeHelper,
      this.logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  public getCopyTradeTargetPublicKeys(): string[] {
    return this.strategyManager.getTargetPublicKeys();
  }

  public registerCopyTradeTargetPublicKey(
    subId: number,
    targetPublicKey: string
  ): void {
    this.strategyManager.registerSubscription(subId, targetPublicKey);
  }

  public async createCopyTradeRecordOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy
  ): Promise<boolean> {
    return await this.strategyManager.addBuyStrategy(
      targetPublicKey,
      strategyName,
      strategy
    );
  }

  public async removeCopyTradeOnBuyStrategy(
    targetPublicKey: string,
    strategyName: string
  ): Promise<boolean> {
    return await this.strategyManager.removeBuyStrategy(
      targetPublicKey,
      strategyName
    );
  }

  public async createCopyTradeRecordOnSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy
  ): Promise<boolean> {
    return await this.strategyManager.addSellStrategy(
      targetPublicKey,
      strategyName,
      strategy
    );
  }

  public async removeCopyTradeOnSellStrategy(
    targetPublicKey: string,
    strategyName: string
  ): Promise<boolean> {
    return await this.strategyManager.removeSellStrategy(
      targetPublicKey,
      strategyName
    );
  }

  public clearAll4GracefulStop(): void {
    this.logger.info("Clearing all copy trade records");
    this.strategyManager.clearAll();
  }

  /**
   * Initialize the service by loading persisted strategies
   */
  public async initialize(): Promise<void> {
    if (this.strategyManager.hasPersistence()) {
      this.logger.info("Loading persisted strategies...");
      await this.strategyManager.loadStrategies();
    } else {
      this.logger.info("Persistence disabled, starting with empty strategies");
    }
  }

  /**
   * Graceful shutdown with strategy persistence
   */
  public async gracefulShutdown(): Promise<void> {
    this.logger.info("Starting graceful shutdown...");

    try {
      if (this.strategyManager.hasPersistence()) {
        this.logger.info("Saving strategies before shutdown...");
        await this.strategyManager.saveStrategies();
      }

      this.clearAll4GracefulStop();
      this.logger.info("Graceful shutdown completed");
    } catch (error) {
      this.logger.error(`Error during graceful shutdown: ${error}`);
      throw error;
    }
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
