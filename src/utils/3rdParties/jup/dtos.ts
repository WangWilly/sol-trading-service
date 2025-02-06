import zod from 'zod';
import BN from "bn.js";

////////////////////////////////////////////////////////////////////////////////

// GetQuote
// https://station.jup.ag/docs/swap-api/get-quote
export const GetQuoteParamDtoSchema = zod.object({
    inputMint: zod.string(),
    outputMint: zod.string(),
    amount: zod.instanceof(BN).transform(v => v.toString()), // ExactIn amount
    slippageBps: zod.number().default(50),
    restrictIntermediateTokens: zod.boolean().default(true),
});

export type GetQuoteParamDto = zod.infer<typeof GetQuoteParamDtoSchema>;

export const GetQuoteRoutePlanDtoSchema = zod.object({
    swapInfo: zod.object({
        ammKey: zod.string(),
        label: zod.string(),
        inputMint: zod.string(),
        outputMint: zod.string(),
        inAmount: zod.string().transform(v => new BN(v)),
        outAmount: zod.string().transform(v => new BN(v)),
        feeAmount: zod.string().transform(v => new BN(v)),
        feeMint: zod.string(),
    }),
    percent: zod.number(),
});

export const GetQuoteResultDtoSchema = zod.object({
    inputMint: zod.string(),
    inAmount: zod.string().transform(v => new BN(v)),
    outputMint: zod.string(),
    outAmount: zod.string().transform(v => new BN(v)),
    otherAmountThreshold: zod.string().transform(v => new BN(v)),
    swapMode: zod.string(),
    slippageBps: zod.number(),
    platformFee: zod.string().nullable(),
    priceImpactPct: zod.string(),
    routePlan: zod.array(GetQuoteRoutePlanDtoSchema),
    contextSlot: zod.number(),
    timeTaken: zod.number(),
});

export type GetQuoteResultDto = zod.infer<typeof GetQuoteResultDtoSchema>;

////////////////////////////////////////////////////////////////////////////////
