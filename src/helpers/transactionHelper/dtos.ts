import zod from 'zod';

import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

////////////////////////////////////////////////////////////////////////////////

export const SwapInfoSchema = zod.object({
  solChanging: zod.boolean(),
  msg_hash: zod.string(),
  timestamp: zod.number(),
  status: zod.string(),
  block: zod.number(),
  signer: zod.string(),
  fromCoinType: zod.instanceof(PublicKey),
  fromCoinAmount: zod.instanceof(BN),
  fromCoinPreBalance: zod.instanceof(BN),
  fromCoinPostBalance: zod.instanceof(BN),
  fromCoinOwnerProgramId: zod.instanceof(PublicKey),
  toCoinType: zod.instanceof(PublicKey),
  toCoinAmount: zod.instanceof(BN),
  toCoinOwnerProgramId: zod.instanceof(PublicKey),
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
  console.log(`  fromCoinOwnerProgram: ${swapInfo.fromCoinOwnerProgramId},`);
  console.log(`  toCoinType: ${swapInfo.toCoinType},`);
  console.log(`  toCoinAmount: ${swapInfo.toCoinAmount.toString()},`);
  console.log(`  toCoinOwnerProgram: ${swapInfo.toCoinOwnerProgramId}`);
  console.log('}');
};

////////////////////////////////////////////////////////////////////////////////
