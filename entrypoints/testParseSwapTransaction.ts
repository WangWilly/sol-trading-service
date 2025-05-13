import { Connection } from "@solana/web3.js";
import * as txHelper from "../src/helpers/transactionHelper";

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const solWeb3Conn = new Connection("https://api.mainnet-beta.solana.com");

  const signature =
    "wRqdZaDDHUpWTSwPFuQmCpbgFQM2Z6pHUwXVxA1hKdJMQjn6mBx8tmqLtdT2413yr8TnDmFAfU7kyHRCw8xCyjb";
  const tx = await solWeb3Conn.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    console.log("Transaction not found");
    return;
  }
  console.log(tx);

  const info = await txHelper.toSwapInfoDto(solWeb3Conn, -1, signature, tx);
  if (!info) {
    console.log("Not a swap transaction");
    return;
  }
  txHelper.printSwapInfoDto(info);
}

main();
