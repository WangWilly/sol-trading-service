import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

import { ComputeBudgetInfo } from "../../utils/dtos";

////////////////////////////////////////////////////////////////////////////////

export class FeeHelper {
  constructor(
    private readonly fixedFeeLamports: number | bigint,
    private readonly receiver: PublicKey
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  transferFeeIxProc(
    computeBudget: ComputeBudgetInfo,
    payerKey: PublicKey
  ): {
    transferFeeIx: TransactionInstruction;
    newComputeBudget: ComputeBudgetInfo;
  } | null {
    if (!this.fixedFeeLamports || this.fixedFeeLamports <= 0) {
      return null;
    }

    const transferFeeIx = SystemProgram.transfer({
      fromPubkey: payerKey,
      toPubkey: this.receiver,
      lamports: this.fixedFeeLamports,
    });

    // https://solana.com/developers/guides/advanced/how-to-use-priority-fees#how-do-i-implement-priority-fees
    const newComputeBudget = {
      unitPriceMicroLamports: computeBudget.unitPriceMicroLamports,
      unitsLimit: computeBudget.unitsLimit + 300,
    };

    return {
      transferFeeIx,
      newComputeBudget,
    };
  }
}
