import { BN } from "bn.js";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../src/helpers/3rdParties/jup";

import { VersionedTransaction } from "@solana/web3.js";
import { TransactionBuilder } from "../src/helpers/transactionBuilder";
import { BuildSwapWithIxsV1BodyDtoSchema, filterOutFeeInstructions, printBuildSwapWithIxsV1Result, printGetQuoteV1Result, printTransferParams } from "../src/helpers/3rdParties/jup/dtos";

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const jupSwapClient = new JupSwapClient();

  //////////////////////////////////////////////////////////////////////////////

  const quoteParamsRaw = {
    inputMint: new PublicKey("So11111111111111111111111111111111111111112"),
    outputMint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
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
  if (!quoteResult) {
    console.log("Failed to get quote");
    return;
  }
  printGetQuoteV1Result(quoteResult);

  //////////////////////////////////////////////////////////////////////////////

  const bunnerWalletPubkey = new PublicKey(
    "HDs743XeHc6LS9akHf8sGVaonpGfP4YnZD2PD5M4HixZ"
  );

  const buildSwapBodyRaw = {
    userPublicKey: bunnerWalletPubkey,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: {
      // priorityLevelWithMaxLamports: {
      //   maxLamports: 1_000_000,
      //   priorityLevel: "veryHigh",
      // },
      jitoTipLamports: 1000,
    },
    quoteResponse: quoteResult,
  };

  const buildSwapBody = BuildSwapWithIxsV1BodyDtoSchema.parse(buildSwapBodyRaw);
  const buildSwapResult = await jupSwapClient.buildSwapWithIxs(buildSwapBody);
  if (!buildSwapResult) {
    console.log("Failed to build swap transaction");
    return;
  }
  printBuildSwapWithIxsV1Result(buildSwapResult);

  if (buildSwapResult.otherInstructions) {
    filterOutFeeInstructions(buildSwapResult.otherInstructions).map(printTransferParams);
  }
  if (buildSwapResult.setupInstructions) {
    filterOutFeeInstructions(buildSwapResult.setupInstructions).map(printTransferParams);
  }
  
  // const buildSwapBodyRes = BuildSwapV1BodyDtoSchema.safeParse(buildSwapBodyRaw);
  // if (!buildSwapBodyRes.success) {
  //   console.log(`Failed to parse buildSwapBody: ${buildSwapBodyRes.error}`);
  //   return;
  // }
  // const buildSwapBody = buildSwapBodyRes.data;
  // const buildSwapResult = await jupSwapClient.buildSwapTx(buildSwapBody);
  // console.log("🚀 ==> buildSwapResult:");
  // console.log(buildSwapResult);
  // if (!buildSwapResult) {
  //   console.log("Failed to build swap transaction");
  //   return;
  // }

  // //////////////////////////////////////////////////////////////////////////////

  // const tx = VersionedTransaction.deserialize(
  //   Buffer.from(buildSwapResult.swapTransaction, "base64")
  // );
  // console.log("🚀 ==> tx:");
  // console.log(tx);

  // // construct the transfer instruction
  // const referralWalletPublicKey = new PublicKey(
  //   "99k9aSMfBcBQZLLChVhNWBf6Jd7kKnQjVyY9V4ffkzcP"
  // );
  // const transferInstruction = SystemProgram.transfer({
  //   fromPubkey: bunnerWalletPubkey,
  //   toPubkey: referralWalletPublicKey,
  //   lamports: 1000,
  // });

  // // insert the instruction into the transaction
  // const connection = new Connection(clusterApiUrl("mainnet-beta"));
  // /**
  // const updatedTxRes = await safe(
  //   insertIxToVersionedTx(connection, tx, transferInstruction)
  // );
  // if (!updatedTxRes.success) {
  //   console.log(`Failed to insert instruction: ${updatedTxRes.error}`);
  //   return;
  // }
  // const updatedTx = updatedTxRes.data;
  // console.log("🚀 ==> updatedTx:");
  // console.log(updatedTx);
  // */

  // //////////////////////////////////////////////////////////////////////////////

  // // const builder = TransactionBuilder.fromVersionedTxV1(tx);
  // // builder.addInstruction(transferInstruction);
  // // const updatedTxV2 = builder.build(await connection.getLatestBlockhash());
  // // console.log("🚀 ==> updatedTxV2:")
  // // console.log(updatedTxV2);

  // //////////////////////////////////////////////////////////////////////////////

  // // const ul = ComputeBudgetProgram.setComputeUnitLimit({ units: 1000 });
  // // console.log("🚀 ==> ul:");
  // // console.log(ul);
  // // console.log(ul.data[0] === 0x02);
  // // const up = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 });
  // // console.log("🚀 ==> up:")
  // // console.log(up);
  // // console.log(up.data[0] === 0x03);

  // const builder = await TransactionBuilder.fromVersionedTxV2(connection, tx);
  // console.log("🚀 ==> builder current unit price");
  // console.log(builder.getCurrentComputeUnitPrice());
  // console.log("🚀 ==> builder current unit limit");
  // console.log(builder.getCurrentComputeUnitLimit());

  // // builder.appendIx(transferInstruction);
  // // const updatedTxV2 = builder.build(await connection.getLatestBlockhash());
  // // console.log("🚀 ==> updatedTxV2:");
  // // console.log(updatedTxV2);
}

main();
