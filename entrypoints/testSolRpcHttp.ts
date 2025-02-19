import { clusterApiUrl, Connection } from "@solana/web3.js";
import { safe } from "../src/utils/exceptions";
import { toSwapInfoDto } from "../src/utils/transactionHelper/toSwapInfo";
import { printSwapInfoDto } from "../src/utils/transactionHelper/dtos";

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const txSignature =
    "5u9EMyAER6DCATRmG3Zt3SCqrmCHbNY7bvtzFv1yoyum5RbgntkmcnbVw8CyrwKAHbs6GxBqvhoffKFt4rkdhqPh";

  const conn = new Connection(clusterApiUrl("mainnet-beta"));

  const tic = Date.now();

  const txRes = await safe(conn.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  }));
  if (!txRes.success) {
    console.info(`Failed to get tx: ${txRes.error}`);
    return;
  }
  if (!txRes.data) {
    console.info(`Tx not found`);
    return;
  }
  // console.log("🚀 ==> txRes:");
  // console.log(txRes.data);

  const swapInfo = toSwapInfoDto(txRes.data);
  if (!swapInfo) {
    console.info(`Failed to parse swapInfo`);
    return;
  }
  const toc = Date.now();
  console.info(`Time elapsed: ${toc - tic}ms`);
  console.log("🚀 ==> swapInfo:");
  printSwapInfoDto(swapInfo);
}

main();
