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
  listActiveStrategies: string;
  createBuyStrategy: string;
  createSellStrategy: string;
  removeStrategy: string;
  viewLogHistory: string;
  viewWalletAssets: string;
  exitApp: string;
  
  // Strategy creation
  enterWalletAddress: string;
  enterStrategyName: string;
  enterSolAmount: string;
  enterSlippage: string;
  enterFixedSellingPercentage: string;
  strategyCreatedSuccessfully: string;
  
  // Validation messages
  validSolanaAddress: string;
  strategyNameNotEmpty: string;
  validNumberGreaterThanZero: string;
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
}
