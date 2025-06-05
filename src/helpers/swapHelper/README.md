# SwapHelper

A comprehensive helper class for executing direct buy and sell operations on Solana tokens, designed with a similar structure to CopyTradeHelper but focused on user-initiated swaps.

## Features

### Core Functionality
- **Direct Token Swaps**: Buy tokens with SOL and sell tokens for SOL
- **Configurable Settings**: Comprehensive configuration system for slippage, fees, and trading preferences
- **Balance Management**: Real-time wallet balance tracking for SOL and tokens
- **Swap Validation**: Parameter validation and safety checks
- **Transaction History**: Persistent logging of all swap operations

### Advanced Features
- **Auto Slippage**: Dynamic slippage calculation based on market conditions
- **Sandwich Protection**: Optional high slippage mode to avoid MEV attacks
- **Quick Operations**: Predefined buy amounts and sell percentages
- **Safety Checks**: Basic token safety validation
- **Persistence**: Save/load configuration and history to disk

## Usage

### Basic Setup

```typescript
import { SwapHelper } from "./helpers/swapHelper";

// Initialize with dependencies
const swapHelper = new SwapHelper(
  playerKeypair,        // Wallet keypair
  connection,           // Solana RPC connection
  jupSwapClient,        // Jupiter swap client
  jitoClient,          // Jito client for MEV protection
  feeHelper,           // Fee calculation helper
  {
    // Optional initial configuration
    defaultSlippageBps: 500,     // 5% default slippage
    autoSlippage: true,          // Enable auto slippage
    sandwichMode: false,         // Disable sandwich protection
    customBuyAmounts: [0.1, 0.5, 1, 5],  // Quick buy amounts in SOL
  },
  logger,              // Optional logger
  true,                // Enable persistence
  "data/swap-data.json" // Persistence file path
);

// Initialize (loads saved configuration)
await swapHelper.initialize();
```

### Configuration Management

```typescript
// Get current configuration
const config = swapHelper.getConfig();

// Update configuration
await swapHelper.updateConfig({
  defaultSlippageBps: 750,  // Change to 7.5%
  buyPriorityFee: 0.0002,   // Increase priority fee
  customBuyAmounts: [0.05, 0.1, 0.25, 0.5, 1, 2],
});

// Reset to defaults
await swapHelper.resetConfig();
```

### Balance Queries

```typescript
// Get SOL balance
const solBalance = await swapHelper.getSolBalance();
console.log(`SOL Balance: ${SwapHelper.lamportsToSol(solBalance)} SOL`);

// Get specific token balance
const tokenMint = new PublicKey("TokenMintAddress...");
const tokenBalance = await swapHelper.getTokenBalance(tokenMint);
if (tokenBalance) {
  console.log(`Token Balance: ${tokenBalance.uiAmount}`);
}

// Get all wallet balances
const balances = await swapHelper.getWalletBalances();
console.log(`SOL: ${SwapHelper.lamportsToSol(balances.solBalance)}`);
balances.tokenBalances.forEach(token => {
  console.log(`${token.mint.toBase58()}: ${token.uiAmount}`);
});
```

### Buy Operations

```typescript
// Basic buy operation
const buyResult = await swapHelper.buy({
  tokenMint: new PublicKey("TokenMintAddress..."),
  solAmount: SwapHelper.solToLamports(1), // Buy with 1 SOL
});

if (buyResult.success) {
  console.log(`Buy successful! Signature: ${buyResult.signature}`);
} else {
  console.error(`Buy failed: ${buyResult.error}`);
}

// Buy with custom slippage
const customBuyResult = await swapHelper.buy({
  tokenMint: new PublicKey("TokenMintAddress..."),
  solAmount: SwapHelper.solToLamports(0.5),
  slippageBps: 1000, // 10% slippage
  priorityFee: 0.0005, // Custom priority fee
});

// Quick buy using predefined amounts
const quickBuyResult = await swapHelper.quickBuy(
  new PublicKey("TokenMintAddress..."),
  2 // Use the 3rd amount in customBuyAmounts array
);
```

### Sell Operations

```typescript
// Sell specific amount
const sellResult = await swapHelper.sell({
  tokenMint: new PublicKey("TokenMintAddress..."),
  tokenAmount: new BN("1000000"), // Raw token amount
});

// Sell percentage of holdings
const percentageSellResult = await swapHelper.sell({
  tokenMint: new PublicKey("TokenMintAddress..."),
  tokenAmount: new BN(0), // Will be calculated from percentage
  percentage: 0.5, // Sell 50% of holdings
});

// Quick sell using predefined percentages
const quickSellResult = await swapHelper.quickSell(
  new PublicKey("TokenMintAddress..."),
  3 // Use the 4th percentage in customSellPercentages array
);
```

### Safety and Validation

```typescript
// Check if token is safe to trade
const tokenMint = new PublicKey("TokenMintAddress...");
const safetyCheck = await swapHelper.isTokenSafe(tokenMint);

if (safetyCheck.safe) {
  console.log("Token appears safe to trade");
} else {
  console.warn("Token safety warnings:", safetyCheck.warnings);
}
```

### History Management

```typescript
// Get swap history
const history = await swapHelper.getSwapHistory(10); // Last 10 swaps
history.forEach(entry => {
  console.log(`${entry.type} ${entry.tokenMint} - ${entry.success ? 'Success' : 'Failed'}`);
  console.log(`Signature: ${entry.signature}`);
});

// Clear history
await swapHelper.clearHistory();
```

### Graceful Shutdown

```typescript
// Save state and shutdown
await swapHelper.gracefulShutdown();
```

## Configuration Options

### SwapConfig Interface

```typescript
interface SwapConfig {
  // Slippage settings
  defaultSlippageBps: number;      // Default: 500 (5%)
  minSlippageBps: number;          // Default: 250 (2.5%)
  maxSlippageBps: number;          // Default: 3000 (30%)
  autoSlippage: boolean;           // Default: true
  
  // Sandwich protection
  sandwichMode: boolean;           // Default: false
  sandwichSlippageBps: number;     // Default: 5000 (50%)
  
  // Priority fees (in SOL)
  buyPriorityFee: number;          // Default: 0.0001
  sellPriorityFee: number;         // Default: 0.0001
  
  // Jito settings
  jitoTipPercentile: string;       // Default: "landed_tips_95th_percentile"
  
  // Quick operation presets
  customBuyAmounts: number[];      // Default: [0.05, 0.1, 0.5, 1, 3]
  customSellPercentages: number[]; // Default: [0.25, 0.5, 0.75, 1.0]
}
```

## Architecture

### Components

1. **SwapHelper**: Main orchestrator class
2. **TokenBalanceManager**: Handles wallet balance queries and calculations
3. **SwapValidator**: Validates parameters and calculates optimal settings
4. **SwapExecutor**: Executes actual swap transactions (reused from existing code)
5. **SwapPersistence**: Handles data persistence (JSON file or memory)

### Dependencies

- **SwapExecutor**: Reuses existing swap execution logic
- **Jupiter Integration**: Via JupSwapClient for quotes and transaction building
- **Jito Integration**: Via JitoClient for MEV protection
- **FeeHelper**: For priority fee calculations

## Error Handling

The SwapHelper includes comprehensive error handling:

- Parameter validation before execution
- Balance checking before swaps
- Transaction failure handling
- Automatic retry logic (via SwapExecutor)
- Detailed error logging

## Integration Example

Here's how to integrate SwapHelper into a CLI or bot application:

```typescript
// CLI Command Handler
async function handleBuyCommand(tokenAddress: string, solAmount: number) {
  try {
    const result = await swapHelper.buy({
      tokenMint: new PublicKey(tokenAddress),
      solAmount: SwapHelper.solToLamports(solAmount),
    });
    
    if (result.success) {
      console.log(`✅ Buy successful!`);
      console.log(`📝 Transaction: ${result.signature}`);
      console.log(`💰 Spent: ${solAmount} SOL`);
    } else {
      console.error(`❌ Buy failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`💥 Unexpected error: ${error}`);
  }
}

// Bot Integration
async function handleTelegramBuyCallback(tokenMint: string, amountIndex: number) {
  const result = await swapHelper.quickBuy(
    new PublicKey(tokenMint),
    amountIndex
  );
  
  return {
    success: result.success,
    message: result.success 
      ? `🚀 Buy order executed! TX: ${result.signature}`
      : `❌ Buy failed: ${result.error}`,
  };
}
```

This SwapHelper provides a clean, well-structured interface for direct token trading while maintaining the same architectural patterns as the existing CopyTradeHelper.
