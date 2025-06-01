# Solana 交易机器人

[English Version](./README.md) | [📦 最新版本下载](https://github.com/WangWilly/solana-trading-bot/releases)

## 概述

本仓库包含了 Solana 区块链上跟单交易的核心服务。它旨在促进跟单交易策略的创建和管理，允许用户自动复制目标钱包的交易。

![](./docs/demo.gif)

## 开发

### 🔧 前置条件：Bun 安装

按照以下说明安装 Bun JavaScript 运行时（[官方文档](https://bun.sh/docs/installation)）：

```bash
# 适用于 macOS 操作系统
brew install oven-sh/bun/bun

# 通过检查版本来验证安装
bun --version

# 配置 shell 环境
# 首先，确定您当前的 shell 环境：
echo $SHELL

# 将以下配置添加到您的 shell 配置文件中（例如，~/.zshrc）：
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### 🚀 运行服务

#### 步骤 1：配置环境

在项目根目录创建一个 `.env` 文件，内容如下：

```env
PRIVATE_KEY_BASE58=<private_key_base58>  # 您的私钥（Base58 格式）
```

#### 步骤 2：启动服务

在主函数中使用 `solRpcWsSubscribeManager` 来订阅目标账户：

```bash
./scripts/run-sol-trade-dev.sh

# 或者

# 在环境变量中设置 NOT_USE_CLI 为 false
bun run ./src/cli.ts -k <private_key_base58>
```

### 📦 生产环境构建

为生产环境部署构建项目：

```bash
./scripts/build-sol-trade.sh
```

### 🖥️ 使用 CLI 界面

该服务配备了用于管理跟单交易策略的交互式 CLI。

#### 步骤 1：构建 CLI

确保您已如上所述为生产环境构建了项目。
CLI 位于 `dist` 目录中。

#### 步骤 2：运行 CLI

CLI 使用 Bun 构建，位于 `dist` 目录中。要运行 CLI，您需要安装 Bun 运行时。

您可以直接从 `dist` 目录运行 CLI：

```bash
./dist/sol-trade -k <private_key_base58>
```

#### 可用功能

CLI 提供以下功能：

1. **查看服务状态** - 检查 WebSocket 连接状态和活跃策略
2. **列出活跃策略** - 查看所有已配置的跟单交易策略
3. **创建买入策略** - 设置新策略以复制目标钱包的买入交易
4. **创建卖出策略** - 设置新策略以复制目标钱包的卖出交易
5. **移除策略** - 删除现有策略
6. **退出** - 优雅地关闭服务

#### 示例工作流程

**创建买入策略：**

1. 从主菜单选择"创建买入策略"
2. 输入要复制交易的目标钱包地址
3. 为您的策略提供名称
4. 输入用于交易的 SOL 数量（以 lamports 为单位）
5. 设置您所需的滑点容忍度（基点）（例如，100 = 1%）

**创建卖出策略：**

1. 从主菜单选择"创建卖出策略"
2. 输入要复制交易的目标钱包地址
3. 为您的策略提供名称
4. 设置固定的卖出百分比（基点）（例如，500 = 5%）
5. 设置您所需的滑点容忍度（基点）

**管理策略：**

- 使用"列出活跃策略"查看所有当前策略
- 使用"移除策略"删除不再需要的策略
- 使用"查看服务状态"检查连接和活动状态

---

## 参考资料

### Jupiter Exchange 集成

该服务利用 [Jupiter](https://jup.ag/) 在 Solana 区块链上进行交易处理。

#### 文档

- [通用文档](https://station.jup.ag/docs/)
- [API 概述](https://station.jup.ag/docs/swap-api/get-quote)
- [综合 API 文档](https://station.jup.ag/docs/api/introduction)
- [支持的去中心化交易所](https://api.jup.ag/swap/v1/program-id-to-label)

#### API 资源

- [费用结构信息](https://station.jup.ag/guides/general/faq#does-jupiter-swap-charge-any-fees)
- [平台费用说明](https://www.bbx.com/news-detail/1898146)
- [遗留 API 文档](https://station.jup.ag/docs/old/apis/landing-transactions)
- [交换指令文档](https://station.jup.ag/docs/api/swap-instructions)
- [Jupiter API 带优先费用的交换交易](https://solana.stackexchange.com/questions/19136/how-to-get-a-swap-transaction-from-jupiter-api-which-uses-a-priority-fee-and-jit)
- [理解 Jupiter 交换的交易费用](https://www.reddit.com/r/solana/comments/1bjh2g5/understanding_the_transaction_fees_on_a_jupiter/)

### 费用和优先级优化

#### 交易费用管理

- [在 Solana 上实施优先费用](https://solana.com/developers/guides/advanced/how-to-use-priority-fees)
- [Helius 优先费用 API 文档](https://docs.helius.dev/solana-apis/priority-fee-api)
- [交易费用优化讨论](https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/)
- [交易速度优化](https://solana.stackexchange.com/questions/11860/how-to-optimize-transaction-speed)
- [Solana 费用和销毁跟踪器](https://solanacompass.com/statistics/fees)

#### 计算预算优化

- [官方 Solana 交易费用文档](https://solana.com/docs/core/fees)
- [请求最优计算预算](https://solana.com/developers/guides/advanced/how-to-request-optimal-compute)
- [Solana 的 JavaScript/TypeScript 助手](https://github.com/solana-developers/helpers)
- [优化智能合约的计算使用](https://solana.com/developers/guides/advanced/how-to-optimize-compute)

#### Jito 提示和高级配置

- [QuickNode 交易文档](https://www.quicknode.com/docs/solana/transactions)
- [Jito 低延迟交易文档](https://docs.jito.wtf/lowlatencytxnsend/#tip-amount)

### 其他资源

- [Axen Sniper Bot 文档](https://documentation.axenai.com/axen-sniper-bot/settings-command)
- [为 Jupiter 交换添加自定义费用](https://solana.stackexchange.com/questions/13356/how-to-add-my-own-fee-to-jupiter-swap)
- [Jupiter API 交易机器人指南](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot)
- [Solana 交易机器人讨论](https://www.reddit.com/r/solana/comments/1ghytve/safetrustworthy_sol_trading_bots/)
- [自动化 Memecoin 交易机器人](https://www.reddit.com/r/solana/comments/1ikbulw/automated_memecoin_trading_bot/)
- [交易机器人使用讨论](https://www.reddit.com/r/solana/comments/1idniwf/anyone_here_using_trading_bots/)
- [构建 Solana 交易机器人指南](https://www.solulab.com/how-to-build-solana-trading-bots/)
- [ARB Protocol Jupiter Bot 实现](https://github.com/ARBProtocol/solana-jupiter-bot)
- [跟单交易实现指南](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade)
- [失败的交换交易分析](https://www.reddit.com/r/solana/comments/1i5czkh/phantom_wallet_failed_swap_but_still_had_to_pay/)
- [如何获取 Solana 钱包持有的所有代币](https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-get-all-tokens-held-by-a-wallet-in-solana)

### Bun 运行时集成

- [Bun 中的 Node.js 实验性功能](https://www.reddit.com/r/javascript/comments/1adwwht/an_example_of_how_to_use_nodes_experimental/)
- [Bun 问题跟踪](https://github.com/oven-sh/bun/issues/7384)
- [Bun Node.js API 兼容性](https://bun.sh/docs/runtime/nodejs-apis)
- [Bun 可执行文件打包](https://bun.sh/docs/bundler/executables)
- [Bun vs Node.js 优化比较](https://www.reddit.com/r/node/comments/1g1muz1/so_what_optimizations_does_bun_have_that_node/)
