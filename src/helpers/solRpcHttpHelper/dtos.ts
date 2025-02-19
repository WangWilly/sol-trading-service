/**
import zod from "zod";

////////////////////////////////////////////////////////////////////////////////

export const TransactionV1MsgAccountKeyDtoSchema = zod.object({
    pubkey: zod.string(),
    signer: zod.boolean(),
    source: zod.string(),
    writable: zod.boolean(),
});

// https://solana.com/docs/rpc/json-structures#json
export const TransactionV1DtoSchema = zod.object({
    message: zod.object({
        accountKeys: zod.array(zod.string()),
        header: zod.object({
            numRequiredSignatures: zod.number(),
            numReadonlySignedAccounts: zod.number(),
            numReadonlyUnsignedAccounts: zod.number(),
        }),
        recentBlockhash: zod.string(),
        instructions: zod.array(zod.object({
            programIdIndex: zod.number(),
            accounts: zod.array(zod.number()).nullish(),
            data: zod.string(),
        })),
        addressTableLookups: zod.array(zod.object({
            accountKey: zod.string(),
            writableIndexes: zod.array(zod.number()),
            readonlyIndexes: zod.array(zod.number()),
        })).nullable(),
    }),
    signatures: zod.array(zod.string()),
});

export type TransactionV1Dto = zod.infer<typeof TransactionV1DtoSchema>;

// https://solana.com/docs/rpc/json-structures#inner-instructions
export const TransactionV1InnerIxDtoSchema = zod.object({
    index: zod.number(),
    instructions: zod.array(zod.object({
        programIdIndex: zod.number(),
        accounts: zod.array(zod.number()),
        data: zod.string(),
    })),
});

export type TransactionV1InnerIxDto = zod.infer<typeof TransactionV1InnerIxDtoSchema>;

// https://solana.com/docs/rpc/json-structures#token-balances
export const TransactionV1TokenBalanceDtoSchema = zod.object({
    accountIndex: zod.number(),
    mint: zod.string(),
    owner: zod.string().nullable(),
    programId: zod.string().nullable(),
    uiTokenAmount: zod.object({
        amount: zod.string(),
        decimals: zod.number(),
        uiAmount: zod.number().nullable(),
        uiAmountString: zod.string(),
    }),
});

export type TransactionV1TokenBalanceDto = zod.infer<typeof TransactionV1TokenBalanceDtoSchema>;

////////////////////////////////////////////////////////////////////////////////

// https://solana.com/docs/rpc/http/gettransaction#result
export const GetTransactionV1ResultDataDtoSchema = zod.object({
  slot: zod.number(), // TODO: check if this is correct
  // transaction: zod.union([TransactionV1DtoSchema, zod.array(zod.string())]),
  transaction: TransactionV1DtoSchema,
  blockTime: zod.number().nullable(),
  meta: zod.object({
    err: zod.any().nullable(),
    fee: zod.number(), // TODO: check if this is correct
    preBalances: zod.array(zod.number()), // TODO: check if this is correct
    postBalances: zod.array(zod.number()), // TODO: check if this is correct
    innerInstructions: zod.array(TransactionV1InnerIxDtoSchema).nullable(),
    preTokenBalances: zod.array(TransactionV1TokenBalanceDtoSchema).nullable(),
    postTokenBalances: zod.array(TransactionV1TokenBalanceDtoSchema).nullable(),
    logMessages: zod.array(zod.string()).nullable(),
    rewards: zod.array(
      zod.object({
        pubkey: zod.string(),
        lamports: zod.string(),
        postBalance: zod.number(), // TODO: check if this is correct
        rewardType: zod.string(),
        commission: zod.string().nullable(),
      })
    ).nullable(),
    loadedAddresses: zod.object({
      writable: zod.array(zod.string()),
      readonly: zod.array(zod.string()),
    }).nullish(),
    returnData: zod.object({
      programId: zod.string(),
      data: zod.array(zod.string()),
    }).nullish(),
    computeUnitsConsumed: zod.number().nullish(),
  }).nullable(),
  version: zod.union([zod.literal("legacy"), zod.number()]).nullable(),
});

export type GetTransactionV1ResultDataDto = zod.infer<typeof GetTransactionV1ResultDataDtoSchema>;

export const GetTransactionV1ResultDtoSchema = zod.object({
  jsonrpc: zod.literal("2.0"),
  id: zod.number(),
  result: GetTransactionV1ResultDataDtoSchema.nullable(),
});

export type GetTransactionV1ResultDto = zod.infer<typeof GetTransactionV1ResultDtoSchema>;
*/
