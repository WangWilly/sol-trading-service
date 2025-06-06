import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { Logger } from "../../utils/logging";
import { TsLogLogger } from "../../utils/logging";
import { transportFunc } from "../logHistoryHelper/helper";
import { LOG_TYPE, NOT_USE_CLI } from "../../config";

import { JupSwapClient } from "../3rdParties/jup";
import { JitoClient } from "../3rdParties/jito";
import { FeeHelper } from "../feeHelper/helper";

import {
  ArbitrageConfig,
  ArbitrageConfigSchema,
  ArbitrageOpportunity,
  ArbitrageExecutionParams,
  ArbitrageExecutionResult,
  ArbitrageStats,
  ArbitrageHistoryEntry,
  ArbitrageHelperData,
} from "./dtos";

import {
  ArbitrageDetector,
  ArbitrageExecutor,
  JsonArbitragePersistence,
  IArbitragePersistence,
} from "./utils";

import { COIN_TYPE_WSOL_MINT, COIN_TYPE_USDC_MINT } from "../../utils/constants";
import { ResultUtils } from "../../utils/result";
import { UUID } from "../../utils/uuid";

////////////////////////////////////////////////////////////////////////////////
// Default Configuration
////////////////////////////////////////////////////////////////////////////////

const DEFAULT_CONFIG: ArbitrageConfig = {
  tokenA: COIN_TYPE_USDC_MINT,
  tokenB: COIN_TYPE_WSOL_MINT,
  tradeAmount: new BN(1000000), // 1 USDC
  minProfitBps: 50, // 0.5%
  maxSlippageBps: 300, // 3%
  checkIntervalMs: 5000,
  maxExecutionTimeMs: 30000,
  maxFailureCount: 3,
  pauseDurationMs: 60000,
  jitoTipPercentile: "landed_tips_95th_percentile",
  enableParallelExecution: true,
  maxConcurrentSwaps: 2,
};

const DEFAULT_STATS: ArbitrageStats = {
  totalOpportunitiesFound: 0,
  totalExecutedArbitrages: 0,
  totalSuccessfulArbitrages: 0,
  totalFailedArbitrages: 0,
  totalProfit: new BN(0),
  averageProfitBps: 0,
  averageExecutionTimeMs: 0,
  consecutiveFailures: 0,
  isPaused: false,
};

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Helper
////////////////////////////////////////////////////////////////////////////////

export class ArbitrageHelper {
  private config: ArbitrageConfig;
  private stats: ArbitrageStats;
  private history: ArbitrageHistoryEntry[] = [];

  private readonly detector: ArbitrageDetector;
  private readonly executor: ArbitrageExecutor;
  private readonly persistence: IArbitragePersistence;
  private readonly logger: Logger;

  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor(
    readonly connection: Connection,
    readonly keypair: Keypair,
    readonly jupSwapClient: JupSwapClient,
    readonly jitoClient: JitoClient,
    readonly feeHelper: FeeHelper,
    config?: Partial<ArbitrageConfig>,
    persistence?: IArbitragePersistence
  ) {
    this.logger = new TsLogLogger({
      name: "ArbitrageHelper",
      type: LOG_TYPE,
      overwrite: {
        transportJSON: NOT_USE_CLI
          ? undefined
          : (json: unknown) => {
              transportFunc(json);
            },
      },
    });
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = { ...DEFAULT_STATS };

    this.detector = new ArbitrageDetector(jupSwapClient, this.logger);
    this.executor = new ArbitrageExecutor(
      connection,
      keypair,
      jupSwapClient,
      jitoClient,
      feeHelper,
      this.logger
    );
    this.persistence = persistence || new JsonArbitragePersistence(this.logger);

    this.logger.info("ArbitrageHelper initialized");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Lifecycle Management
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Initialize the arbitrage helper by loading persisted data
   */
  async initialize(): Promise<void> {
    try {
      const savedData = await this.persistence.loadData();
      if (savedData) {
        this.config = savedData.config;
        this.stats = savedData.stats;
        this.history = savedData.history;
        this.logger.info("Arbitrage data loaded from persistence");
      } else {
        this.logger.info("No persisted arbitrage data found, using defaults");
      }
    } catch (error) {
      this.logger.error(`Failed to initialize arbitrage helper: ${error}`);
      throw error;
    }
  }

  /**
   * Start the arbitrage monitoring loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Arbitrage helper is already running");
      return;
    }

    // Check if we're in a pause period
    if (this.stats.isPaused && this.stats.pauseEndTime && Date.now() < this.stats.pauseEndTime) {
      const remainingPause = this.stats.pauseEndTime - Date.now();
      this.logger.info(`Arbitrage is paused for ${Math.round(remainingPause / 1000)}s more`);
      return;
    }

    // Clear pause state if pause period has ended
    if (this.stats.isPaused && this.stats.pauseEndTime && Date.now() >= this.stats.pauseEndTime) {
      this.stats.isPaused = false;
      this.stats.pauseEndTime = undefined;
      this.stats.consecutiveFailures = 0;
      this.logger.info("Pause period ended, resuming arbitrage monitoring");
    }

    this.isRunning = true;
    this.logger.info(`Starting arbitrage monitoring with ${this.config.checkIntervalMs}ms interval`);
    
    // Start the monitoring loop
    this.intervalId = setInterval(() => {
      this.monitorAndExecute().catch(error => {
        this.logger.error(`Error in arbitrage monitoring loop: ${error}`);
      });
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop the arbitrage monitoring loop
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    await this.saveData();
    this.logger.info("Arbitrage monitoring stopped");
  }

  /**
   * Graceful shutdown with data persistence
   */
  async gracefulShutdown(): Promise<void> {
    await this.stop();
    this.logger.info("Arbitrage helper shutdown complete");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Configuration Management
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get current configuration
   */
  getConfig(): ArbitrageConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<ArbitrageConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = ArbitrageConfigSchema.parse({ ...this.config, ...updates });
    
    await this.saveData();
    this.logger.info("Arbitrage configuration updated");

    // Restart monitoring if interval changed
    if (this.isRunning && oldConfig.checkIntervalMs !== this.config.checkIntervalMs) {
      await this.stop();
      await this.start();
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.saveData();
    this.logger.info("Arbitrage configuration reset to defaults");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Statistics and History
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get current statistics
   */
  getStats(): ArbitrageStats {
    return { ...this.stats };
  }

  /**
   * Check if arbitrage is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get arbitrage history
   */
  getHistory(limit?: number): ArbitrageHistoryEntry[] {
    const sortedHistory = [...this.history].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sortedHistory.slice(0, limit) : sortedHistory;
  }

  /**
   * Clear arbitrage history
   */
  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveData();
    this.logger.info("Arbitrage history cleared");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Manual Operations
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Manually check for arbitrage opportunities
   */
  async checkOpportunity(): Promise<ArbitrageOpportunity | null> {
    return this.detector.detectOpportunity(this.config);
  }

  /**
   * Manually execute an arbitrage opportunity
   */
  async executeOpportunity(
    opportunity: ArbitrageOpportunity,
    slippageBps?: number
  ): Promise<ArbitrageExecutionResult> {
    const params: ArbitrageExecutionParams = {
      opportunity,
      slippageBps: slippageBps || this.config.maxSlippageBps,
      jitoTipPercentile: this.config.jitoTipPercentile,
      enableParallelExecution: this.config.enableParallelExecution,
    };

    const result = await this.executor.executeArbitrage(params);
    await this.recordExecution(opportunity, result);
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private Methods
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Main monitoring and execution loop
   */
  private async monitorAndExecute(): Promise<void> {
    if (this.stats.isPaused) {
      return;
    }

    try {
      // Detect opportunity
      const opportunity = await this.detector.detectOpportunity(this.config);
      
      if (!opportunity) {
        return; // No opportunity found
      }

      this.stats.totalOpportunitiesFound++;
      this.logger.info(`Arbitrage opportunity detected: ${opportunity.estimatedProfitBps}bps`);

      // Validate opportunity is still good
      const isValid = await this.detector.validateOpportunity(opportunity, 5000);
      if (!isValid) {
        this.logger.debug("Opportunity no longer valid, skipping execution");
        return;
      }

      // Check if we have sufficient balance
      const hasBalance = await this.executor.checkBalance(opportunity);
      if (!hasBalance) {
        this.logger.warn("Insufficient balance for arbitrage execution");
        return;
      }

      // Execute the arbitrage
      const params: ArbitrageExecutionParams = {
        opportunity,
        slippageBps: this.config.maxSlippageBps,
        jitoTipPercentile: this.config.jitoTipPercentile,
        enableParallelExecution: this.config.enableParallelExecution,
      };

      const result = await this.executor.executeArbitrage(params);
      await this.recordExecution(opportunity, result);

      // Handle failure management
      if (!result.success) {
        this.handleFailure();
      } else {
        this.stats.consecutiveFailures = 0; // Reset on success
      }

    } catch (error) {
      this.logger.error(`Error in arbitrage monitoring: ${error}`);
      this.handleFailure();
    }
  }

  /**
   * Record an arbitrage execution in history and update stats
   */
  private async recordExecution(
    opportunity: ArbitrageOpportunity,
    result: ArbitrageExecutionResult
  ): Promise<void> {
    // Create history entry
    const historyEntry: ArbitrageHistoryEntry = {
      id: UUID.generate(),
      timestamp: Date.now(),
      opportunity,
      result,
    };

    this.history.push(historyEntry);

    // Keep only last 1000 entries
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    // Update statistics
    this.stats.totalExecutedArbitrages++;
    this.stats.lastExecutionTime = Date.now();

    if (result.success) {
      this.stats.totalSuccessfulArbitrages++;
      if (result.profit) {
        this.stats.totalProfit = this.stats.totalProfit.add(result.profit);
      }
      if (result.actualProfitBps) {
        this.updateAverageProfitBps(result.actualProfitBps);
      }
      if (result.executionTimeMs) {
        this.updateAverageExecutionTime(result.executionTimeMs);
      }
    } else {
      this.stats.totalFailedArbitrages++;
    }

    await this.saveData();
  }

  /**
   * Handle execution failures
   */
  private handleFailure(): void {
    this.stats.consecutiveFailures++;
    
    if (this.stats.consecutiveFailures >= this.config.maxFailureCount) {
      this.stats.isPaused = true;
      this.stats.pauseEndTime = Date.now() + this.config.pauseDurationMs;
      
      this.logger.warn(
        `Pausing arbitrage for ${this.config.pauseDurationMs}ms due to ${this.stats.consecutiveFailures} consecutive failures`
      );
    }
  }

  /**
   * Update average profit basis points
   */
  private updateAverageProfitBps(newProfitBps: number): void {
    const totalSuccessful = this.stats.totalSuccessfulArbitrages;
    if (totalSuccessful === 1) {
      this.stats.averageProfitBps = newProfitBps;
    } else {
      this.stats.averageProfitBps = 
        (this.stats.averageProfitBps * (totalSuccessful - 1) + newProfitBps) / totalSuccessful;
    }
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(newExecutionTimeMs: number): void {
    const totalSuccessful = this.stats.totalSuccessfulArbitrages;
    if (totalSuccessful === 1) {
      this.stats.averageExecutionTimeMs = newExecutionTimeMs;
    } else {
      this.stats.averageExecutionTimeMs = 
        (this.stats.averageExecutionTimeMs * (totalSuccessful - 1) + newExecutionTimeMs) / totalSuccessful;
    }
  }

  /**
   * Save current data to persistence
   */
  private async saveData(): Promise<void> {
    const data: ArbitrageHelperData = {
      config: this.config,
      stats: this.stats,
      history: this.history,
    };

    await this.persistence.saveData(data);
  }
}
