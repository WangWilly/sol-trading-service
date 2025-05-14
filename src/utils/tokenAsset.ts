import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

////////////////////////////////////////////////////////////////////////////////

export interface TokenAsset {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  name: string; // Added name field for token name
}

/**
 * Fetches token metadata for a given mint address
 * @param connection - Solana RPC connection
 * @param mint - Token mint address
 * @returns The token name or abbreviated mint address if metadata not found
 */
async function getTokenName(connection: Connection, mint: string): Promise<string> {
  try {
    // For well-known tokens, you could implement a lookup table here
    if (mint === "So11111111111111111111111111111111111111112") {
      return "SOL";
    }
    
    // Try to get token metadata
    // This is a simplified approach - Metaplex's full implementation would be more robust
    const metadataPDA = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        new PublicKey(mint).toBuffer(),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    const accountInfo = await connection.getAccountInfo(metadataPDA[0]);
    
    if (!accountInfo) {
      // If metadata not found, return abbreviated mint address
      return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
    }
    
    // Parse metadata - this is a simplified version and might need adjustment
    // based on actual metadata structure
    const data = accountInfo.data;
    
    // Skip the first 1 + 32 + 32 bytes (version, update auth, mint)
    let nameLength = data[65];
    let name = data.slice(66, 66 + nameLength).toString('utf8');
    
    return name || `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  } catch (error) {
    // On error, return abbreviated mint address
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  }
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
  const assetsPromises = tokenAccounts.value
    .filter(account => {
      // Filter out empty accounts
      const amount = account.account.data.parsed.info.tokenAmount.amount;
      return parseInt(amount) > 0;
    })
    .map(async account => {
      const { info } = account.account.data.parsed;
      const { tokenAmount } = info;
      
      // Get token name for each token
      const name = await getTokenName(connection, info.mint);
      
      return {
        mint: info.mint,
        owner: info.owner,
        amount: tokenAmount.amount,
        decimals: tokenAmount.decimals,
        uiAmount: tokenAmount.uiAmount,
        name: name
      };
    });

  // Wait for all promises to resolve
  const assets = await Promise.all(assetsPromises);
  return assets;
}
