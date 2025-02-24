import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

export function loadPrivateKeyBase58(base58: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(base58));
}
