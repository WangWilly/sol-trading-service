import {
  AddressLookupTableAccount,
  Connection,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

export const insertIxToVersionedTx = async (
  conn: Connection,
  tx: VersionedTransaction,
  ix: TransactionInstruction
) => {
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
  const messageV0 = new TransactionMessage({
    payerKey: msg.payerKey,
    recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
    instructions: [...msg.instructions, ix],
  }).compileToV0Message();
  return new VersionedTransaction(messageV0);
};
