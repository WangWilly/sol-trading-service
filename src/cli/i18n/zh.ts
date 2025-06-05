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
  mainMenuTitle: '🤖 SOLANA 复制交易服务 🤖',
  whatToDo: '您想做什么？',
  viewServiceStatus: '📊 查看服务状态',
  strategyManagement: '📋 策略管理',
  tokenTrading: '💰 代币交易',
  listActiveStrategies: '📋 列出活跃策略',
  createBuyStrategy: '🟢 创建买入策略',
  createSellStrategy: '🔴 创建卖出策略',
  removeStrategy: '🗑️  移除策略',
  directBuyToken: '🟢 直接购买代币',
  directSellToken: '🔴 直接出售代币',
  quickBuyToken: '⚡ 快速购买代币',
  quickSellToken: '⚡ 快速出售代币',
  viewSwapConfig: '⚙️ 查看交换配置',
  updateSwapConfig: '🔧 更新交换配置',
  viewSwapHistory: '📋 查看交换历史',
  viewLogHistory: '📜 查看日志历史',
  viewWalletAssets: '💰 查看钱包代币资产',
  exitApp: '❌ 退出',
  
  // Submenu titles
  strategyManagementTitle: '📋 策略管理 - 您想做什么？',
  tokenTradingTitle: '💰 代币交易 - 您想做什么？',
  backToMainMenuOption: '← 返回主菜单',
  
  // Strategy creation
  enterWalletAddress: '输入要跟单的钱包地址：',
  enterStrategyName: '为此策略输入名称：',
  enterSolAmount: '输入用于交易的SOL数量（以lamports为单位）：',
  enterUsdcAmount: '输入用于交易的USDC数量（以0.000001 USDC为单位）：',
  enterUsdtAmount: '输入用于交易的USDT数量（以0.000001 USDT为单位）：',
  enterSlippage: '输入滑点（基点，例如100表示1%）：',
  enterFixedSellingPercentage: '（可选）输入固定卖出百分比（基点，例如500表示5%）：',
  selectUsedCoin: '选择用于购买的币种：',
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
  disconnected: '❌ 已断开',
  activeStrategies: '📈 活跃策略',
  lastActivity: '⏱️ 最后活动',
  uptime: '⏰ 运行时间',
  
  // Strategy list
  activeStrategiesTitle: '📋 ===== 活跃策略 =====',
  noActiveStrategies: 'ℹ️ 当前没有活跃策略',
  targetWallet: '目标钱包',
  configuration: '配置',
  
  // Strategy removal
  noStrategiesToRemove: 'ℹ️ 没有可移除的策略',
  selectStrategyToRemove: '选择要移除的策略：',
  strategyRemovedSuccessfully: '策略移除成功！',
  
  // Log history
  logHistoryTitle: '📜 ===== 日志历史 =====',
  noLogsFound: 'ℹ️ 未找到日志',
  totalLogs: '总日志数',
  
  // Wallet assets
  fetchingWalletAssets: '📊 正在获取钱包资产信息...',
  walletAssetsTitle: '💰 ===== 钱包代币资产 =====',
  noTokenAssetsFound: 'ℹ️ 未找到代币资产',
  nativeSolBalance: 'SOL余额',
  splTokens: 'SPL代币',
  noSplTokensFound: 'ℹ️ 未找到SPL代币',
  amount: '数量',
  decimals: '小数位',
  totalSplTokens: '总SPL代币数',
  errorFetchingAssets: '❌ 获取资产时出错',
  
  // Language settings
  changeLanguage: '更换语言',
  selectLanguage: '选择语言：',
  languageChanged: '语言更改成功！',
  currentLanguage: '当前语言',
  english: 'English',
  chinese: '中文',
  
  // Process signals
  sigintReceived: '⚠️ 收到SIGINT信号。正在优雅退出...',
  sigtermReceived: '⚠️ 收到SIGTERM信号。正在优雅退出...',
  savingStrategies: '💾 正在保存策略...',
  gracefulExitCompleted: '✅ 优雅退出完成',
  errorDuringGracefulExit: '❌ 优雅退出期间出错',
  
  // Swap commands
  directBuyTitle: '🟢 ===== 直接购买代币 =====',
  directSellTitle: '🔴 ===== 直接出售代币 =====',
  quickBuyTitle: '⚡ ===== 快速购买代币 =====',
  quickSellTitle: '⚡ ===== 快速出售代币 =====',
  swapConfigTitle: '⚙️ ===== 交换配置 =====',
  updateSwapConfigTitle: '🔧 ===== 更新交换配置 =====',
  swapHistoryTitle: '📋 ===== 交换交易历史 =====',
  
  // Swap display
  tokenInfo: '代币信息',
  noBalance: '没有足够的余额',
  noBalanceForBuy: '没有足够的余额进行购买',
  noBalanceForQuickBuy: '没有足够的余额进行快速购买',
  availableTokenMints: '可用的代币地址',
  noAvailableTokens: '没有可用的代币',

  // Swap inputs
  enterTokenMint: '输入要交易的代币地址：',
  selectBuyCoin: '选择用于购买的币种：',
  selectSellCoin: '选择出售后接收的币种：',
  selectSellAmountType: '您想如何指定出售金额？',
  sellPercentage: '📊 按持有量百分比出售',
  sellFixedAmount: '🔢 出售固定数量的代币',
  sellAllTokens: '💯 出售所有代币',
  enterSellPercentage: '输入要出售的百分比（1-100）：',
  enterSellAmount: '输入要出售的代币数量：',
  enterSlippageOptional: '输入滑点（基点，可选，回车使用默认值）：',
  enterPriorityFeeOptional: '输入优先费用（SOL，可选，回车使用默认值）：',
  selectTokenToSell: '选择要出售的代币：',
  
  // Quick operations
  selectQuickAmount: '选择快速购买金额：',
  selectQuickSellPercentage: '选择快速出售百分比：',
  noQuickAmountsConfigured: '未配置快速金额。请先更新您的配置。',
  noQuickSellPercentagesConfigured: '未配置快速出售百分比。请先更新您的配置。',
  
  // Execution messages
  executingBuy: '正在执行购买订单',
  executingSell: '正在执行出售订单',
  executingQuickBuy: '正在执行快速购买',
  executingQuickSell: '正在执行快速出售',
  
  // Results
  buySuccessful: '购买订单成功完成！',
  sellSuccessful: '出售订单成功完成！',
  quickBuySuccessful: '快速购买成功完成！',
  quickSellSuccessful: '快速出售成功完成！',
  buyFailed: '购买订单失败',
  sellFailed: '出售订单失败',
  quickBuyFailed: '快速购买失败',
  quickSellFailed: '快速出售失败',
  
  signature: '交易签名',
  tokensReceived: '收到的代币',
  coinsReceived: '收到的币',
  actualSlippage: '实际滑点',
  
  // Configuration display
  currentSwapConfig: '当前交换配置',
  defaultSlippage: '默认滑点',
  maxSlippage: '最大滑点',
  autoSlippage: '自动滑点',
  defaultPriorityFee: '默认优先费',
  enableJito: '启用Jito',
  jitoTipAmount: 'Jito小费金额',
  quickAmounts: '快速购买金额',
  quickSellPercentages: '快速出售百分比',
  safetySettings: '安全设置',
  enableTokenSafetyCheck: '启用代币安全检查',
  minTokenBalance: '最小代币余额',
  maxTransactionRetries: '最大交易重试次数',
  
  // Configuration updates
  selectConfigToUpdate: '选择要更新的配置：',
  updateSlippageSettings: '📊 更新滑点设置',
  updatePriorityFeeSettings: '💰 更新优先费设置',
  updateJitoSettings: '⚡ 更新Jito设置',
  updateQuickAmounts: '🔢 更新快速购买金额',
  updateQuickSellPercentages: '📈 更新快速出售百分比',
  updateSafetySettings: '🛡️ 更新安全设置',
  resetToDefaults: '🔄 重置为默认值',
  
  enterDefaultSlippage: '输入默认滑点（基点，例如100表示1%）：',
  enterMaxSlippage: '输入最大滑点（基点，例如1000表示10%）：',
  enableAutoSlippage: '启用自动滑点调整？',
  enterDefaultPriorityFee: '输入默认优先费（SOL，可选，回车跳过）：',
  enterJitoTipAmount: '输入Jito小费金额（lamports）：',
  
  updateQuickAmountsInstructions: '配置快速购买金额（您可以添加多个）：',
  selectCoinType: '选择币种类型：',
  addAnotherQuickAmount: '添加另一个快速金额？',
  updateQuickSellInstructions: '配置快速出售百分比（您可以添加多个）：',
  addAnotherPercentage: '添加另一个百分比？',
  
  enterMinTokenBalance: '输入所需的最小代币余额：',
  enterMaxTransactionRetries: '输入最大交易重试次数（0-10）：',
  
  confirmResetConfig: '您确定要将所有配置重置为默认值吗？',
  yes: '是',
  no: '否',
  
  // Update confirmations
  slippageSettingsUpdated: '滑点设置更新成功！',
  priorityFeeSettingsUpdated: '优先费设置更新成功！',
  jitoSettingsUpdated: 'Jito设置更新成功！',
  quickAmountsUpdated: '快速金额更新成功！',
  quickSellPercentagesUpdated: '快速出售百分比更新成功！',
  safetySettingsUpdated: '安全设置更新成功！',
  configResetComplete: '配置成功重置为默认值！',
  operationCancelled: '操作已取消。',
  
  // History
  noSwapHistory: '未找到交换交易。',
  recentSwapTransactions: '最近的交换交易',
  andMoreTransactions: '以及其他{0}笔交易...',
  
  // Validation
  validPercentage: '请输入1到100之间的有效百分比',
  validRetryCount: '请输入0到10之间的有效数字',
  validSlippage: '请输入1到10000基点之间的有效滑点',
  
  // Missing configuration section headers
  slippageSettings: '滑点设置',
  priorityFeeSettings: '优先费用设置',
  jitoSettings: 'Jito设置',
  
  // Missing Jito configuration
  selectJitoTipPercentile: '选择Jito小费百分位:',
  
  // Missing quick amount inputs
  enterQuickAmount: '输入快速购买金额（SOL）:',
  
  // Missing quick sell instructions
  updateQuickSellPercentagesInstructions: '配置快速出售百分比。添加一个或多个用于快速出售的百分比。',
  addAnotherSellPercentage: '添加另一个出售百分比？',
  
  // Missing swap history
  swapHistory: '交换历史',
  
  // Errors
  privateKeyRequired: '❌ 错误：需要私钥。请使用-k或--private-key选项。',
  errorInCli: '❌ CLI中出错',
};
