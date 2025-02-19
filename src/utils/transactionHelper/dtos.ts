import { sign } from 'crypto';
import zod from 'zod';
import BN from 'bn.js';

////////////////////////////////////////////////////////////////////////////////
/**
// TODO: deprecated
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

export type TransactionResultDto = zod.infer<typeof TransactionResultSchema>;

// TODO: deprecated
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

export type SwapDetailDto = zod.infer<typeof SwapDetailSchema>;
*/

////////////////////////////////////////////////////////////////////////////////

export const SwapInfoSchema = zod.object({
  msg_hash: zod.string(),
  timestamp: zod.number(),
  status: zod.string(),
  block: zod.number(),
  signer: zod.string(),
  fromCoinType: zod.string(),
  fromCoinAmount: zod.instanceof(BN),
  fromCoinPreBalance: zod.instanceof(BN),
  fromCoinPostBalance: zod.instanceof(BN),
  toCoinType: zod.string(),
  toCoinAmount: zod.instanceof(BN),
});

export type SwapInfoDto = zod.infer<typeof SwapInfoSchema>;

export const printSwapInfoDto = (swapInfo: SwapInfoDto) => {
  console.log('{');
  console.log(`  msg_hash: ${swapInfo.msg_hash},`);
  console.log(`  timestamp: ${swapInfo.timestamp},`);
  console.log(`  status: ${swapInfo.status},`);
  console.log(`  block: ${swapInfo.block},`);
  console.log(`  signer: ${swapInfo.signer},`);
  console.log(`  fromCoinType: ${swapInfo.fromCoinType},`);
  console.log(`  fromCoinAmount: ${swapInfo.fromCoinAmount.toString()},`);
  console.log(`  fromCoinPreBalance: ${swapInfo.fromCoinPreBalance.toString()},`);
  console.log(`  fromCoinPostBalance: ${swapInfo.fromCoinPostBalance.toString()},`);
  console.log(`  toCoinType: ${swapInfo.toCoinType},`);
  console.log(`  toCoinAmount: ${swapInfo.toCoinAmount.toString()},`);
  console.log('}');
};

////////////////////////////////////////////////////////////////////////////////
