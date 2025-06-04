import { Messages } from './types';

export const chineseMessages: Messages = {
  // General
  initializing: '🚀 正在初始化跟单交易服务...',
  serviceInitialized: '✅ 服务初始化成功！',
  error: '❌ 错误',
  backToMainMenu: '🔙 返回主菜单...',
  exit: '👋 正在优雅退出服务...',
  gracefulExit: '✅ 优雅退出完成',
  
  // Main menu
  mainMenuTitle: '🤖 SOLANA 跟单交易服务 🤖',
  whatToDo: '您想要做什么？',
  viewServiceStatus: '📊 查看服务状态',
  listActiveStrategies: '📋 列出活跃策略',
  createBuyStrategy: '🟢 创建买入策略',
  createSellStrategy: '🔴 创建卖出策略',
  removeStrategy: '🗑️  删除策略',
  viewLogHistory: '📜 查看日志历史',
  viewWalletAssets: '💰 查看钱包代币资产',
  exitApp: '❌ 退出',
  
  // Strategy creation
  enterWalletAddress: '输入要跟单的钱包地址：',
  enterStrategyName: '为此策略输入名称：',
  enterSolAmount: '输入用于交易的SOL数量（以lamports为单位）：',
  enterUsdcAmount: '输入用于交易的USDC数量（以0.000001 USDC为单位）：',
  enterUsdtAmount: '输入用于交易的USDT数量（以0.000001 USDT为单位）：',
  enterSlippage: '输入滑点（基点，例如100表示1%）：',
  enterFixedSellingPercentage: '（可选）输入固定卖出百分比（基点，例如500表示5%）：',
  selectUsedCoin: '选择用于買入的代币：',
  strategyCreatedSuccessfully: '策略创建成功！',
  
  // Validation messages
  validSolanaAddress: '请输入有效的Solana钱包地址',
  strategyNameNotEmpty: '策略名称不能为空',
  validNumberGreaterThanZero: '请输入大于0的有效数字',
  validNumberBetween0And10000: '请输入0到10000之间的有效数字',
  validNumberBetween1And10000: '请输入1到10000之间的有效数字',
  
  // Status display
  serviceStatusTitle: '📊 ====== 跟单交易服务状态 ======',
  wsConnection: '🔌 WebSocket连接',
  connected: '✅ 已连接',
  disconnected: '❌ 已断开连接',
  activeStrategies: '📈 活跃策略',
  lastActivity: '⏱️ 最后活动',
  uptime: '⏰ 运行时间',
  
  // Strategy list
  activeStrategiesTitle: '📋 ====== 活跃跟单策略 ======',
  noActiveStrategies: '⚠️ 未找到活跃策略',
  targetWallet: '👤 目标钱包',
  configuration: '⚙️  配置',
  
  // Strategy removal
  noStrategiesToRemove: '⚠️ 没有活跃策略可删除',
  selectStrategyToRemove: '选择要删除的策略：',
  strategyRemovedSuccessfully: '删除成功！',
  
  // Log history
  logHistoryTitle: '📋 ====== 日志历史 ======',
  noLogsFound: '⚠️ 历史中未找到日志',
  totalLogs: '总日志数',
  
  // Wallet assets
  fetchingWalletAssets: '🔍 正在获取您的钱包代币资产...',
  walletAssetsTitle: '💰 ====== 您的钱包代币资产 ======',
  noTokenAssetsFound: '⚠️ 钱包中未找到代币资产',
  nativeSolBalance: '💎 原生SOL余额',
  splTokens: '----- SPL代币 -----',
  noSplTokensFound: '钱包中未找到SPL代币',
  amount: '• 数量',
  decimals: '• 小数位',
  totalSplTokens: 'SPL代币总数',
  errorFetchingAssets: '❌ 获取代币资产时出错',
  
  // Language settings
  changeLanguage: '🌐 更改语言',
  selectLanguage: '请选择您的首选语言：',
  languageChanged: '语言更改成功！请重新启动CLI以查看完整效果。',
  currentLanguage: '当前语言',
  english: 'English (英语)',
  chinese: '中文',
  
  // Process signals
  sigintReceived: '⚠️ 收到SIGINT信号。正在优雅退出...',
  sigtermReceived: '⚠️ 收到SIGTERM信号。正在优雅退出...',
  savingStrategies: '💾 正在保存策略...',
  gracefulExitCompleted: '✅ 优雅退出完成',
  errorDuringGracefulExit: '❌ 优雅退出期间出错',
  
  // Errors
  privateKeyRequired: '❌ 错误：需要私钥。请使用-k或--private-key选项。',
  errorInCli: '❌ CLI中出错',
};
