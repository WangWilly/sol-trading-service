import {
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  AddressLookupTableAccount,
  Connection,
  BlockhashWithExpiryBlockHeight,
} from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

export class TransactionBuilder {
  private ixs: TransactionInstruction[] = [];
  private payerKey: PublicKey;

  private constructor(
    payerKey: PublicKey,
    instructions: TransactionInstruction[] = []
  ) {
    this.payerKey = payerKey;
    this.ixs = [...instructions];
  }

  //////////////////////////////////////////////////////////////////////////////

  static fromVersionedTxV1(tx: VersionedTransaction): TransactionBuilder {
    const message = tx.message;

    const instructions = message.compiledInstructions.map((ix) => {
      return new TransactionInstruction({
        programId: message.staticAccountKeys[ix.programIdIndex], // 取得對應的 ProgramID
        keys: ix.accountKeyIndexes.map((index) => {
          // TODO: buggy usage
          // https://solana.stackexchange.com/questions/11981/the-account-index-does-not-exist-in-accountkeys
          if (message.staticAccountKeys[index] === undefined) {
            throw new Error(`Account not found: ${index}`);
          }
          return {
            pubkey: message.staticAccountKeys[index],
            isSigner: message.isAccountSigner(index),
            isWritable: message.isAccountWritable(index),
          };
        }),
        data: Buffer.from(ix.data),
      });
    });

    return new TransactionBuilder(message.staticAccountKeys[0], instructions);
  }

  static async fromVersionedTxV2(
    conn: Connection,
    tx: VersionedTransaction,
    newPayerKey: PublicKey | null = null
  ): Promise<TransactionBuilder> {
    // https://solana.stackexchange.com/questions/17269/add-instructions-to-versioned-transactions
    // https://station.jup.ag/docs/old/additional-topics/composing-with-versioned-transaction
    const addressLookupTableAccounts = await Promise.all(
      tx.message.addressTableLookups.map(async (lookup) => {
        const accInfo = await conn.getAccountInfo(lookup.accountKey);
        if (!accInfo) {
          throw new Error(`Account not found: ${lookup.accountKey}`);
        }
        return new AddressLookupTableAccount({
          key: lookup.accountKey,
          state: AddressLookupTableAccount.deserialize(accInfo.data),
        });
      })
    );

    const msg = TransactionMessage.decompile(tx.message, {
      addressLookupTableAccounts,
    });

    return new TransactionBuilder(
      newPayerKey || msg.payerKey,
      msg.instructions
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  appendIx(instruction: TransactionInstruction): this {
    this.ixs.push(instruction);
    return this;
  }

  appendTransferIx(to: PublicKey, lamports: number | bigint): this {
    const transferIx = SystemProgram.transfer({
      fromPubkey: this.payerKey,
      toPubkey: to,
      lamports,
    });

    this.ixs.push(transferIx);
    return this;
  }

  removeInstruction(index: number): this {
    if (index >= 0 && index < this.ixs.length) {
      this.ixs.splice(index, 1);
    }
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Compute Budget
  // https://solana.stackexchange.com/questions/9294/how-to-do-correctly-calculate-computing-budget
  // https://solana.com/developers/guides/advanced/how-to-request-optimal-compute

  /**
   * 設定 Compute Unit 限制 (避免重複插入)
   */
  setComputeUnitLimit(units: number): this {
    this.removeExistingComputeBudgetInstruction("ComputeUnitLimit");

    this.ixs.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));

    return this;
  }

  /**
   * 設定 Compute Unit 價格 (避免重複插入)
   */
  setComputeUnitPrice(unitPrice: number): this {
    this.removeExistingComputeBudgetInstruction("ComputeUnitPrice");

    this.ixs.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice })
    );

    return this;
  }

  /**
   * 移除已經存在的 Compute Budget 指令，避免重複插入
   * https://github.com/solana-labs/solana/blob/7700cb3128c1f19820de67b81aa45d18f73d2ac0/sdk/src/compute_budget.rs#L25
   * https://github.com/solana-labs/solana/blob/7700cb3128c1f19820de67b81aa45d18f73d2ac0/sdk/program/src/instruction.rs#L389
   */
  private removeExistingComputeBudgetInstruction(
    type: "ComputeUnitLimit" | "ComputeUnitPrice"
  ) {
    this.ixs = this.ixs.filter(
      (ix) =>
        !(
          ix.programId.equals(ComputeBudgetProgram.programId) &&
          ((type === "ComputeUnitLimit" && ix.data[0] === 0x02) ||
            (type === "ComputeUnitPrice" && ix.data[0] === 0x03))
        )
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  build(recentBlockhash: BlockhashWithExpiryBlockHeight): VersionedTransaction {
    const messageV0 = new TransactionMessage({
      payerKey: this.payerKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: this.ixs,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }
}
