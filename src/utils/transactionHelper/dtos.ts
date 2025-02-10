import { sign } from 'crypto';
import zod from 'zod';
import BN from 'bn.js';

// 定義交易資料結構
export const TransactionResultSchema = zod.object({
  transaction: zod.object({
    signatures: zod.array(zod.string()),
    message: zod.object({
      accountKeys: zod.array(zod.object({ pubkey: zod.string() })),
      instructions: zod.array(
        zod.object({
          programId: zod.string(),
          parsed: zod
            .object({
              info: zod
                .object({
                  source: zod.string().optional(),
                  destination: zod.string().optional(),
                  lamports: zod.number().optional(),
                })
                .optional(),
            })
            .optional(),
        })
      ),
    }),
  }),
  blockTime: zod.number().optional(),
  slot: zod.number().optional(),
  meta: zod
    .object({
      err: zod.any().optional(),
      preBalances: zod.array(zod.string()),
      postBalances: zod.array(zod.string()),
      postTokenBalances: zod
        .array(
          zod.object({
            owner: zod.string(),
            mint: zod.string(),
            uiTokenAmount: zod.object({ amount: zod.number() }),
          })
        )
        .optional(),
      preTokenBalances: zod
        .array(
          zod.object({
            owner: zod.string(),
            mint: zod.string(),
            uiTokenAmount: zod.object({ amount: zod.number() }),
          })
        )
        .optional(),
      fee: zod.number().optional(),
    })
    .optional(),
});

export const SwapDetailSchema = zod.object({
  msg_hash: zod.string(),
  timestamp: zod.number(),
  status: zod.string(),
  block: zod.number(),
  signer: zod.string(),
  fromCoinType: zod.string(),
  fromCoinAmount: zod.instanceof(BN).transform((v) => v.toString()),
  fromCoinPreBalance: zod.instanceof(BN).transform((v) => v.toString()),
  fromCoinPostBalance: zod.instanceof(BN).transform((v) => v.toString()),
  toCoinType: zod.string(),
  toCoinAmount: zod.instanceof(BN).transform((v) => v.toString()),
});

// TypeScript 型別
export type TransactionResultDto = zod.infer<typeof TransactionResultSchema>;
export type SwapDetailDto = zod.infer<typeof SwapDetailSchema>;
