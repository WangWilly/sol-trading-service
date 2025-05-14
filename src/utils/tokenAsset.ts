import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

////////////////////////////////////////////////////////////////////////////////

export interface TokenAsset {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

/**
 * Fetches all token assets held by a wallet address
 * @param walletAddress - The wallet's public key
 * @param connection - Solana RPC connection
 * @returns Array of token assets with their details
 */
export async function getWalletTokenAssets(
  walletAddress: PublicKey, 
  connection: Connection
): Promise<TokenAsset[]> {
  // Get all token accounts owned by the wallet
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletAddress,
    { programId: TOKEN_PROGRAM_ID }
  );
  
  // Transform the response into a more usable format
  const assets: TokenAsset[] = tokenAccounts.value
    .filter(account => {
      // Filter out empty accounts
      const amount = account.account.data.parsed.info.tokenAmount.amount;
      return parseInt(amount) > 0;
    })
    .map(account => {
      const { info } = account.account.data.parsed;
      const { tokenAmount } = info;
      
      return {
        mint: info.mint,
        owner: info.owner,
        amount: tokenAmount.amount,
        decimals: tokenAmount.decimals,
        uiAmount: tokenAmount.uiAmount
      };
    });

  return assets;
}
