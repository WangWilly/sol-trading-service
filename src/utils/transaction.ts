import { VersionedTransaction } from "@solana/web3.js";

export const versionedTxToSerializedBase64 = (
  versionedTx: VersionedTransaction,
): string => {
  return Buffer.from(versionedTx.serialize()).toString("base64");
};
