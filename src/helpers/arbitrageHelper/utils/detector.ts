import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { Logger } from "../../../utils/logging";
import { ResultUtils } from "../../../utils/result";
import { JupSwapClient, GetQuoteV1ParamDto } from "../../3rdParties/jup";
import { ArbitrageOpportunity, ArbitrageConfig } from "../dtos";

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Opportunity Detection
////////////////////////////////////////////////////////////////////////////////

export class ArbitrageDetector {
  constructor(
    private readonly jupSwapClient: JupSwapClient,
    private readonly logger: Logger
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Detect arbitrage opportunities between tokenA -> tokenB -> tokenA
   */
  async detectOpportunity(config: ArbitrageConfig): Promise<ArbitrageOpportunity | null> {
    try {
      const startTime = Date.now();
      
      // Get quotes for both paths
      const quote1Result = await this.getQuote(config.tokenA, config.tokenB, config.tradeAmount);

      if (ResultUtils.isErr(quote1Result)) {
        const error1 = ResultUtils.isErr(quote1Result) ? quote1Result.error.message : "";
        this.logger.warn(`Failed to get quotes: ${error1}`);
        return null;
      }

      const quote1 = quote1Result.data;

      // Null check for quotes
      if (!quote1) {
        this.logger.warn('Received null quotes from Jupiter API');
        return null;
      }

      // Get the actual quote for the second swap using the output from the first
      const quote2AdjustedResult = await this.getQuote(
        config.tokenB, 
        config.tokenA, 
        quote1.outAmount
      );

      if (ResultUtils.isErr(quote2AdjustedResult)) {
        this.logger.warn(`Failed to get adjusted quote2: ${quote2AdjustedResult.error.message}`);
        return null;
      }

      const quote2Adjusted = quote2AdjustedResult.data;

      // Null check for adjusted quote
      if (!quote2Adjusted) {
        this.logger.warn('Received null adjusted quote from Jupiter API');
        return null;
      }

      // Calculate profit
      const profit = quote2Adjusted.outAmount.sub(config.tradeAmount);
      const profitBps = profit.mul(new BN(10000)).div(config.tradeAmount).toNumber();

      // Check if profitable above minimum threshold
      if (profitBps < config.minProfitBps) {
        this.logger.debug(`Opportunity below threshold: ${profitBps}bps < ${config.minProfitBps}bps`);
        return null;
      }

      // Check slippage constraints
      if (quote1.slippageBps > config.maxSlippageBps || quote2Adjusted.slippageBps > config.maxSlippageBps) {
        this.logger.debug(`Slippage too high: ${quote1.slippageBps}bps, ${quote2Adjusted.slippageBps}bps > ${config.maxSlippageBps}bps`);
        return null;
      }

      const opportunity: ArbitrageOpportunity = {
        path1: {
          fromMint: config.tokenA,
          toMint: config.tokenB,
          inputAmount: config.tradeAmount,
          expectedOutput: quote1.outAmount,
          slippageBps: quote1.slippageBps,
        },
        path2: {
          fromMint: config.tokenB,
          toMint: config.tokenA,
          inputAmount: quote1.outAmount,
          expectedOutput: quote2Adjusted.outAmount,
          slippageBps: quote2Adjusted.slippageBps,
        },
        estimatedProfitAmount: profit,
        estimatedProfitBps: profitBps,
        detectedAt: startTime,
        quoteTimestamp: Date.now(),
      };

      this.logger.info(
        `Arbitrage opportunity detected: ${profitBps}bps profit (${profit.toString()} tokens)`
      );

      return opportunity;
    } catch (error) {
      this.logger.error(`Error detecting arbitrage opportunity: ${error}`);
      return null;
    }
  }

  /**
   * Validate if an opportunity is still valid
   */
  async validateOpportunity(
    opportunity: ArbitrageOpportunity,
    maxAgeMs: number = 10000
  ): Promise<boolean> {
    const age = Date.now() - opportunity.quoteTimestamp;
    if (age > maxAgeMs) {
      this.logger.debug(`Opportunity expired: ${age}ms > ${maxAgeMs}ms`);
      return false;
    }

    // Re-check quotes to ensure they're still valid
    const freshOpportunity = await this.detectOpportunity({
      tokenA: opportunity.path1.fromMint,
      tokenB: opportunity.path1.toMint,
      tradeAmount: opportunity.path1.inputAmount,
      minProfitBps: 0, // We just want to check if it's still profitable
      maxSlippageBps: 1000, // Allow higher slippage for validation
      checkIntervalMs: 5000,
      maxExecutionTimeMs: 30000,
      maxFailureCount: 3,
      pauseDurationMs: 60000,
      jitoTipPercentile: "landed_tips_95th_percentile",
      enableParallelExecution: true,
      maxConcurrentSwaps: 2,
    });

    if (!freshOpportunity) {
      this.logger.debug("Opportunity no longer valid");
      return false;
    }

    // Check if profit is still reasonable (allow some degradation)
    const profitDegradation = opportunity.estimatedProfitBps - freshOpportunity.estimatedProfitBps;
    if (profitDegradation > 50) { // Allow up to 0.5% degradation
      this.logger.debug(`Opportunity degraded too much: ${profitDegradation}bps`);
      return false;
    }

    return true;
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get a quote from Jupiter API
   */
  private async getQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: BN
  ) {
    const params: GetQuoteV1ParamDto = {
      inputMint: inputMint.toString(),
      outputMint: outputMint.toString(),
      amount: amount.toString(),
      slippageBps: 50, // Start with low slippage for detection
      restrictIntermediateTokens: true,
    };

    return ResultUtils.wrap(this.jupSwapClient.getQuote(params));
  }
}
