import {
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

export class TransactionBuilder {
  private instructions: TransactionInstruction[] = [];
  private payerKey: PublicKey;

  constructor(
    payerKey: PublicKey,
    instructions: TransactionInstruction[] = []
  ) {
    this.payerKey = payerKey;
    this.instructions = [...instructions];
  }

  /**
   * 從 Transaction 或 VersionedTransaction 創建 Builder
   */
  static from(tx: VersionedTransaction): TransactionBuilder {
    const message = tx.message;

    const instructions = message.compiledInstructions.map((ix) => {
      return new TransactionInstruction({
        programId: message.staticAccountKeys[ix.programIdIndex], // 取得對應的 ProgramID
        keys: ix.accountKeyIndexes.map((index) => ({
          pubkey: message.staticAccountKeys[index],
          isSigner: message.isAccountSigner(index),
          isWritable: message.isAccountWritable(index),
        })),
        data: Buffer.from(ix.data), // ✅ 修正 data 的型別轉換 (Uint8Array -> Buffer)
      });
    });

    return new TransactionBuilder(message.staticAccountKeys[0], instructions);
  }

  /**
   * 添加指令
   */
  addInstruction(instruction: TransactionInstruction): this {
    this.instructions.push(instruction);
    return this;
  }

  /**
   * 插入 SOL 轉帳指令
   */
  addTransferInstruction(to: PublicKey, lamports: number): this {
    const transferIx = SystemProgram.transfer({
      fromPubkey: this.payerKey,
      toPubkey: to,
      lamports,
    });

    this.instructions.push(transferIx);
    return this;
  }

  /**
   * 移除指令
   */
  removeInstruction(index: number): this {
    if (index >= 0 && index < this.instructions.length) {
      this.instructions.splice(index, 1);
    }
    return this;
  }

  /**
   * 設定 Compute Budget (會自動避免重複插入)
   */
  setComputeBudget(units: number, unitPrice?: number): this {
    this.setComputeUnitLimit(units);
    if (unitPrice !== undefined) {
      this.setComputeUnitPrice(unitPrice);
    }
    return this;
  }

  /**
   * 設定 Compute Unit 限制 (避免重複插入)
   */
  setComputeUnitLimit(units: number): this {
    this.removeExistingComputeBudgetInstruction('ComputeUnitLimit');

    this.instructions.unshift(
      ComputeBudgetProgram.setComputeUnitLimit({ units })
    );

    return this;
  }

  /**
   * 設定 Compute Unit 價格 (避免重複插入)
   */
  setComputeUnitPrice(unitPrice: number): this {
    this.removeExistingComputeBudgetInstruction('ComputeUnitPrice');

    this.instructions.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice })
    );

    return this;
  }

  /**
   * 移除已經存在的 Compute Budget 指令，避免重複插入
   */
  private removeExistingComputeBudgetInstruction(
    type: 'ComputeUnitLimit' | 'ComputeUnitPrice'
  ) {
    this.instructions = this.instructions.filter(
      (ix) =>
        !(
          ix.programId.equals(ComputeBudgetProgram.programId) &&
          ((type === 'ComputeUnitLimit' && ix.data[0] === 2) ||
            (type === 'ComputeUnitPrice' && ix.data[0] === 3))
        )
    );
  }

  /**
   * 生成 VersionedTransaction
   */
  build(recentBlockhash: string): VersionedTransaction {
    if (!recentBlockhash) {
      throw new Error(
        'recentBlockhash is required to build VersionedTransaction'
      );
    }

    // 🏗️ 建立 TransactionMessage
    const messageV0 = new TransactionMessage({
      payerKey: this.payerKey,
      recentBlockhash,
      instructions: this.instructions,
    }).compileToV0Message();

    // 🔄 轉換成 VersionedTransaction
    return new VersionedTransaction(messageV0);
  }
}
