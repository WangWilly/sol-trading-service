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
  strategyManagement: '📋 Strategy Management',
  tokenTrading: '💰 Token Trading',
  listActiveStrategies: '📋 List active strategies',
  createBuyStrategy: '🟢 Create buy strategy',
  createSellStrategy: '🔴 Create sell strategy',
  removeStrategy: '🗑️  Remove strategy',
  directBuyToken: '🟢 Direct buy token',
  directSellToken: '🔴 Direct sell token',
  quickBuyToken: '⚡ Quick buy token',
  quickSellToken: '⚡ Quick sell token',
  viewSwapConfig: '⚙️ View swap config',
  updateSwapConfig: '🔧 Update swap config',
  viewSwapHistory: '📋 View swap history',
  viewLogHistory: '📜 View log history',
  viewWalletAssets: '💰 View wallet token assets',
  exitApp: '❌ Exit',
  
  // Submenu titles
  strategyManagementTitle: '📋 Strategy Management - What would you like to do?',
  tokenTradingTitle: '💰 Token Trading - What would you like to do?',
  backToMainMenuOption: '← Back to Main Menu',
  
  // Strategy creation
  enterWalletAddress: 'Enter wallet address to copy trades from:',
  enterStrategyName: 'Enter a name for this strategy:',
  enterSolAmount: 'Enter the amount of SOL to use for trades (in lamports):',
  enterUsdcAmount: 'Enter the amount of USDC to use for trades (in 0.000001 USDC):',
  enterUsdtAmount: 'Enter the amount of USDT to use for trades (in 0.000001 USDT):',
  enterSlippage: 'Enter slippage in basis points (e.g. 100 for 1%):',
  enterFixedSellingPercentage: '(optional) Enter fixed selling percentage in basis points (e.g. 500 for 5%):',
  selectUsedCoin: 'Select the coin to use for buy:',
  strategyCreatedSuccessfully: 'strategy created successfully!',
  
  // Validation messages
  validSolanaAddress: 'Please enter a valid Solana wallet address',
  strategyNameNotEmpty: 'Strategy name cannot be empty',
  validNumberGreaterThanZero: 'Please enter a valid number greater than 0',
  validNumberBetween0And10000: 'Please enter a valid number between 0 and 10000',
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
  
  // Language settings
  changeLanguage: '🌐 Change language',
  selectLanguage: 'Select your preferred language:',
  languageChanged: 'Language changed successfully! Please restart the CLI to see full effect.',
  currentLanguage: 'Current language',
  english: 'English',
  chinese: '中文 (Chinese)',
  
  // Process signals
  sigintReceived: '⚠️ SIGINT received. Exiting gracefully...',
  sigtermReceived: '⚠️ SIGTERM received. Exiting gracefully...',
  savingStrategies: '💾 Saving strategies...',
  gracefulExitCompleted: '✅ Graceful exit completed',
  errorDuringGracefulExit: '❌ Error during graceful exit',
  
  // Swap commands
  directBuyTitle: '🟢 ===== DIRECT BUY TOKEN =====',
  directSellTitle: '🔴 ===== DIRECT SELL TOKEN =====',
  quickBuyTitle: '⚡ ===== QUICK BUY TOKEN =====',
  quickSellTitle: '⚡ ===== QUICK SELL TOKEN =====',
  swapConfigTitle: '⚙️ ===== SWAP CONFIGURATION =====',
  updateSwapConfigTitle: '🔧 ===== UPDATE SWAP CONFIG =====',
  swapHistoryTitle: '📋 ===== SWAP TRANSACTION HISTORY =====',
  
  // Swap inputs
  enterTokenMint: 'Enter the token mint address to trade:',
  selectBuyCoin: 'Select the coin to use for buying:',
  selectSellCoin: 'Select the coin to receive from selling:',
  selectSellAmountType: 'How would you like to specify the sell amount?',
  sellPercentage: '📊 Sell by percentage of holdings',
  sellFixedAmount: '🔢 Sell fixed amount of tokens',
  sellAllTokens: '💯 Sell all tokens',
  enterSellPercentage: 'Enter the percentage to sell (1-100):',
  enterSellAmount: 'Enter the amount of tokens to sell:',
  enterSlippageOptional: 'Enter slippage in basis points (optional, press Enter to use default):',
  enterPriorityFeeOptional: 'Enter priority fee in SOL (optional, press Enter to use default):',
  
  // Quick operations
  selectQuickAmount: 'Select a quick buy amount:',
  selectQuickSellPercentage: 'Select a quick sell percentage:',
  noQuickAmountsConfigured: 'No quick amounts configured. Please update your configuration first.',
  noQuickSellPercentagesConfigured: 'No quick sell percentages configured. Please update your configuration first.',
  
  // Execution messages
  executingBuy: 'Executing buy order',
  executingSell: 'Executing sell order',
  executingQuickBuy: 'Executing quick buy',
  executingQuickSell: 'Executing quick sell',
  
  // Results
  buySuccessful: 'Buy order completed successfully!',
  sellSuccessful: 'Sell order completed successfully!',
  quickBuySuccessful: 'Quick buy completed successfully!',
  quickSellSuccessful: 'Quick sell completed successfully!',
  buyFailed: 'Buy order failed',
  sellFailed: 'Sell order failed',
  quickBuyFailed: 'Quick buy failed',
  quickSellFailed: 'Quick sell failed',
  
  signature: 'Transaction Signature',
  tokensReceived: 'Tokens Received',
  coinsReceived: 'Coins Received',
  actualSlippage: 'Actual Slippage',
  
  // Configuration display
  currentSwapConfig: 'Current Swap Configuration',
  defaultSlippage: 'Default Slippage',
  maxSlippage: 'Max Slippage',
  autoSlippage: 'Auto Slippage',
  defaultPriorityFee: 'Default Priority Fee',
  enableJito: 'Enable Jito',
  jitoTipAmount: 'Jito Tip Amount',
  quickAmounts: 'Quick Buy Amounts',
  quickSellPercentages: 'Quick Sell Percentages',
  safetySettings: 'Safety Settings',
  enableTokenSafetyCheck: 'Enable Token Safety Check',
  minTokenBalance: 'Minimum Token Balance',
  maxTransactionRetries: 'Max Transaction Retries',
  
  // Configuration updates
  selectConfigToUpdate: 'Select configuration to update:',
  updateSlippageSettings: '📊 Update slippage settings',
  updatePriorityFeeSettings: '💰 Update priority fee settings',
  updateJitoSettings: '⚡ Update Jito settings',
  updateQuickAmounts: '🔢 Update quick buy amounts',
  updateQuickSellPercentages: '📈 Update quick sell percentages',
  updateSafetySettings: '🛡️ Update safety settings',
  resetToDefaults: '🔄 Reset to defaults',
  
  enterDefaultSlippage: 'Enter default slippage in basis points (e.g. 100 for 1%):',
  enterMaxSlippage: 'Enter maximum slippage in basis points (e.g. 1000 for 10%):',
  enableAutoSlippage: 'Enable automatic slippage adjustment?',
  enterDefaultPriorityFee: 'Enter default priority fee in SOL (optional, press Enter for none):',
  enterJitoTipAmount: 'Enter Jito tip amount in lamports:',
  
  updateQuickAmountsInstructions: 'Configure quick buy amounts (you can add multiple):',
  selectCoinType: 'Select coin type:',
  addAnotherQuickAmount: 'Add another quick amount?',
  updateQuickSellInstructions: 'Configure quick sell percentages (you can add multiple):',
  addAnotherPercentage: 'Add another percentage?',
  
  enterMinTokenBalance: 'Enter minimum token balance required:',
  enterMaxTransactionRetries: 'Enter maximum transaction retries (0-10):',
  
  confirmResetConfig: 'Are you sure you want to reset all configuration to defaults?',
  yes: 'Yes',
  no: 'No',
  
  // Update confirmations
  slippageSettingsUpdated: 'Slippage settings updated successfully!',
  priorityFeeSettingsUpdated: 'Priority fee settings updated successfully!',
  jitoSettingsUpdated: 'Jito settings updated successfully!',
  quickAmountsUpdated: 'Quick amounts updated successfully!',
  quickSellPercentagesUpdated: 'Quick sell percentages updated successfully!',
  safetySettingsUpdated: 'Safety settings updated successfully!',
  configResetComplete: 'Configuration reset to defaults successfully!',
  operationCancelled: 'Operation cancelled.',
  
  // History
  noSwapHistory: 'No swap transactions found.',
  recentSwapTransactions: 'Recent Swap Transactions',
  andMoreTransactions: 'and {0} more transactions...',
  
  // Validation
  validPercentage: 'Please enter a valid percentage between 1 and 100',
  validRetryCount: 'Please enter a valid number between 0 and 10',
  validSlippage: 'Please enter a valid slippage between 1 and 10000 basis points',
  
  // Missing configuration section headers
  slippageSettings: 'Slippage Settings',
  priorityFeeSettings: 'Priority Fee Settings',
  jitoSettings: 'Jito Settings',
  
  // Missing Jito configuration
  selectJitoTipPercentile: 'Select Jito tip percentile:',
  
  // Missing quick amount inputs
  enterQuickAmount: 'Enter quick buy amount (SOL):',
  
  // Missing quick sell instructions
  updateQuickSellPercentagesInstructions: 'Configure quick sell percentages. Add one or more percentages for quick selling.',
  addAnotherSellPercentage: 'Add another sell percentage?',
  
  // Missing swap history
  swapHistory: 'Swap History',
  
  // Errors
  privateKeyRequired: '❌ Error: Private key is required. Use -k or --private-key option.',
  errorInCli: '❌ Error in CLI',
};
