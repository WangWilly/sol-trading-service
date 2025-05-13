import zod from "zod";

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

export const SwapInfoSchema = zod.object({
  subId: zod.number(),
  txSignature: zod.string(),
  msg_hash: zod.string(),
  timestamp: zod.number(),
  status: zod.string(),
  block: zod.number(),
  signer: zod.string(),
  fromSol: zod.boolean(),
  fromCoinType: zod.instanceof(PublicKey).nullable(),
  fromCoinAmount: zod.instanceof(BN),
  fromCoinPreBalance: zod.instanceof(BN),
  fromCoinPostBalance: zod.instanceof(BN),
  fromCoinOwnerProgramId: zod.instanceof(PublicKey),
  toSol: zod.boolean(),
  toCoinType: zod.instanceof(PublicKey).nullable(),
  toCoinAmount: zod.instanceof(BN),
  toCoinOwnerProgramId: zod.instanceof(PublicKey),
});

export type SwapInfoDto = zod.infer<typeof SwapInfoSchema>;

export const printSwapInfoDto = (swapInfo: SwapInfoDto) => {
  console.log("{");
  console.log(`  subId: ${swapInfo.subId},`);
  console.log(`  txSignature: ${swapInfo.txSignature},`);
  console.log(`  msg_hash: ${swapInfo.msg_hash},`);
  console.log(`  timestamp: ${swapInfo.timestamp},`);
  console.log(`  status: ${swapInfo.status},`);
  console.log(`  block: ${swapInfo.block},`);
  console.log(`  signer: ${swapInfo.signer},`);
  console.log(`  fromSol: ${swapInfo.fromSol},`);
  console.log(`  fromCoinType: ${swapInfo.fromCoinType},`);
  console.log(`  fromCoinAmount: ${swapInfo.fromCoinAmount.toString()},`);
  console.log(
    `  fromCoinPreBalance: ${swapInfo.fromCoinPreBalance.toString()},`,
  );
  console.log(
    `  fromCoinPostBalance: ${swapInfo.fromCoinPostBalance.toString()},`,
  );
  console.log(`  fromCoinOwnerProgram: ${swapInfo.fromCoinOwnerProgramId},`);
  console.log(`  toSol: ${swapInfo.toSol},`);
  console.log(`  toCoinType: ${swapInfo.toCoinType},`);
  console.log(`  toCoinAmount: ${swapInfo.toCoinAmount.toString()},`);
  console.log(`  toCoinOwnerProgram: ${swapInfo.toCoinOwnerProgramId}`);
  console.log("}");
};

////////////////////////////////////////////////////////////////////////////////
