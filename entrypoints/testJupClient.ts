import { JupSwapClient, GetQuoteParamDtoSchema } from '../src/utils/3rdParties/jup';
import { safe } from '../src/utils/exceptions';
import { BN } from 'bn.js';

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const jupSwapClient = new JupSwapClient();

  const quoteParamsRaw = {
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: new BN(1000000000),
    slippageBps: 50,
    restrictIntermediateTokens: true,
  };
  const quoteParamsRes = await safe(GetQuoteParamDtoSchema.parseAsync(quoteParamsRaw));
  if (!quoteParamsRes.success) {
    console.error(quoteParamsRes.error);
    return;
  }
  const quoteParams = quoteParamsRes.data;
  const quoteResult = await jupSwapClient.getQuote(quoteParams);

  console.log(quoteResult);
};

main();
