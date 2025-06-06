import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  validateInput,
  validateNumber,
  validateSelect,
  validateConfirm,
  validations,
} from "../utils/validation";
import { i18n } from "../i18n";
import { ConsoleUtils } from "../utils/console";
import {
  COIN_TYPE_NAME_MAP,
  COIN_TYPE_USDC_MINT,
  COIN_TYPE_WSOL_MINT,
} from "../../utils/constants";
import { ServiceComponents } from "../types/services";
import { ArbitrageConfig } from "../../helpers/arbitrageHelper/dtos";

////////////////////////////////////////////////////////////////////////////////

export class ArbitrageCommands {
  constructor(private services: ServiceComponents) {}

  //////////////////////////////////////////////////////////////////////////////
  // Configuration Management
  //////////////////////////////////////////////////////////////////////////////

  async viewArbitrageConfig(): Promise<void> {
    try {
      console.log(`\n${i18n.t("arbitrageConfigTitle")}\n`);

      const config = this.services.arbitrageHelper.getConfig();

      // Display current configuration
      console.log(`📋 Current Arbitrage Configuration:`);
      console.log(`   Token A: ${config.tokenA}`);
      console.log(`   Token B: ${config.tokenB}`);
      console.log(`   Trade Amount: ${config.tradeAmount.toString()}`);
      console.log(`   Min Profit (bps): ${config.minProfitBps}`);
      console.log(`   Max Slippage (bps): ${config.maxSlippageBps}`);
      console.log(`   Check Interval: ${config.checkIntervalMs / 1000}s`);
      console.log(`   Parallel Execution: ${config.enableParallelExecution ? '✅' : '❌'}`);
      
      console.log(`\n🛡️ Safety Settings:`);
      console.log(`   Max Failure Count: ${config.maxFailureCount}`);
      console.log(`   Pause Duration: ${config.pauseDurationMs / 1000}s`);
      console.log(`   Max Execution Time: ${config.maxExecutionTimeMs / 1000}s`);

      // Display current status
      const stats = this.services.arbitrageHelper.getStats();
      console.log(`\n📊 Current Status:`);
      console.log(`   Status: ${stats.isPaused ? i18n.t("arbitragePaused") : "Ready"}`);
      console.log(`   Consecutive Failures: ${stats.consecutiveFailures}`);

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  async updateArbitrageConfig(): Promise<void> {
    try {
      console.log(`\n${i18n.t("updateArbitrageConfigTitle")}\n`);

      const currentConfig = this.services.arbitrageHelper.getConfig();

      // Token A
      const tokenAInput = await validateInput({
        message: `${i18n.t("enterTokenA")} (current: ${currentConfig.tokenA.toBase58()})`,
        validate: validations.solanaAddress,
      });
      const tokenA = tokenAInput ? new PublicKey(tokenAInput) : currentConfig.tokenA;

      // Token B
      const tokenBInput = await validateInput({
        message: `${i18n.t("enterTokenB")} (current: ${currentConfig.tokenB.toBase58()})`,
        validate: validations.solanaAddress,
      });
      const tokenB = tokenBInput ? new PublicKey(tokenBInput) : currentConfig.tokenB;

      // Trade Amount
      const tradeAmountInput = await validateNumber({
        message: `${i18n.t("enterTradeAmount")} (current: ${currentConfig.tradeAmount.toString()})`,
        validate: validations.positiveNumber,
        default: currentConfig.tradeAmount.toNumber(),
      });
      const tradeAmount = new BN(tradeAmountInput);

      // Min Profit BPS
      const minProfitBps = await validateNumber({
        message: `${i18n.t("enterMinProfitBps")} (current: ${currentConfig.minProfitBps})`,
        validate: validations.positiveNumber,
        default: currentConfig.minProfitBps,
      });

      // Max Slippage BPS
      const maxSlippageBps = await validateNumber({
        message: `${i18n.t("enterMaxSlippageBps")} (current: ${currentConfig.maxSlippageBps})`,
        validate: validations.positiveNumber,
        default: currentConfig.maxSlippageBps,
      });

      // Check Interval
      const checkIntervalSeconds = await validateNumber({
        message: `${i18n.t("enterCheckInterval")} (current: ${currentConfig.checkIntervalMs / 1000})`,
        validate: (value: number | undefined) => value !== undefined && value >= 1 && value <= 3600 ? true : "Interval must be between 1 and 3600 seconds",
        default: currentConfig.checkIntervalMs / 1000,
      });

      // Parallel Execution
      const enableParallelExecution = await validateConfirm({
        message: `${i18n.t("enableParallelExecution")} (current: ${currentConfig.enableParallelExecution ? 'Yes' : 'No'})`,
        defaultValue: currentConfig.enableParallelExecution,
      });

      // Create new config
      const newConfig: Partial<ArbitrageConfig> = {
        tokenA,
        tokenB,
        tradeAmount,
        minProfitBps,
        maxSlippageBps,
        checkIntervalMs: checkIntervalSeconds * 1000,
        enableParallelExecution,
      };

      // Update configuration
      await this.services.arbitrageHelper.updateConfig(newConfig);
      console.log(`✅ Arbitrage configuration updated successfully!`);

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Arbitrage Operations
  //////////////////////////////////////////////////////////////////////////////

  async startArbitrage(): Promise<void> {
    try {
      console.log(`\n▶️ Starting arbitrage...`);

      const isRunning = this.services.arbitrageHelper.getIsRunning();
      if (isRunning) {
        console.log(`⚠️ Arbitrage is already running!`);
        return;
      }

      await this.services.arbitrageHelper.start();
      console.log(`✅ ${i18n.t("arbitrageStarted")}`);

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  async stopArbitrage(): Promise<void> {
    try {
      console.log(`\n⏹️ Stopping arbitrage...`);

      const isRunning = this.services.arbitrageHelper.getIsRunning();
      if (!isRunning) {
        console.log(`⚠️ Arbitrage is not currently running!`);
        return;
      }

      await this.services.arbitrageHelper.stop();
      console.log(`✅ Arbitrage stopped successfully!`);

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  async checkArbitrageOpportunity(): Promise<void> {
    try {
      console.log(`\n${i18n.t("arbitrageOpportunityTitle")}\n`);

      console.log(`🔍 Checking for arbitrage opportunities...`);
      
      const opportunity = await this.services.arbitrageHelper.checkOpportunity();

      if (!opportunity) {
        console.log(`❌ ${i18n.t("noArbitrageOpportunity")}`);
        return;
      }

      console.log(`💰 ${i18n.t("arbitrageOpportunityFound").replace("{0}", opportunity.estimatedProfitBps.toString())}`);
      console.log(`\n📊 Opportunity Details:`);
      console.log(`   Token A → Token B: ${opportunity.path1.expectedOutput.toString()}`);
      console.log(`   Token B → Token A: ${opportunity.path2.expectedOutput.toString()}`);
      console.log(`   Expected Profit: ${opportunity.estimatedProfitBps} bps (${(opportunity.estimatedProfitBps / 100).toFixed(2)}%)`);
      console.log(`   Estimated Profit Amount: ${opportunity.estimatedProfitAmount.toString()}`);
      
      // Ask if user wants to execute
      const shouldExecute = await validateConfirm({
        message: `Execute this arbitrage opportunity?`,
        defaultValue: false,
      });

      if (shouldExecute) {
        console.log(`⚡ Executing arbitrage...`);
        const result = await this.services.arbitrageHelper.executeOpportunity(opportunity);
        
        if (result.success) {
          console.log(`✅ ${i18n.t("arbitrageExecutionSuccess").replace("{0}", result.profit?.toString() || "unknown")}`);
          if (result.swap1Signature || result.swap2Signature) {
            const signatures = [result.swap1Signature, result.swap2Signature].filter(Boolean);
            console.log(`   Signatures: ${signatures.join(", ")}`);
          }
        } else {
          console.log(`❌ ${i18n.t("arbitrageExecutionFailed").replace("{0}", result.error || "Unknown error")}`);
        }
      }

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Statistics and History
  //////////////////////////////////////////////////////////////////////////////

  async viewArbitrageStats(): Promise<void> {
    try {
      console.log(`\n${i18n.t("arbitrageStatsTitle")}\n`);

      const stats = this.services.arbitrageHelper.getStats();
      const isRunning = this.services.arbitrageHelper.getIsRunning();

      console.log(`📊 Arbitrage Statistics:`);
      console.log(`   Status: ${isRunning ? i18n.t("arbitrageRunning") : i18n.t("arbitrageStopped")}`);
      console.log(`   ${i18n.t("totalOpportunities")}: ${stats.totalOpportunitiesFound}`);
      console.log(`   ${i18n.t("totalExecutions")}: ${stats.totalExecutedArbitrages}`);
      console.log(`   ${i18n.t("successfulArbitrages")}: ${stats.totalSuccessfulArbitrages}`);
      console.log(`   ${i18n.t("failedArbitrages")}: ${stats.totalFailedArbitrages}`);
      console.log(`   ${i18n.t("consecutiveFailures")}: ${stats.consecutiveFailures}`);

      if (stats.totalProfit !== undefined) {
        console.log(`   ${i18n.t("totalProfit")}: ${stats.totalProfit}`);
      }

      if (stats.averageProfitBps !== undefined) {
        console.log(`   ${i18n.t("averageProfit")}: ${stats.averageProfitBps} bps`);
      }

      if (stats.averageExecutionTimeMs !== undefined) {
        console.log(`   ${i18n.t("averageExecutionTime")}: ${stats.averageExecutionTimeMs}ms`);
      }

      // Performance metrics
      if (stats.totalExecutedArbitrages > 0) {
        const successRate = ((stats.totalSuccessfulArbitrages / stats.totalExecutedArbitrages) * 100).toFixed(2);
        console.log(`   Success Rate: ${successRate}%`);
      }

      if (stats.totalOpportunitiesFound > 0) {
        const executionRate = ((stats.totalExecutedArbitrages / stats.totalOpportunitiesFound) * 100).toFixed(2);
        console.log(`   Execution Rate: ${executionRate}%`);
      }

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  async viewArbitrageHistory(): Promise<void> {
    try {
      console.log(`\n${i18n.t("arbitrageHistoryTitle")}\n`);

      const history = this.services.arbitrageHelper.getHistory(20);

      if (history.length === 0) {
        console.log(`  No arbitrage history found.`);
        return;
      }

      console.log(`📋 Recent Arbitrage Executions (${history.length} most recent):\n`);

      history.forEach((execution, index) => {
        const date = new Date(execution.timestamp).toLocaleString();
        console.log(`${index + 1}. ${execution.result.success ? "✅" : "❌"} ${date}`);
        console.log(`   Expected Profit: ${execution.opportunity.estimatedProfitBps} bps`);
        
        if (execution.result.success && execution.result.profit) {
          console.log(`   Actual Profit: ${execution.result.profit.toString()}`);
        }
        
        if (execution.result.executionTimeMs) {
          console.log(`   Execution Time: ${execution.result.executionTimeMs}ms`);
        }

        if (execution.result.swap1Signature || execution.result.swap2Signature) {
          const signatures = [execution.result.swap1Signature, execution.result.swap2Signature].filter(Boolean);
          console.log(`   Signatures: ${signatures.join(", ")}`);
        }

        if (execution.result.error) {
          console.log(`   Error: ${execution.result.error}`);
        }

        console.log("");
      });

      if (history.length >= 20) {
        console.log(`... and possibly more transactions`);
      }

    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Cleanup
  //////////////////////////////////////////////////////////////////////////////

  async cleanup(): Promise<void> {
    try {
      await this.services.arbitrageHelper.stop();
    } catch (error) {
      console.error(`Error during ArbitrageHelper cleanup: ${error}`);
    }
  }
}
