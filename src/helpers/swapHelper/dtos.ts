import zod from "zod";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////
// Swap Configuration Schema
////////////////////////////////////////////////////////////////////////////////

export const SwapConfigSchema = zod.object({
  // Basic swap settings
  defaultSlippageBps: zod.number().default(500), // 5%
  minSlippageBps: zod.number().default(250), // 2.5%
  maxSlippageBps: zod.number().default(3000), // 30%

  // Auto slippage settings
  autoSlippage: zod.boolean().default(true),

  // Sandwich protection
  sandwichMode: zod.boolean().default(false),
  sandwichSlippageBps: zod.number().default(5000), // 50%

  // Priority fees (in SOL)
  buyPriorityFee: zod.number().default(0.0001),
  sellPriorityFee: zod.number().default(0.0001),

  // Jito settings
  jitoTipPercentile: zod.string().default("landed_tips_95th_percentile"),

  // Quick buy amounts (in SOL)
  customBuyAmounts: zod.array(zod.number()).default([0.05, 0.1, 0.5, 1, 3]),

  // Quick sell percentages (as decimal: 0.5 = 50%)
  customSellPercentages: zod
    .array(zod.number())
    .default([0.25, 0.5, 0.75, 1.0]),
});

export type SwapConfig = zod.infer<typeof SwapConfigSchema>;

////////////////////////////////////////////////////////////////////////////////
// Swap Operation Parameters
////////////////////////////////////////////////////////////////////////////////

export const BuyParamsSchema = zod.object({
  fromTokenMint: zod.instanceof(PublicKey),
  toTokenMint: zod.instanceof(PublicKey),
  amount: zod.instanceof(BN),
  slippageBps: zod.number().optional(), // If provided, use custom slippage; otherwise use default
  priorityFee: zod.number().optional(), // Override default priority fee
});

export type BuyParams = zod.infer<typeof BuyParamsSchema>;

export const SellParamsSchema = zod.object({
  tokenMint: zod.instanceof(PublicKey),
  tokenAmount: zod.instanceof(BN), // Amount of tokens to sell
  percentage: zod.number().optional(), // If provided, sell this percentage of holdings
  slippageBps: zod.number().optional(), // If provided, use custom slippage; otherwise use default
  priorityFee: zod.number().optional(), // Override default priority fee
});

export type SellParams = zod.infer<typeof SellParamsSchema>;

////////////////////////////////////////////////////////////////////////////////
// Swap Results
////////////////////////////////////////////////////////////////////////////////

export interface SwapOperationResult {
  success: boolean;
  signature?: string;
  error?: string;
  amount?: BN;
  estimatedOutput?: BN;
  actualSlippageBps?: number;
}

////////////////////////////////////////////////////////////////////////////////
// Swap History
////////////////////////////////////////////////////////////////////////////////

export const SwapHistoryEntrySchema = zod.object({
  id: zod.string(),
  timestamp: zod.number(),
  type: zod.enum(["buy", "sell"]),
  fromTokenMint: zod.string(),
  toTokenMint: zod.string(),
  signature: zod.string(),
  success: zod.boolean(),

  // Buy-specific fields
  amount: zod.instanceof(BN).optional(),
  tokensReceived: zod.instanceof(BN).optional(),

  // Sell-specific fields
  tokenAmount: zod.instanceof(BN).optional(),
  solReceived: zod.instanceof(BN).optional(),

  // Common fields
  slippageBps: zod.number(),
  priorityFee: zod.number(),
  error: zod.string().optional(),
});

export type SwapHistoryEntry = zod.infer<typeof SwapHistoryEntrySchema>;

////////////////////////////////////////////////////////////////////////////////
// Persistence
////////////////////////////////////////////////////////////////////////////////

export interface SwapHelperData {
  config: SwapConfig;
  history: SwapHistoryEntry[];
}
