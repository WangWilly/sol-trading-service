import { Messages } from './types';

export const englishMessages: Messages = {
  // General
  initializing: '🚀 Initializing Copy Trading Service...',
  serviceInitialized: '✅ Service initialized successfully!',
  error: '❌ Error',
  backToMainMenu: '🔙 Back to main menu...',
  exit: '👋 Exiting service gracefully...',
  gracefulExit: '✅ Graceful exit completed',
  
  // Main menu
  mainMenuTitle: '🤖 SOLANA COPY-TRADING SERVICE 🤖',
  whatToDo: 'What would you like to do?',
  viewServiceStatus: '📊 View service status',
  listActiveStrategies: '📋 List active strategies',
  createBuyStrategy: '🟢 Create buy strategy',
  createSellStrategy: '🔴 Create sell strategy',
  removeStrategy: '🗑️  Remove strategy',
  viewLogHistory: '📜 View log history',
  viewWalletAssets: '💰 View wallet token assets',
  exitApp: '❌ Exit',
  
  // Strategy creation
  enterWalletAddress: 'Enter wallet address to copy trades from:',
  enterStrategyName: 'Enter a name for this strategy:',
  enterSolAmount: 'Enter the amount of SOL to use for trades (in lamports):',
  enterSlippage: 'Enter slippage in basis points (e.g. 100 for 1%):',
  enterFixedSellingPercentage: 'Enter fixed selling percentage in basis points (e.g. 500 for 5%):',
  strategyCreatedSuccessfully: 'strategy created successfully!',
  
  // Validation messages
  validSolanaAddress: 'Please enter a valid Solana wallet address',
  strategyNameNotEmpty: 'Strategy name cannot be empty',
  validNumberGreaterThanZero: 'Please enter a valid number greater than 0',
  validNumberBetween1And10000: 'Please enter a valid number between 1 and 10000',
  
  // Status display
  serviceStatusTitle: '📊 ====== Copy-Trading Service Status ======',
  wsConnection: '🔌 WebSocket Connection',
  connected: '✅ Connected',
  disconnected: '❌ Disconnected',
  activeStrategies: '📈 Active Strategies',
  lastActivity: '⏱️ Last Activity',
  uptime: '⏰ Uptime',
  
  // Strategy list
  activeStrategiesTitle: '📋 ====== Active Copy-Trade Strategies ======',
  noActiveStrategies: '⚠️ No active strategies found',
  targetWallet: '👤 Target Wallet',
  configuration: '⚙️  Configuration',
  
  // Strategy removal
  noStrategiesToRemove: '⚠️ No active strategies to remove',
  selectStrategyToRemove: 'Select a strategy to remove:',
  strategyRemovedSuccessfully: 'removed successfully!',
  
  // Log history
  logHistoryTitle: '📋 ====== Log History ======',
  noLogsFound: '⚠️ No logs found in history',
  totalLogs: 'Total logs',
  
  // Wallet assets
  fetchingWalletAssets: '🔍 Fetching your wallet token assets...',
  walletAssetsTitle: '💰 ====== Your Wallet Token Assets ======',
  noTokenAssetsFound: '⚠️ No token assets found in your wallet',
  nativeSolBalance: '💎 Native SOL Balance',
  splTokens: '----- SPL Tokens -----',
  noSplTokensFound: 'No SPL tokens found in wallet',
  amount: '• Amount',
  decimals: '• Decimals',
  totalSplTokens: 'Total SPL tokens',
  errorFetchingAssets: '❌ Error fetching token assets',
  
  // Process signals
  sigintReceived: '⚠️ SIGINT received. Exiting gracefully...',
  sigtermReceived: '⚠️ SIGTERM received. Exiting gracefully...',
  savingStrategies: '💾 Saving strategies...',
  gracefulExitCompleted: '✅ Graceful exit completed',
  errorDuringGracefulExit: '❌ Error during graceful exit',
  
  // Errors
  privateKeyRequired: '❌ Error: Private key is required. Use -k or --private-key option.',
  errorInCli: '❌ Error in CLI',
};
