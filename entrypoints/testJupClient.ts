import { BN } from "bn.js";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../src/utils/3rdParties/jup";

import { VersionedTransaction } from "@solana/web3.js";
import { insertIxToVersionedTx } from "../src/utils/transaction";
import { safe } from "../src/utils/exceptions";
import { TransactionBuilder } from "../src/utils/transactionBuilder";

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const jupSwapClient = new JupSwapClient();

  //////////////////////////////////////////////////////////////////////////////

  const quoteParamsRaw = {
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: new BN(1000),
    slippageBps: 50,
    restrictIntermediateTokens: true,
  };
  const quoteParamsRes = GetQuoteV1ParamDtoSchema.safeParse(quoteParamsRaw);
  if (!quoteParamsRes.success) {
    console.info(`Failed to parse quoteParams: ${quoteParamsRes.error}`);
    return;
  }
  const quoteParams = quoteParamsRes.data;
  const quoteResult = await jupSwapClient.getQuote(quoteParams);
  console.log("🚀 ==> quoteResult:");
  console.log(quoteResult);

  //////////////////////////////////////////////////////////////////////////////

  const bunnerWalletPubkey = new PublicKey(
    "HDs743XeHc6LS9akHf8sGVaonpGfP4YnZD2PD5M4HixZ"
  );

  const buildSwapBodyRaw = {
    quoteResponse: quoteResult,
    userPublicKey: bunnerWalletPubkey,
  };
  const buildSwapBodyRes = BuildSwapV1BodyDtoSchema.safeParse(buildSwapBodyRaw);
  if (!buildSwapBodyRes.success) {
    console.log(`Failed to parse buildSwapBody: ${buildSwapBodyRes.error}`);
    return;
  }
  const buildSwapBody = buildSwapBodyRes.data;
  const buildSwapResult = await jupSwapClient.buildSwapTx(buildSwapBody);
  console.log("🚀 ==> buildSwapResult:");
  console.log(buildSwapResult);
  if (!buildSwapResult) {
    console.log("Failed to build swap transaction");
    return;
  }

  //////////////////////////////////////////////////////////////////////////////

  const tx = VersionedTransaction.deserialize(
    Buffer.from(buildSwapResult.swapTransaction, "base64")
  );
  console.log("🚀 ==> tx:");
  console.log(tx);

  // construct the transfer instruction
  const referralWalletPublicKey = new PublicKey(
    "99k9aSMfBcBQZLLChVhNWBf6Jd7kKnQjVyY9V4ffkzcP"
  );
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: bunnerWalletPubkey,
    toPubkey: referralWalletPublicKey,
    lamports: 1000,
  });

  // insert the instruction into the transaction
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  /**
  const updatedTxRes = await safe(
    insertIxToVersionedTx(connection, tx, transferInstruction)
  );
  if (!updatedTxRes.success) {
    console.log(`Failed to insert instruction: ${updatedTxRes.error}`);
    return;
  }
  const updatedTx = updatedTxRes.data;
  console.log("🚀 ==> updatedTx:");
  console.log(updatedTx);
  */

  //////////////////////////////////////////////////////////////////////////////

  // const builder = TransactionBuilder.fromVersionedTxV1(tx);
  // builder.addInstruction(transferInstruction);
  // const updatedTxV2 = builder.build(await connection.getLatestBlockhash());
  // console.log("🚀 ==> updatedTxV2:")
  // console.log(updatedTxV2);

  //////////////////////////////////////////////////////////////////////////////

  // const ul = ComputeBudgetProgram.setComputeUnitLimit({ units: 1000 });
  // console.log("🚀 ==> ul:");
  // console.log(ul);
  // console.log(ul.data[0] === 0x02);
  // const up = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 });
  // console.log("🚀 ==> up:")
  // console.log(up);
  // console.log(up.data[0] === 0x03);

  const builder = await TransactionBuilder.fromVersionedTxV2(connection, tx);
  builder.appendIx(transferInstruction);
  const updatedTxV2 = builder.build(await connection.getLatestBlockhash());
  console.log("🚀 ==> updatedTxV2:");
  console.log(updatedTxV2);
}

main();
