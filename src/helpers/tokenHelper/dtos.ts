import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

////////////////////////////////////////////////////////////////////////////////

export interface TokenBalanceDto {
  mint: PublicKey;
  amount: BN;
  decimals: number;
  uiAmount: number;
  name: string;
}

export interface WalletBalancesDto {
  solBalance: BN;
  tokenBalances: TokenBalanceDto[];
}
