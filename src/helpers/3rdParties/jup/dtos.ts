import zod from "zod";

import BN from "bn.js";
import {
  AddressLookupTableAccount,
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransferParams,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  COMPUTE_BUDGET_PROGRAM_UNIT_LIMIT_IX,
  COMPUTE_BUDGET_PROGRAM_UNIT_PRICE_IX,
  SYSTEM_TRANSFER_IX,
} from "../../../utils/constants";
import { ComputeBudgetInfo } from "../../../utils/dtos";

////////////////////////////////////////////////////////////////////////////////

// GetQuote
// https://station.jup.ag/docs/swap-api/get-quote
// https://station.jup.ag/docs/api/quote

export const GetQuoteV1ParamDtoSchema = zod.object({
  inputMint: zod.instanceof(PublicKey).transform((v) => v.toString()),
  outputMint: zod.instanceof(PublicKey).transform((v) => v.toString()),
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

export const printGetQuoteV1Result = (quote: GetQuoteV1ResultDto): void => {
  console.log("🚀 ==> quote: {");
  console.log(`  inputMint: ${quote.inputMint}`);
  console.log(`  inAmount: ${quote.inAmount.toString()}`);
  console.log(`  outputMint: ${quote.outputMint}`);
  console.log(`  outAmount: ${quote.outAmount.toString()}`);
  console.log(
    `  otherAmountThreshold: ${quote.otherAmountThreshold.toString()}`
  );
  console.log(`  swapMode: ${quote.swapMode}`);
  console.log(`  slippageBps: ${quote.slippageBps}`);
  console.log(`  platformFee: ${quote.platformFee}`);
  console.log(`  priceImpactPct: ${quote.priceImpactPct}`);
  console.log(`  routePlan: [`);
  quote.routePlan.forEach((routePlan) => {
    console.log(`    {`);
    console.log(`      ammKey: ${routePlan.swapInfo.ammKey}`);
    console.log(`      label: ${routePlan.swapInfo.label}`);
    console.log(`      inputMint: ${routePlan.swapInfo.inputMint}`);
    console.log(`      outputMint: ${routePlan.swapInfo.outputMint}`);
    console.log(`      inAmount: ${routePlan.swapInfo.inAmount.toString()}`);
    console.log(`      outAmount: ${routePlan.swapInfo.outAmount.toString()}`);
    console.log(`      feeAmount: ${routePlan.swapInfo.feeAmount.toString()}`);
    console.log(`      feeMint: ${routePlan.swapInfo.feeMint}`);
    console.log(`      percent: ${routePlan.percent}`);
    console.log(`    }`);
  });
  console.log(`  ]`);
  console.log(`  contextSlot: ${quote.contextSlot}`);
  console.log(`  timeTaken: ${quote.timeTaken}`);
  console.log(`}`);
};

export const getQuoteV1ResultInStr = (quote: GetQuoteV1ResultDto): string => {
  return `Quote: {
  inputMint: ${quote.inputMint},
  inAmount: ${quote.inAmount.toString()},
  outputMint: ${quote.outputMint},
  outAmount: ${quote.outAmount.toString()},
  otherAmountThreshold: ${quote.otherAmountThreshold.toString()},
  swapMode: ${quote.swapMode},
  slippageBps: ${quote.slippageBps},
  platformFee: ${quote.platformFee},
  priceImpactPct: ${quote.priceImpactPct},
  routePlan: [
    ${quote.routePlan
      .map(
        (routePlan) => `{
      ammKey: ${routePlan.swapInfo.ammKey},
      label: ${routePlan.swapInfo.label},
      inputMint: ${routePlan.swapInfo.inputMint},
      outputMint: ${routePlan.swapInfo.outputMint},
      inAmount: ${routePlan.swapInfo.inAmount.toString()},
      outAmount: ${routePlan.swapInfo.outAmount.toString()},
      feeAmount: ${routePlan.swapInfo.feeAmount.toString()},
      feeMint: ${routePlan.swapInfo.feeMint},
      percent: ${routePlan.percent},
    }`
      )
      .join(",\n    ")}
  ],
  contextSlot: ${quote.contextSlot},
  timeTaken: ${quote.timeTaken}
}`;
};

////////////////////////////////////////////////////////////////////////////////

// Build Swap W/ Transacrtion
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

const BuildSwapV1BodyPriorityLevelWithMaxLamportsSchema = zod.object({
  maxLamports: zod.number(),
  priorityLevel: zod.enum(["veryHigh", "high", "medium"]),
});

const BuildSwapV1BodyJitoTipLamportsSchema = zod.object({
  jitoTipLamports: zod.number(),
});

/**
 * - https://station.jup.ag/docs/api/swap-instructions
 * - To specify a level or amount of additional fees to prioritize the transaction
 * - It can be used for EITHER priority fee OR Jito tip
 * - FIXME: If you want to include both, you will need to use `/swap-instructions` to add both at the same time (outcome w/ error) 🤔
 */
export const BuildSwapV1BodyPrioritizationFeeLamportsSchema = zod.union([
  BuildSwapV1BodyPriorityLevelWithMaxLamportsSchema,
  BuildSwapV1BodyJitoTipLamportsSchema,
]);

export const BuildSwapV1BodyDtoSchema = zod.object({
  userPublicKey: zod.instanceof(PublicKey).transform((v) => v.toString()), //
  wrapAndUnwrapSol: zod.boolean(), // 📌 To automatically wrap/unwrap SOL in the transaction
  //                               // 📌 If false, it will use wSOL token account
  //                               // 📌 Parameter will be ignored if destinationTokenAccount is set because the destinationTokenAccount may belong to a different user that we have no authority to close
  useSharedAccounts: zod.boolean().default(true), //
  feeAccount: zod.string().nullish(), // 📌 An Associated Token Address (ATA) of specific mints depending on SwapMode to collect fees
  trackingAccount: zod.string().nullish(), //
  prioritizationFeeLamports: BuildSwapV1BodyPrioritizationFeeLamportsSchema, //
  asLegacyTransaction: zod.boolean().default(false), //
  destinationTokenAccount: zod.string().nullish(), // 📌 Public key of a token account that will be used to receive the token out of the swap. If not provided, the signer's ATA will be used
  dynamicComputeUnitLimit: zod.boolean().default(true), // 📌 When enabled, it will do a swap simulation to get the compute unit used and set it in ComputeBudget's compute unit limit
  //                                                    // 📌 This will increase latency slightly since there will be one extra RPC call to simulate this
  //                                                    // 📌 This can be useful to estimate compute unit correctly and reduce priority fees needed or have higher chance to be included in a block
  skipUserAccountsRpcCalls: zod.boolean().default(false), //
  dynamicSlippage: zod.boolean().default(false), //
  computeUnitPriceMicroLamports: zod.number().nullish(), //
  quoteResponse: BuildSwapV1BodyQuoteRespDtoSchema, //
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
    simulatedIncurredSlippageBps: zod.number().nullable(), // TODO: zod.number().nullable()??
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

export const BuildSwapV1ResultDtoSchema = zod.union([
  BuildSwapV1ResultDtoOkPartSchema,
  BuildSwapV1ResultDtoErrPartSchema,
]);

export type BuildSwapV1ResultDto = zod.infer<typeof BuildSwapV1ResultDtoSchema>;

// Build Swap W/ Instructions
// https://station.jup.ag/docs/api/swap-instructions
// https://station.jup.ag/docs/swap-api/build-swap-transaction#build-your-own-transaction-with-instructions

/**
 * - https://station.jup.ag/docs/api/swap-instructions
 * - To specify a level or amount of additional fees to prioritize the transaction
 * - It can be used for EITHER priority fee OR Jito tip
 * - FIXME: If you want to include both, you will need to use `/swap-instructions` to add both at the same time (outcome w/ error) 🤔
 */
export const BuildSwapWithIxsV1BodyDtoSchema = BuildSwapV1BodyDtoSchema;

export type BuildSwapWithIxsV1BodyDto = zod.infer<
  typeof BuildSwapWithIxsV1BodyDtoSchema
>;

export const BuildSwapWithIxsV1IxDtoSchema = zod.object({
  programId: zod.string(),
  accounts: zod.array(
    zod.object({
      pubkey: zod.string(),
      isSigner: zod.boolean(),
      isWritable: zod.boolean(),
    })
  ),
  data: zod.string(),
});

export type BuildSwapWithIxsV1IxDto = zod.infer<
  typeof BuildSwapWithIxsV1IxDtoSchema
>;

export const BuildSwapWithIxsV1ResultDtoSchema = zod.object({
  otherInstructions: zod.array(BuildSwapWithIxsV1IxDtoSchema).nullable(), // 🤔 If you are using `useTokenLedger = true`.
  computeBudgetInstructions: zod.array(BuildSwapWithIxsV1IxDtoSchema), // The necessary instructions to setup the compute budget.
  setupInstructions: zod.array(BuildSwapWithIxsV1IxDtoSchema), // Setup missing ATA for the users.
  swapInstruction: BuildSwapWithIxsV1IxDtoSchema, // The actual swap instruction.
  cleanupInstruction: BuildSwapWithIxsV1IxDtoSchema.nullable(), // 📌 Unwrap the SOL if `wrapAndUnwrapSol = true`.
  addressLookupTableAddresses: zod.array(zod.string()), // 📌 The lookup table addresses that you can use if you are using versioned transaction.
});

export type BuildSwapWithIxsV1ResultDto = zod.infer<
  typeof BuildSwapWithIxsV1ResultDtoSchema
>;

export const printBuildSwapWithIxsV1Result = (
  result: BuildSwapWithIxsV1ResultDto
): void => {
  console.log("🚀 ==> buildSwapWithIxsV1Result: {");
  if (result.otherInstructions) {
    console.log(`  otherInstructions: [`);
    result.otherInstructions.forEach((ix) => {
      console.log(`    {`);
      console.log(`      programId: ${ix.programId}`);
      console.log(`      accounts: [`);
      ix.accounts.forEach((account) => {
        console.log(`        {`);
        console.log(`          pubkey: ${account.pubkey}`);
        console.log(`          isSigner: ${account.isSigner}`);
        console.log(`          isWritable: ${account.isWritable}`);
        console.log(`        }`);
      });
      console.log(`      ]`);
      console.log(`      data: ${ix.data}`);
      console.log(`    }`);
    });
    console.log(`  ]`);
  }
  console.log(`  computeBudgetInstructions: [`);
  result.computeBudgetInstructions.forEach((ix) => {
    console.log(`    {`);
    console.log(`      programId: ${ix.programId}`);
    console.log(`      accounts: [`);
    ix.accounts.forEach((account) => {
      console.log(`        {`);
      console.log(`          pubkey: ${account.pubkey}`);
      console.log(`          isSigner: ${account.isSigner}`);
      console.log(`          isWritable: ${account.isWritable}`);
      console.log(`        }`);
    });
    console.log(`      ]`);
    console.log(`      data: ${ix.data}`);
    console.log(`    }`);
  });
  console.log(`  ]`);
  console.log(`  setupInstructions: [`);
  result.setupInstructions.forEach((ix) => {
    console.log(`    {`);
    console.log(`      programId: ${ix.programId}`);
    console.log(`      accounts: [`);
    ix.accounts.forEach((account) => {
      console.log(`        {`);
      console.log(`          pubkey: ${account.pubkey}`);
      console.log(`          isSigner: ${account.isSigner}`);
      console.log(`          isWritable: ${account.isWritable}`);
      console.log(`        }`);
    });
    console.log(`      ]`);
    console.log(`      data: ${ix.data}`);
    console.log(`    }`);
  });
  console.log(`  ]`);
  console.log(`  swapInstruction: {`);
  console.log(`    programId: ${result.swapInstruction.programId}`);
  console.log(`    accounts: [`);
  result.swapInstruction.accounts.forEach((account) => {
    console.log(`      {`);
    console.log(`        pubkey: ${account.pubkey}`);
    console.log(`        isSigner: ${account.isSigner}`);
    console.log(`        isWritable: ${account.isWritable}`);
    console.log(`      }`);
  });
  console.log(`    ]`);
  console.log(`    data: ${result.swapInstruction.data}`);
  console.log(`  }`);
  if (result.cleanupInstruction) {
    console.log(`  cleanupInstruction: {`);
    console.log(`    programId: ${result.cleanupInstruction.programId}`);
    console.log(`    accounts: [`);
    result.cleanupInstruction.accounts.forEach((account) => {
      console.log(`      {`);
      console.log(`        pubkey: ${account.pubkey}`);
      console.log(`        isSigner: ${account.isSigner}`);
      console.log(`        isWritable: ${account.isWritable}`);
      console.log(`      }`);
    });
    console.log(`    ]`);
    console.log(`    data: ${result.cleanupInstruction.data}`);
    console.log(`  }`);
  }
  console.log(`  addressLookupTableAddresses: [`);
  result.addressLookupTableAddresses.forEach((address) => {
    console.log(`${address}`);
  });
  console.log(`  ]`);
  console.log(`}`);
};

////////////////////////////////////////////////////////////////////////////////
// helpers

const deserializeInstruction = (
  instruction: BuildSwapWithIxsV1IxDto
): TransactionInstruction => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  });
};

const getAddressLookupTableAccounts = async (
  conn: Connection,
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos = await conn.getMultipleAccountsInfo(
    keys.map((key) => new PublicKey(key))
  );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
};

export const getComputeBudgetFromBuildSwapWithIxsV1Result = (
  result: BuildSwapWithIxsV1ResultDto
): ComputeBudgetInfo => {
  const computeBudgetIxs = result.computeBudgetInstructions
    .filter((ix) => ix.programId === ComputeBudgetProgram.programId.toBase58())
    .map(deserializeInstruction);
  if (computeBudgetIxs.length === 0) {
    throw new Error("ComputeBudgetProgram instruction not found");
  }

  const unitLimitIx = computeBudgetIxs.find(
    (ix) => ix.data[0] === COMPUTE_BUDGET_PROGRAM_UNIT_LIMIT_IX
  );
  if (!unitLimitIx) {
    throw new Error("ComputeBudgetProgram unit limit instruction not found");
  }
  const parsedunitLimitIx =
    ComputeBudgetInstruction.decodeSetComputeUnitLimit(unitLimitIx);

  const unitPriceIx = computeBudgetIxs.find(
    (ix) => ix.data[0] === COMPUTE_BUDGET_PROGRAM_UNIT_PRICE_IX
  );
  if (!unitPriceIx) {
    // throw new Error("ComputeBudgetProgram unit price instruction not found");
    return {
      unitPriceMicroLamports: undefined,
      unitsLimit: parsedunitLimitIx.units,
    };
  }

  const parsedUnitPriceIx =
    ComputeBudgetInstruction.decodeSetComputeUnitPrice(unitPriceIx);
  return {
    unitPriceMicroLamports: parsedUnitPriceIx.microLamports,
    unitsLimit: parsedunitLimitIx.units,
  };
};

export const filterOutFeeInstructions = (
  instructions: BuildSwapWithIxsV1IxDto[]
): TransferParams[] => {
  return instructions
    .filter((ix) => ix.programId === SystemProgram.programId.toBase58())
    .map(deserializeInstruction)
    .filter((ix) => ix.data[0] === SYSTEM_TRANSFER_IX)
    .map((ix) => SystemInstruction.decodeTransfer(ix));
};

export const printTransferParams = (transferParams: TransferParams): void => {
  console.log("🚀 ==> transferParams: {");
  console.log(`  fromPubkey: ${transferParams.fromPubkey.toString()}`);
  console.log(`  toPubkey: ${transferParams.toPubkey.toString()}`);
  console.log(`  lamports: ${transferParams.lamports.toString()}`);
  console.log(`}`);
};

export const getTxFromBuildSwapWithIxsV1Result = async (
  conn: Connection,
  payerPublicKey: PublicKey,
  result: BuildSwapWithIxsV1ResultDto,
  customComputeBudget?: ComputeBudgetInfo,
  customIxs?: TransactionInstruction[]
): Promise<VersionedTransaction> => {
  const ixs: TransactionInstruction[] = [];

  if (customComputeBudget) {
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customComputeBudget.unitsLimit,
    });
    ixs.push(computeBudgetIx);

    if (customComputeBudget.unitPriceMicroLamports !== undefined) {
      const computeBudgetPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: customComputeBudget.unitPriceMicroLamports,
      });
      ixs.push(computeBudgetPriceIx);
    }
  } else {
    ixs.push(...result.computeBudgetInstructions.map(deserializeInstruction));
  }

  // Can use custom instructions to pay fees to the copy-trade-service
  if (customIxs) {
    ixs.push(...customIxs);
  }

  if (result.otherInstructions) {
    // Ix of tipping to Jito is included in otherInstructions
    ixs.push(...result.otherInstructions.map(deserializeInstruction));
  }
  ixs.push(...result.setupInstructions.map(deserializeInstruction));
  ixs.push(deserializeInstruction(result.swapInstruction));
  if (result.cleanupInstruction) {
    ixs.push(deserializeInstruction(result.cleanupInstruction));
  }

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(
    conn,
    result.addressLookupTableAddresses
  );

  // https://station.jup.ag/docs/swap-api/build-swap-transaction
  const blockhash = (await conn.getLatestBlockhash()).blockhash;
  const messageV0 = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message(addressLookupTableAccounts);

  return new VersionedTransaction(messageV0);
};
