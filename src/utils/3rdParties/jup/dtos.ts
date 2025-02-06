import zod from "zod";

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

////////////////////////////////////////////////////////////////////////////////

// GetQuote
// https://station.jup.ag/docs/swap-api/get-quote
// https://station.jup.ag/docs/api/quote

export const GetQuoteV1ParamDtoSchema = zod.object({
  inputMint: zod.string(),
  outputMint: zod.string(),
  amount: zod.instanceof(BN).transform((v) => v.toString()), // ExactIn amount
  slippageBps: zod.number().default(50),
  restrictIntermediateTokens: zod.boolean().default(true),
});

export type GetQuoteV1ParamDto = zod.infer<typeof GetQuoteV1ParamDtoSchema>;

export const GetQuoteV1RoutePlanDtoSchema = zod.object({
  swapInfo: zod.object({
    ammKey: zod.string(),
    label: zod.string(),
    inputMint: zod.string(),
    outputMint: zod.string(),
    inAmount: zod.string().transform((v) => new BN(v)),
    outAmount: zod.string().transform((v) => new BN(v)),
    feeAmount: zod.string().transform((v) => new BN(v)),
    feeMint: zod.string(),
  }),
  percent: zod.number(),
});

export const GetQuoteV1ResultDtoSchema = zod.object({
  inputMint: zod.string(),
  inAmount: zod.string().transform((v) => new BN(v)),
  outputMint: zod.string(),
  outAmount: zod.string().transform((v) => new BN(v)),
  otherAmountThreshold: zod.string().transform((v) => new BN(v)),
  swapMode: zod.string(),
  slippageBps: zod.number(),
  platformFee: zod.string().nullable(),
  priceImpactPct: zod.string(),
  routePlan: zod.array(GetQuoteV1RoutePlanDtoSchema),
  contextSlot: zod.number(),
  timeTaken: zod.number(),
});

export type GetQuoteV1ResultDto = zod.infer<typeof GetQuoteV1ResultDtoSchema>;

////////////////////////////////////////////////////////////////////////////////

// Build Swap
// https://station.jup.ag/docs/swap-api/build-swap-transaction
// https://station.jup.ag/docs/api/swap

export const BuildSwapV1BodyQuoteRespRoutePlanDtoSchema = zod.object({
  swapInfo: zod.object({
    ammKey: zod.string(),
    label: zod.string(),
    inputMint: zod.string(),
    outputMint: zod.string(),
    inAmount: zod.instanceof(BN).transform((v) => v.toString()),
    outAmount: zod.instanceof(BN).transform((v) => v.toString()),
    feeAmount: zod.instanceof(BN).transform((v) => v.toString()),
    feeMint: zod.string(),
  }),
  percent: zod.number(),
});

export const BuildSwapV1BodyQuoteRespDtoSchema = zod.object({
  inputMint: zod.string(),
  inAmount: zod.instanceof(BN).transform((v) => v.toString()),
  outputMint: zod.string(),
  outAmount: zod.instanceof(BN).transform((v) => v.toString()),
  otherAmountThreshold: zod.instanceof(BN).transform((v) => v.toString()),
  swapMode: zod.string(),
  slippageBps: zod.number(),
  platformFee: zod.string().nullable(),
  priceImpactPct: zod.string(),
  routePlan: zod.array(BuildSwapV1BodyQuoteRespRoutePlanDtoSchema),
  contextSlot: zod.number(),
  timeTaken: zod.number(),
});

export const BuildSwapV1BodyPrioritizationFeeLamportsSchema = zod.object({
  priorityLevelWithMaxLamports: zod.object({
    maxLamports: zod.number(),
    priorityLevel: zod.string(),
  }),
});

export const BuildSwapV1BodyDtoSchema = zod.object({
  quoteResponse: BuildSwapV1BodyQuoteRespDtoSchema,
  userPublicKey: zod.instanceof(PublicKey).transform((v) => v.toString()),
  dynamicComputeUnitLimit: zod.boolean().default(true),
  dynamicSlippage: zod.boolean().default(true),
  prioritizationFeeLamports: BuildSwapV1BodyPrioritizationFeeLamportsSchema.default({
    priorityLevelWithMaxLamports: {
      maxLamports: 1000000,
      priorityLevel: "veryHigh",
    },
  }),
});

export type BuildSwapV1BodyDto = zod.infer<typeof BuildSwapV1BodyDtoSchema>;

const BuildSwapV1ResultDtoBaseSchema = zod.object({
  swapTransaction: zod.string(),
  lastValidBlockHeight: zod.number(),
  prioritizationFeeLamports: zod.number(),
  computeUnitLimit: zod.number(),
  prioritizationType: zod.object({
    computeBudget: zod.object({
      microLamports: zod.number(),
      estimatedMicroLamports: zod.number(),
    }),
  }),
});

const BuildSwapV1ResultDtoOkPartSchema = zod.object({
  ...BuildSwapV1ResultDtoBaseSchema.shape,
  dynamicSlippageReport: zod.object({
    slippageBps: zod.number(),
    otherAmount: zod.number(),
    simulatedIncurredSlippageBps: zod.number(),
    amplificationRatio: zod.string().nullable(), // TODO: zod.number().nullable()??
    categoryName: zod.string(),
    heuristicMaxSlippageBps: zod.number(),
  }),
  simulationError: zod.null(),
});

const BuildSwapV1ResultDtoErrPartSchema = zod.object({
  ...BuildSwapV1ResultDtoBaseSchema.shape,
  dynamicSlippageReport: zod.any(),
  simulationError: zod.object({
    errorCode: zod.string(),
    error: zod.string(),
  }),
});

export const BuildSwapV1ResultDtoSchema = zod.union([BuildSwapV1ResultDtoOkPartSchema, BuildSwapV1ResultDtoErrPartSchema]);

export type BuildSwapV1ResultDto = zod.infer<typeof BuildSwapV1ResultDtoSchema>;
