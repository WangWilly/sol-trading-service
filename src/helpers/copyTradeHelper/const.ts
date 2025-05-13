////////////////////////////////////////////////////////////////////////////////

const COMMON_DEX_BASE = [
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // RAYDIUM_STANDARD_AMM
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // RAYDIUM_LEGACY_AMM_V4
  "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h", // RAYDIUM_STABLE_AMM
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // RAYDIUM_CLMM
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // ORCA_WHIRL_POOLS
  "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", // ORCA_TOKEN_SWAP
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // ORCA_TOKEN_SWAP_V2
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", // METEORA_DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // METEORA
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // PUMP_FUN
];

// RegExp for a string contains any of the COMMON_DEX_BASE
const base58Pattern = COMMON_DEX_BASE.map((base58) =>
  base58.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");
export const COMMON_DEX_REGEX = new RegExp(`(${base58Pattern})`);
