export type Language = 'en' | 'zh';

export interface Messages {
  // General
  initializing: string;
  serviceInitialized: string;
  error: string;
  backToMainMenu: string;
  exit: string;
  gracefulExit: string;
  
  // Main menu
  mainMenuTitle: string;
  whatToDo: string;
  viewServiceStatus: string;
  strategyManagement: string;
  tokenTrading: string;
  listActiveStrategies: string;
  createBuyStrategy: string;
  createSellStrategy: string;
  removeStrategy: string;
  directBuyToken: string;
  directSellToken: string;
  quickBuyToken: string;
  quickSellToken: string;
  viewSwapConfig: string;
  updateSwapConfig: string;
  viewSwapHistory: string;
  viewLogHistory: string;
  viewWalletAssets: string;
  exitApp: string;
  
  // Submenu titles
  strategyManagementTitle: string;
  tokenTradingTitle: string;
  backToMainMenuOption: string;
  
  // Strategy creation
  enterWalletAddress: string;
  enterStrategyName: string;
  enterSolAmount: string;
  enterUsdcAmount: string;
  enterUsdtAmount: string;
  enterSlippage: string;
  enterFixedSellingPercentage: string;
  selectUsedCoin: string;
  strategyCreatedSuccessfully: string;
  
  // Validation messages
  validSolanaAddress: string;
  strategyNameNotEmpty: string;
  validNumberGreaterThanZero: string;
  validNumberBetween0And10000: string;
  validNumberBetween1And10000: string;
  
  // Status display
  serviceStatusTitle: string;
  wsConnection: string;
  connected: string;
  disconnected: string;
  activeStrategies: string;
  lastActivity: string;
  uptime: string;
  
  // Strategy list
  activeStrategiesTitle: string;
  noActiveStrategies: string;
  targetWallet: string;
  configuration: string;
  
  // Strategy removal
  noStrategiesToRemove: string;
  selectStrategyToRemove: string;
  strategyRemovedSuccessfully: string;
  
  // Log history
  logHistoryTitle: string;
  noLogsFound: string;
  totalLogs: string;
  
  // Wallet assets
  fetchingWalletAssets: string;
  walletAssetsTitle: string;
  noTokenAssetsFound: string;
  nativeSolBalance: string;
  splTokens: string;
  noSplTokensFound: string;
  amount: string;
  decimals: string;
  totalSplTokens: string;
  errorFetchingAssets: string;
  
  // Language settings
  changeLanguage: string;
  selectLanguage: string;
  languageChanged: string;
  currentLanguage: string;
  english: string;
  chinese: string;
  
  // Process signals
  sigintReceived: string;
  sigtermReceived: string;
  savingStrategies: string;
  gracefulExitCompleted: string;
  errorDuringGracefulExit: string;
  
  // Errors
  privateKeyRequired: string;
  errorInCli: string;
  
  // Swap commands
  directBuyTitle: string;
  directSellTitle: string;
  quickBuyTitle: string;
  quickSellTitle: string;
  swapConfigTitle: string;
  updateSwapConfigTitle: string;
  swapHistoryTitle: string;
  
  // Swap inputs
  enterTokenMint: string;
  selectBuyCoin: string;
  selectSellCoin: string;
  selectSellAmountType: string;
  sellPercentage: string;
  sellFixedAmount: string;
  sellAllTokens: string;
  enterSellPercentage: string;
  enterSellAmount: string;
  enterSlippageOptional: string;
  enterPriorityFeeOptional: string;
  
  // Quick operations
  selectQuickAmount: string;
  selectQuickSellPercentage: string;
  noQuickAmountsConfigured: string;
  noQuickSellPercentagesConfigured: string;
  
  // Execution messages
  executingBuy: string;
  executingSell: string;
  executingQuickBuy: string;
  executingQuickSell: string;
  
  // Results
  buySuccessful: string;
  sellSuccessful: string;
  quickBuySuccessful: string;
  quickSellSuccessful: string;
  buyFailed: string;
  sellFailed: string;
  quickBuyFailed: string;
  quickSellFailed: string;
  
  signature: string;
  tokensReceived: string;
  coinsReceived: string;
  actualSlippage: string;
  
  // Configuration display
  currentSwapConfig: string;
  defaultSlippage: string;
  maxSlippage: string;
  autoSlippage: string;
  defaultPriorityFee: string;
  enableJito: string;
  jitoTipAmount: string;
  quickAmounts: string;
  quickSellPercentages: string;
  safetySettings: string;
  enableTokenSafetyCheck: string;
  minTokenBalance: string;
  maxTransactionRetries: string;
  
  // Configuration updates
  selectConfigToUpdate: string;
  updateSlippageSettings: string;
  updatePriorityFeeSettings: string;
  updateJitoSettings: string;
  updateQuickAmounts: string;
  updateQuickSellPercentages: string;
  updateSafetySettings: string;
  resetToDefaults: string;
  
  enterDefaultSlippage: string;
  enterMaxSlippage: string;
  enableAutoSlippage: string;
  enterDefaultPriorityFee: string;
  enterJitoTipAmount: string;
  
  updateQuickAmountsInstructions: string;
  selectCoinType: string;
  addAnotherQuickAmount: string;
  updateQuickSellInstructions: string;
  addAnotherPercentage: string;
  
  enterMinTokenBalance: string;
  enterMaxTransactionRetries: string;
  
  confirmResetConfig: string;
  yes: string;
  no: string;
  
  // Update confirmations
  slippageSettingsUpdated: string;
  priorityFeeSettingsUpdated: string;
  jitoSettingsUpdated: string;
  quickAmountsUpdated: string;
  quickSellPercentagesUpdated: string;
  safetySettingsUpdated: string;
  configResetComplete: string;
  operationCancelled: string;
  
  // History
  noSwapHistory: string;
  recentSwapTransactions: string;
  andMoreTransactions: string;
  
  // Validation
  validPercentage: string;
  validRetryCount: string;
  validSlippage: string;
  
  // Missing configuration section headers
  slippageSettings: string;
  priorityFeeSettings: string;
  jitoSettings: string;
  
  // Missing Jito configuration
  selectJitoTipPercentile: string;
  
  // Missing quick amount inputs
  enterQuickAmount: string;
  
  // Missing quick sell instructions
  updateQuickSellPercentagesInstructions: string;
  addAnotherSellPercentage: string;
  
  // Missing swap history
  swapHistory: string;
}
