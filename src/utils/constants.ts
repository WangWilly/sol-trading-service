////////////////////////////////////////////////////////////////////////////////
// Https - headers
export const CONTENT_TYPE_KEY = "Content-Type";
export const CONTENT_TYPE_VAL_JSON = "application/json";

export const API_TOKEN_KEY = "x-api-key";
export const JITO_TOKEN_KEY = "x-jito-auth";

////////////////////////////////////////////////////////////////////////////////
// Solana program
export const COMPUTE_BUDGET_PROGRAM_UNIT_LIMIT_IX = 0x02; // ix: TransactionInstruction; ix.programId.equals(ComputeBudgetProgram.programId) && ix.data[0] === 0x02
export const COMPUTE_BUDGET_PROGRAM_UNIT_PRICE_IX = 0x03; // ix: TransactionInstruction; ix.programId.equals(ComputeBudgetProgram.programId) && ix.data[0] === 0x03

export const SYSTEM_TRANSFER_IX = 0x02; // ix: TransactionInstruction; ix.programId.equals(SystemProgram.programId) && ix.data[0] === 0x02

////////////////////////////////////////////////////////////////////////////////
export const FULL_SELLING_BPS: number = 10000;
