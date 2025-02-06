import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";

import {
  JupSwapClient,
  GetQuoteV1ParamDtoSchema,
  BuildSwapV1BodyDtoSchema,
} from "../src/utils/3rdParties/jup";

import { safe } from "../src/utils/exceptions";

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
  console.log(`quoteResult: ${quoteResult}`);

  //////////////////////////////////////////////////////////////////////////////

  const bunnerWalletPubkey = new PublicKey("HDs743XeHc6LS9akHf8sGVaonpGfP4YnZD2PD5M4HixZ");

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
  console.log(`buildSwapResult: ${buildSwapResult}`);
}

main();
