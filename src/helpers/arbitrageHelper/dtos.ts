import zod from "zod";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Configuration Schema
////////////////////////////////////////////////////////////////////////////////

export const ArbitrageConfigSchema = zod.object({
  // Token configuration
  tokenA: zod.instanceof(PublicKey), // e.g., USDC
  tokenB: zod.instanceof(PublicKey), // e.g., SOL
  
  // Trading amounts
  tradeAmount: zod.instanceof(BN), // Amount of tokenA to use per arbitrage
  
  // Thresholds
  minProfitBps: zod.number().default(50), // Minimum profit in basis points (0.5%)
  maxSlippageBps: zod.number().default(300), // Maximum slippage (3%)
  
  // Timing
  checkIntervalMs: zod.number().default(5000), // How often to check for opportunities
  maxExecutionTimeMs: zod.number().default(30000), // Max time to execute arbitrage
  
  // Safety settings
  maxFailureCount: zod.number().default(3), // Stop after consecutive failures
  pauseDurationMs: zod.number().default(60000), // Pause duration after max failures
  
  // Jito settings
  jitoTipPercentile: zod.string().default("landed_tips_95th_percentile"),
  
  // Advanced settings
  enableParallelExecution: zod.boolean().default(true), // Execute swaps in parallel
  maxConcurrentSwaps: zod.number().default(2), // Max concurrent swap operations
});

export type ArbitrageConfig = zod.infer<typeof ArbitrageConfigSchema>;

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Operation Parameters
////////////////////////////////////////////////////////////////////////////////

export const ArbitrageOpportunitySchema = zod.object({
  // Swap paths
  path1: zod.object({
    fromMint: zod.instanceof(PublicKey),
    toMint: zod.instanceof(PublicKey),
    inputAmount: zod.instanceof(BN),
    expectedOutput: zod.instanceof(BN),
    slippageBps: zod.number(),
  }),
  path2: zod.object({
    fromMint: zod.instanceof(PublicKey),
    toMint: zod.instanceof(PublicKey),
    inputAmount: zod.instanceof(BN),
    expectedOutput: zod.instanceof(BN),
    slippageBps: zod.number(),
  }),
  
  // Profit calculation
  estimatedProfitAmount: zod.instanceof(BN),
  estimatedProfitBps: zod.number(),
  
  // Metadata
  detectedAt: zod.number(),
  quoteTimestamp: zod.number(),
});

export type ArbitrageOpportunity = zod.infer<typeof ArbitrageOpportunitySchema>;

export const ArbitrageExecutionParamsSchema = zod.object({
  opportunity: ArbitrageOpportunitySchema,
  slippageBps: zod.number(),
  jitoTipPercentile: zod.string(),
  enableParallelExecution: zod.boolean().default(true),
});

export type ArbitrageExecutionParams = zod.infer<typeof ArbitrageExecutionParamsSchema>;

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Results
////////////////////////////////////////////////////////////////////////////////

export interface ArbitrageExecutionResult {
  success: boolean;
  profit?: BN;
  actualProfitBps?: number;
  swap1Signature?: string;
  swap2Signature?: string;
  executionTimeMs?: number;
  error?: string;
}

export interface ArbitrageStats {
  totalOpportunitiesFound: number;
  totalExecutedArbitrages: number;
  totalSuccessfulArbitrages: number;
  totalFailedArbitrages: number;
  totalProfit: BN;
  averageProfitBps: number;
  averageExecutionTimeMs: number;
  consecutiveFailures: number;
  lastExecutionTime?: number;
  isPaused: boolean;
  pauseEndTime?: number;
}

////////////////////////////////////////////////////////////////////////////////
// Arbitrage History
////////////////////////////////////////////////////////////////////////////////

export const ArbitrageHistoryEntrySchema = zod.object({
  id: zod.string(),
  timestamp: zod.number(),
  opportunity: ArbitrageOpportunitySchema,
  result: zod.object({
    success: zod.boolean(),
    profit: zod.instanceof(BN).optional(),
    actualProfitBps: zod.number().optional(),
    swap1Signature: zod.string().optional(),
    swap2Signature: zod.string().optional(),
    executionTimeMs: zod.number().optional(),
    error: zod.string().optional(),
  }),
});

export type ArbitrageHistoryEntry = zod.infer<typeof ArbitrageHistoryEntrySchema>;

////////////////////////////////////////////////////////////////////////////////
// Persistence
////////////////////////////////////////////////////////////////////////////////

export interface ArbitrageHelperData {
  config: ArbitrageConfig;
  stats: ArbitrageStats;
  history: ArbitrageHistoryEntry[];
}
