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

////////////////////////////////////////////////////////////////////////////////
// Connection URLs
export const SOLANA_RPC_HTTP_URL = "https://newest-icy-isle.solana-mainnet.quiknode.pro/c72249a674becf5948b09bfa6ba1269f41a28607";
export const SOLANA_RPC_WS_URL = "wss://newest-icy-isle.solana-mainnet.quiknode.pro/c72249a674becf5948b09bfa6ba1269f41a28607";

// Jupiter API
export const JUPITER_API_URL = "https://lite-api.jup.ag";

// Jito API
export const JITO_BLOCK_ENGINE_URL = "https://mainnet.block-engine.jito.wtf";
export const JITO_BUNDLES_URL = "https://bundles.jito.wtf";

////////////////////////////////////////////////////////////////////////////////
// Fee related
export const FEE_DESTINATION_PUBKEY = "81v6neWF9XPArSSeHoUqc49Zb6npuK4cWsErQ8TiA5Rh";
export const FEE_AMOUNT = 100_000;
