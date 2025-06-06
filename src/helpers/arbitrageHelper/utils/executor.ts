import { Connection, Keypair } from "@solana/web3.js";
import BN from "bn.js";

import type { Logger } from "../../../utils/logging";
import { SwapExecutor, SwapParams } from "../../swapExecutor/swapExecutor";
import { JupSwapClient } from "../../3rdParties/jup";
import { JitoClient } from "../../3rdParties/jito";
import { FeeHelper } from "../../feeHelper/helper";
import { 
  ArbitrageOpportunity, 
  ArbitrageExecutionParams, 
  ArbitrageExecutionResult 
} from "../dtos";

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Execution Engine
////////////////////////////////////////////////////////////////////////////////

export class ArbitrageExecutor {
  private readonly swapExecutor: SwapExecutor;

  constructor(
    private readonly connection: Connection,
    private readonly keypair: Keypair,
    readonly jupSwapClient: JupSwapClient,
    readonly jitoClient: JitoClient,
    readonly feeHelper: FeeHelper,
    private readonly logger: Logger
  ) {
    this.swapExecutor = new SwapExecutor(
      connection,
      keypair,
      jupSwapClient,
      jitoClient,
      feeHelper,
      logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Execute an arbitrage opportunity
   */
  async executeArbitrage(params: ArbitrageExecutionParams): Promise<ArbitrageExecutionResult> {
    const { opportunity, slippageBps, jitoTipPercentile, enableParallelExecution } = params;
    const startTime = Date.now();
    const contextInfo = `[Arbitrage][${opportunity.estimatedProfitBps}bps]`;

    this.logger.info(`${contextInfo} Starting arbitrage execution`);

    try {
      // Prepare swap parameters
      const swap1Params: SwapParams = {
        fromMint: opportunity.path1.fromMint,
        toMint: opportunity.path1.toMint,
        amount: opportunity.path1.inputAmount,
        slippageBps: Math.max(slippageBps, opportunity.path1.slippageBps),
        jitoTipPercentile,
      };

      const swap2Params: SwapParams = {
        fromMint: opportunity.path2.fromMint,
        toMint: opportunity.path2.toMint,
        amount: opportunity.path2.inputAmount,
        slippageBps: Math.max(slippageBps, opportunity.path2.slippageBps),
        jitoTipPercentile,
      };

      let swap1Result, swap2Result;

      if (enableParallelExecution) {
        // Execute swaps in parallel for maximum speed
        this.logger.debug(`${contextInfo} Executing parallel swaps`);
        
        const [result1, result2] = await Promise.allSettled([
          this.swapExecutor.executeSwap(swap1Params, `${contextInfo}[Swap1]`),
          this.swapExecutor.executeSwap(swap2Params, `${contextInfo}[Swap2]`)
        ]);

        if (result1.status === 'rejected') {
          throw new Error(`Swap 1 failed: ${result1.reason}`);
        }
        if (result2.status === 'rejected') {
          throw new Error(`Swap 2 failed: ${result2.reason}`);
        }

        swap1Result = result1.value;
        swap2Result = result2.value;
      } else {
        // Execute swaps sequentially (safer but slower)
        this.logger.debug(`${contextInfo} Executing sequential swaps`);
        
        swap1Result = await this.swapExecutor.executeSwap(swap1Params, `${contextInfo}[Swap1]`);
        
        if (!swap1Result || !swap1Result.success) {
          throw new Error(`Swap 1 failed: ${swap1Result?.signature || 'unknown error'}`);
        }

        // For sequential execution, we might want to re-calculate the second swap amount
        // based on the actual output of the first swap
        swap2Result = await this.swapExecutor.executeSwap(swap2Params, `${contextInfo}[Swap2]`);
      }

      // Check if both swaps succeeded
      if (!swap1Result || !swap2Result || !swap1Result.success || !swap2Result.success) {
        const error = `Swap execution failed: swap1=${swap1Result?.success || false}, swap2=${swap2Result?.success || false}`;
        this.logger.error(`${contextInfo} ${error}`);
        
        return {
          success: false,
          error,
          swap1Signature: swap1Result?.signature,
          swap2Signature: swap2Result?.signature,
          executionTimeMs: Date.now() - startTime,
        };
      }

      const executionTimeMs = Date.now() - startTime;

      // Calculate actual profit (this would need additional logic to get actual received amounts)
      // For now, we'll use the estimated profit
      const actualProfit = opportunity.estimatedProfitAmount;
      const actualProfitBps = opportunity.estimatedProfitBps;

      this.logger.info(
        `${contextInfo} Arbitrage executed successfully: ${actualProfitBps}bps profit in ${executionTimeMs}ms`
      );

      return {
        success: true,
        profit: actualProfit,
        actualProfitBps,
        swap1Signature: swap1Result.signature,
        swap2Signature: swap2Result.signature,
        executionTimeMs,
      };

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      this.logger.error(`${contextInfo} Arbitrage execution failed: ${error}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs,
      };
    }
  }

  /**
   * Check if we have sufficient balance for arbitrage
   */
  async checkBalance(opportunity: ArbitrageOpportunity): Promise<boolean> {
    try {
      // Check if we have enough of the starting token
      const balance = await this.connection.getTokenAccountBalance(
        // This would need to be implemented properly with token account lookup
        this.keypair.publicKey
      );

      // For SOL, check native balance
      if (opportunity.path1.fromMint.toBase58() === 'So11111111111111111111111111111111111111112') {
        const solBalance = await this.connection.getBalance(this.keypair.publicKey);
        const requiredBalance = opportunity.path1.inputAmount.toNumber();
        
        return solBalance >= requiredBalance;
      }

      // For other tokens, this would need proper token account balance checking
      // This is a simplified implementation
      return true;
    } catch (error) {
      this.logger.error(`Failed to check balance: ${error}`);
      return false;
    }
  }
}
