# 🚀 Solana Copy Trading Service

[中文說明](README.zh-CN.md)

**Advanced multilingual copy trading platform with intelligent CLI interface for automated Solana token strategies**

## ✨ Key Features

### 🌐 **Multilingual Interface**
- **🔄 Live Language Switching** - Change between English/Chinese instantly without restart
- **📝 Complete Localization** - 60+ UI strings fully translated
- **⚡ Real-time Updates** - Language changes apply immediately

### 🎯 **Intelligent Copy Trading**
- **👥 Wallet Following** - Monitor and copy successful trader strategies
- **💰 Automated Buy/Sell** - Execute trades based on target wallet activities  
- **🛡️ Risk Management** - Built-in position sizing and safety controls
- **📊 Strategy Analytics** - Track performance and trading patterns

### 🖥️ **Professional CLI Experience**
- **🎨 Hierarchical Menu System** - Organized main menu with specialized submenus
- **📱 Real-time Monitoring** - Live service status and strategy tracking
- **📈 Portfolio Management** - Complete wallet and asset overview
- **📋 Transaction History** - Detailed logging with searchable records
- **💱 Direct Trading Interface** - Immediate buy/sell operations with advanced controls

### ⚙️ **Enterprise-Grade Management**
- **🔐 Secure Key Handling** - Military-grade private key protection
- **🔧 Strategy Configuration** - Flexible buy/sell rule customization
- **🚨 Service Control** - Complete start/stop/restart capabilities
- **💾 Data Persistence** - Reliable strategy and log storage

## 🏃‍♂️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env file and set your PRIVATE_KEY_BASE58

# 3. Launch CLI (English)
npm run cli

# 3a. Launch CLI (Chinese)
npm run cli:zh
```

### 🔧 Command Line Options

The CLI application supports the following command-line options:

- `-k, --private-key <string>` - Private key (base58 encoded) for the wallet (required)
- `-l, --language <string>` - Interface language (`en` for English, `zh` for Chinese, default: `en`)

### 📋 Environment Variables

Configure your `.env` file with the following variables:

- `PRIVATE_KEY_BASE58` - Your Solana wallet private key in base58 format
- `LOG_LEVEL` - Logging level (default: `info`)
- `ENABLE_PERSISTENCE` - Enable strategy persistence (default: `true`)
- `PERSISTENCE_DATA_PATH` - Path for strategy data storage (default: `data/strategies.json`)

## 🎛️ CLI Navigation

### Main Menu Options:

| Option | Feature | Description |
|--------|---------|-------------|
| 1️⃣ | **📊 Service Status** | Real-time monitoring of copy trading service health |
| 2️⃣ | **📋 Strategy Management** | Complete strategy management submenu |
| 3️⃣ | **💱 Token Trading** | Direct trading and swap operations submenu |
| 4️⃣ | **📜 View Log History** | Comprehensive trading history and analytics |
| 5️⃣ | **💼 View Wallet Assets** | Complete portfolio overview and token balances |
| 6️⃣ | **🌐 Change Language** | Switch interface language (EN ↔ 中文) |
| 7️⃣ | **❌ Exit Application** | Graceful shutdown with data persistence |

### Strategy Management Submenu:

| Option | Feature | Description |
|--------|---------|-------------|
| 1️⃣ | **📋 List Active Strategies** | View all running copy trading strategies |
| 2️⃣ | **💰 Create Buy Strategy** | Set up automated buying based on target wallets |
| 3️⃣ | **🔄 Create Sell Strategy** | Configure intelligent selling rules and triggers |
| 4️⃣ | **🗑️ Remove Strategy** | Safely delete existing trading strategies |
| 5️⃣ | **🔙 Back to Main Menu** | Return to main navigation |

### Token Trading Submenu:

| Option | Feature | Description |
|--------|---------|-------------|
| 1️⃣ | **💰 Direct Buy Token** | Execute immediate token purchase |
| 2️⃣ | **💸 Direct Sell Token** | Execute immediate token sale |
| 3️⃣ | **⚡ Quick Buy Token** | Fast token purchase with preset amounts |
| 4️⃣ | **⚡ Quick Sell Token** | Fast token sale with preset amounts |
| 5️⃣ | **⚙️ View Swap Config** | Display current swap configuration |
| 6️⃣ | **🔧 Update Swap Config** | Modify swap settings and parameters |
| 7️⃣ | **📊 View Swap History** | Review historical swap transactions |
| 8️⃣ | **🔙 Back to Main Menu** | Return to main navigation |

### 🌍 Supported Languages:
- **🇺🇸 English** - Complete feature set with detailed help
- **🇨🇳 中文** - Full Chinese localization with native UX
- **🔄 Dynamic Switching** - Change languages without restarting

## 🏗️ Technical Architecture

### Core Technologies:
- **⚡ TypeScript** - Type-safe development with modern ES features
- **🔗 Solana Web3.js** - Native blockchain integration
- **🎨 Inquirer.js** - Rich interactive CLI components
- **🌐 i18n System** - Professional internationalization framework

### Project Structure:
```
src/
├── 🖥️  cli/               # Advanced CLI application
│   ├── app.ts             # Main application controller
│   ├── commands/          # Feature command modules
│   ├── i18n/              # Multilingual support system
│   │   ├── en.ts          # English translations
│   │   ├── zh.ts          # Chinese translations
│   │   └── types.ts       # Translation interfaces
│   └── utils/             # CLI utilities and helpers
├── 🎯 helpers/            # Copy trading engine
└── 🔧 utils/              # Shared utilities
```

## 🛡️ Security & Reliability

- **🔐 Private Key Protection** - Secure key handling, never logged or exposed
- **✅ Transaction Validation** - Multi-layer verification before execution
- **🚨 Error Recovery** - Comprehensive error handling with user guidance
- **💾 Data Integrity** - Reliable strategy and transaction data storage

## 📚 Getting Started Guide

1. **Environment Setup**: Configure your `.env` file with `PRIVATE_KEY_BASE58` and other settings
2. **First Run**: Launch the CLI using `npm run cli` or `npm run cli:zh` and explore the main menu
3. **Strategy Management**: Navigate to Strategy Management to create and manage copy trading strategies
4. **Direct Trading**: Use Token Trading submenu for immediate buy/sell operations
5. **Monitoring**: Check Service Status and View Log History for real-time monitoring
6. **Language Preference**: Use Change Language option to switch between English and Chinese

---

**📄 License**: OSNC-1.0 | **🔧 Node.js**: 18+ Required | **⚡ Runtime**: Node.js/Bun Compatible

## 🔧 Development & Technical References

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

### Fee and Priority Optimization

#### Transaction Fee Management
- [Implementing Priority Fees on Solana](https://solana.com/developers/guides/advanced/how-to-use-priority-fees)
- [Helius Priority Fee API Documentation](https://docs.helius.dev/solana-apis/priority-fee-api)
- [Transaction Fee Optimization Discussion](https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/)

#### Compute Budget Optimization
- [Official Solana Transaction Fee Documentation](https://solana.com/docs/core/fees)
- [Requesting Optimal Compute Budget](https://solana.com/developers/guides/advanced/how-to-request-optimal-compute)
- [JavaScript/TypeScript Helpers for Solana](https://github.com/solana-developers/helpers)

### Additional Resources
- [QuickNode Transaction Documentation](https://www.quicknode.com/docs/solana/transactions)
- [Jito Low Latency Transaction Documentation](https://docs.jito.wtf/lowlatencytxnsend/#tip-amount)
- [Jupiter API Trading Bot Guide](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot)
- [Copy Trading Implementation Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade)
