import zod from "zod";

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

export const CopyTradeRecordOnBuyStrategySchema = zod.object({
  sellCoinType: zod.instanceof(PublicKey),
  sellCoinAmount: zod.instanceof(BN),
  slippageBps: zod.number(),

  //////////////////////////////////////////////////////////////////////////////

  jitoTipPercentile: zod.string().default("landed_tips_95th_percentile"),
  jitoTxFeeTipRatio: zod.number().default(0.7),
});

export type CopyTradeRecordOnBuyStrategy = zod.infer<
  typeof CopyTradeRecordOnBuyStrategySchema
>;

export const CopyTradeRecordOnSellStrategySchema = zod.object({
  fixedPercentage: zod.number().nullable(),
  slippageBps: zod.number(),

  //////////////////////////////////////////////////////////////////////////////

  jitoTipPercentile: zod.string().default("landed_tips_95th_percentile"),
  jitoTxFeeTipRatio: zod.number().default(0.7),
});

export type CopyTradeRecordOnSellStrategy = zod.infer<
  typeof CopyTradeRecordOnSellStrategySchema
>;

////////////////////////////////////////////////////////////////////////////////

export interface CopyTradeRecord {
  onBuyStrategiesMap: Map<string, CopyTradeRecordOnBuyStrategy>; // strategyName -> CopyTradeRecordOnBuyStrategy
  onSellStrategiesMap: Map<string, CopyTradeRecordOnSellStrategy>; // strategyName -> CopyTradeRecordOnSellStrategy
}
