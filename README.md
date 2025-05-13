# Core (service) for copy trading

This module will be frequently updated. Serve as listener for the target account and copy the trades to the source account.

## Development

### 🔧 Prerequisite: Bun Installation

Follow these instructions to install Bun JavaScript runtime ([official documentation](https://bun.sh/docs/installation)):

```bash
# For macOS operating systems
brew install oven-sh/bun/bun

# Verify the installation by checking the version
bun --version

# Configure shell environment
# First, identify your current shell environment:
echo $SHELL

# Add the following configuration to your shell profile file (e.g., ~/.zshrc):
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### 🧪 Testing

Run the following test scripts to ensure everything is working properly:

```bash
./scripts/test-jup-client.sh        # Test Jupiter client integration
./scripts/test-parse-swap-transaction.sh  # Test swap transaction parsing
```

### 🚀 Running the Service

#### Step 1: Configure environment
Create a `.env` file in the project root with the following content:

```env
PRIVATE_KEY_BASE58=<private_key_base58>  # Your private key in Base58 format
```

#### Step 2: Start the service
Use the `solRpcWsSubscribeManager` in the main function to subscribe to the target account:

```bash
./scripts/run-trade-serve.sh
```

### 📦 Building for Production

Build the project for production deployment:

```bash
./scripts/build-trade-serve.sh
```

### ▶️ Executing the Built Application

To run the compiled application:

```bash
./scripts/start-trade-serve.sh
```

### 🖥️ Using the CLI Interface

The service comes with an interactive CLI for managing copy trading strategies.

#### Starting the CLI

To launch the CLI interface:

```bash
bun run src/cli.ts
```

Or from the compiled version:

```bash
node dist/cli.js
```

#### Available Features

The CLI provides the following functionality:

1. **View Service Status** - Check the WebSocket connection status and active strategies
2. **List Active Strategies** - View all configured copy trading strategies
3. **Create Buy Strategy** - Set up a new strategy to copy buy trades from a target wallet
4. **Create Sell Strategy** - Set up a new strategy to copy sell trades from a target wallet
5. **Remove Strategy** - Delete an existing strategy
6. **Exit** - Gracefully shut down the service

#### Example Workflows

**Creating a Buy Strategy:**
1. Select "Create buy strategy" from the main menu
2. Enter the target wallet address to copy trades from
3. Provide a name for your strategy
4. Enter the amount of SOL to use for trades (in lamports)
5. Set your desired slippage tolerance in basis points (e.g., 100 = 1%)

**Creating a Sell Strategy:**
1. Select "Create sell strategy" from the main menu
2. Enter the target wallet address to copy trades from
3. Provide a name for your strategy
4. Set the fixed selling percentage in basis points (e.g., 500 = 5%)
5. Set your desired slippage tolerance in basis points

**Managing Strategies:**
- Use "List active strategies" to view all current strategies
- Use "Remove strategy" to delete a strategy that's no longer needed
- Use "View service status" to check the connection and activity status

---

## References

### Jupiter Exchange Integration

The service utilizes [Jupiter](https://jup.ag/) for transaction processing on the Solana blockchain.

#### Documentation

- [General Documentation](https://station.jup.ag/docs/)
- [API Overview](https://station.jup.ag/docs/swap-api/get-quote)
- [Comprehensive API Documentation](https://station.jup.ag/docs/api/introduction)
- [Supported Decentralized Exchanges](https://api.jup.ag/swap/v1/program-id-to-label)

#### API Resources

- [Fee Structure Information](https://station.jup.ag/guides/general/faq#does-jupiter-swap-charge-any-fees)
- [Platform Fee Clarification](https://www.bbx.com/news-detail/1898146)
- [Legacy API Documentation](https://station.jup.ag/docs/old/apis/landing-transactions)
- [Swap Instructions Documentation](https://station.jup.ag/docs/api/swap-instructions)
- [Jupiter API Swap Transaction with Priority Fee](https://solana.stackexchange.com/questions/19136/how-to-get-a-swap-transaction-from-jupiter-api-which-uses-a-priority-fee-and-jit)
- [Understanding Transaction Fees on Jupiter Swaps](https://www.reddit.com/r/solana/comments/1bjh2g5/understanding_the_transaction_fees_on_a_jupiter/)

### Fee and Priority Optimization

#### Transaction Fee Management

- [Implementing Priority Fees on Solana](https://solana.com/developers/guides/advanced/how-to-use-priority-fees)
- [Helius Priority Fee API Documentation](https://docs.helius.dev/solana-apis/priority-fee-api)
- [Transaction Fee Optimization Discussion](https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/)
- [Transaction Speed Optimization](https://solana.stackexchange.com/questions/11860/how-to-optimize-transaction-speed)
- [Solana Fees and Burn Tracker](https://solanacompass.com/statistics/fees)

#### Compute Budget Optimization

- [Official Solana Transaction Fee Documentation](https://solana.com/docs/core/fees)
- [Requesting Optimal Compute Budget](https://solana.com/developers/guides/advanced/how-to-request-optimal-compute)
- [JavaScript/TypeScript Helpers for Solana](https://github.com/solana-developers/helpers)
- [Optimizing Compute Usage on Smart Contracts](https://solana.com/developers/guides/advanced/how-to-optimize-compute)

#### Jito Tips and Advanced Configuration

- [QuickNode Transaction Documentation](https://www.quicknode.com/docs/solana/transactions)
- [Jito Low Latency Transaction Documentation](https://docs.jito.wtf/lowlatencytxnsend/#tip-amount)

### Additional Resources

- [Axen Sniper Bot Documentation](https://documentation.axenai.com/axen-sniper-bot/settings-command)
- [Adding Custom Fees to Jupiter Swaps](https://solana.stackexchange.com/questions/13356/how-to-add-my-own-fee-to-jupiter-swap)
- [Jupiter API Trading Bot Guide](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot)
- [Solana Trading Bot Discussion](https://www.reddit.com/r/solana/comments/1ghytve/safetrustworthy_sol_trading_bots/)
- [Automated Memecoin Trading Bot](https://www.reddit.com/r/solana/comments/1ikbulw/automated_memecoin_trading_bot/)
- [Trading Bot Usage Discussion](https://www.reddit.com/r/solana/comments/1idniwf/anyone_here_using_trading_bots/)
- [Building Solana Trading Bots Guide](https://www.solulab.com/how-to-build-solana-trading-bots/)
- [ARB Protocol Jupiter Bot Implementation](https://github.com/ARBProtocol/solana-jupiter-bot)
- [Copy Trading Implementation Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade)
- [Failed Swap Transaction Analysis](https://www.reddit.com/r/solana/comments/1i5czkh/phantom_wallet_failed_swap_but_still_had_to_pay/)

### Bun Runtime Integration

- [Node.js Experimental Features in Bun](https://www.reddit.com/r/javascript/comments/1adwwht/an_example_of_how_to_use_nodes_experimental/)
- [Bun Issue Tracking](https://github.com/oven-sh/bun/issues/7384)
- [Bun Node.js API Compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [Bun Executable Bundling](https://bun.sh/docs/bundler/executables)
- [Bun vs Node.js Optimization Comparison](https://www.reddit.com/r/node/comments/1g1muz1/so_what_optimizations_does_bun_have_that_node/)
