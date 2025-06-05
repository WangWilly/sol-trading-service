# 🚀 Solana 跟单交易服务

[English document](README.md)

**先进的多语言跟单交易平台，具备智能 CLI 界面，专为 Solana 代币自动化策略设计**

## ✨ 核心功能

### 🌐 **多语言界面**
- **🔄 实时语言切换** - 中英文之间即时切换，无需重启
- **📝 完整本地化** - 60+ 界面字符串完全翻译
- **⚡ 实时更新** - 语言更改立即生效

### 🎯 **智能跟单交易**
- **👥 钱包跟踪** - 监控并复制成功交易者策略
- **💰 自动买卖** - 根据目标钱包活动执行交易
- **🛡️ 风险管理** - 内置仓位控制和安全保护
- **📊 策略分析** - 跟踪性能和交易模式

### 🖥️ **专业 CLI 体验**
- **🎨 分层菜单系统** - 有组织的主菜单和专业化子菜单
- **📱 实时监控** - 实时服务状态和策略跟踪
- **📈 投资组合管理** - 完整的钱包和资产概览
- **📋 交易历史** - 详细日志记录和可搜索记录
- **💱 直覺交易界面** - 具有高级控制的即时买卖操作

### ⚙️ **企业级管理**
- **🔐 安全密钥处理** - 军用级私钥保护
- **🔧 策略配置** - 灵活的买卖规则自定义
- **🚨 服务控制** - 完整的启动/停止/重启功能
- **💾 数据持久化** - 可靠的策略和日志存储

## 🏃‍♂️ 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env 文件，设置您的 PRIVATE_KEY_BASE58

# 3. 启动 CLI（中文）
npm run cli:zh

# 3a. 启动 CLI（英文）
npm run cli
```

### 🔧 命令行选项

CLI 应用程序支持以下命令行选项：

- `-k, --private-key <string>` - 钱包的私钥（base58 编码格式，必需）
- `-l, --language <string>` - 界面语言（`en` 表示英文，`zh` 表示中文，默认：`en`）

### 📋 环境变量

在您的 `.env` 文件中配置以下变量：

- `PRIVATE_KEY_BASE58` - base58 格式的 Solana 钱包私钥
- `LOG_LEVEL` - 日志级别（默认：`info`）
- `ENABLE_PERSISTENCE` - 启用策略持久化（默认：`true`）
- `PERSISTENCE_DATA_PATH` - 策略数据存储路径（默认：`data/strategies.json`）

## 🎛️ CLI 导航

### 主菜单选项：

| 选项 | 功能 | 描述 |
|------|------|------|
| 1️⃣ | **📊 查看服务状态** | 实时监控跟单交易服务健康状况 |
| 2️⃣ | **📋 策略管理** | 完整的策略管理子菜单 |
| 3️⃣ | **💱 代币交易** | 直接交易和兑换操作子菜单 |
| 4️⃣ | **📜 查看日志历史** | 全面的交易历史和分析 |
| 5️⃣ | **💼 查看钱包资产** | 完整的投资组合概览和代币余额 |
| 6️⃣ | **🌐 更改语言** | 切换界面语言（中文 ↔ EN） |
| 7️⃣ | **❌ 退出应用** | 优雅关闭并保存数据 |

### 策略管理子菜单：

| 选项 | 功能 | 描述 |
|------|------|------|
| 1️⃣ | **📋 列出活跃策略** | 查看所有运行中的跟单交易策略 |
| 2️⃣ | **💰 创建买入策略** | 基于目标钱包设置自动买入 |
| 3️⃣ | **🔄 创建卖出策略** | 配置智能卖出规则和触发器 |
| 4️⃣ | **🗑️ 移除策略** | 安全删除现有交易策略 |
| 5️⃣ | **🔙 返回主菜单** | 返回主导航界面 |

### 代币交易子菜单：

| 选项 | 功能 | 描述 |
|------|------|------|
| 1️⃣ | **💰 直接买入代币** | 执行即时代币购买 |
| 2️⃣ | **💸 直接卖出代币** | 执行即时代币出售 |
| 3️⃣ | **⚡ 快速买入代币** | 使用预设金额快速购买代币 |
| 4️⃣ | **⚡ 快速卖出代币** | 使用预设金额快速出售代币 |
| 5️⃣ | **⚙️ 查看交换配置** | 显示当前兑换配置 |
| 6️⃣ | **🔧 更新交换配置** | 修改兑换设置和参数 |
| 7️⃣ | **📊 查看交换历史** | 查看历史兑换交易记录 |
| 8️⃣ | **🔙 返回主菜单** | 返回主导航界面 |

### 🌍 支持的语言：
- **🇨🇳 中文** - 完整功能集和详细帮助
- **🇺🇸 English** - 全英文本地化和原生用户体验
- **🔄 动态切换** - 无需重启即可更改语言

## 🏗️ 技术架构

### 核心技术：
- **⚡ TypeScript** - 类型安全开发和现代 ES 特性
- **🔗 Solana Web3.js** - 原生区块链集成
- **🎨 Inquirer.js** - 丰富的交互式 CLI 组件
- **🌐 i18n 系统** - 专业国际化框架

### 项目结构：
```
src/
├── 🖥️  cli/               # 高级 CLI 应用程序
│   ├── app.ts             # 主应用程序控制器
│   ├── commands/          # 功能命令模块
│   ├── i18n/              # 多语言支持系统
│   │   ├── en.ts          # 英文翻译
│   │   ├── zh.ts          # 中文翻译
│   │   └── types.ts       # 翻译接口
│   └── utils/             # CLI 工具和助手
├── 🎯 helpers/            # 跟单交易引擎
└── 🔧 utils/              # 共享工具
```

## 🛡️ 安全性与可靠性

- **🔐 私钥保护** - 安全密钥处理，永不记录或暴露
- **✅ 交易验证** - 执行前多层验证
- **🚨 错误恢复** - 全面错误处理和用户指导
- **💾 数据完整性** - 可靠的策略和交易数据存储

## 📚 入门指南

1. **环境设置**：在 `.env` 文件中配置 `PRIVATE_KEY_BASE58` 和其他设置
2. **首次运行**：使用 `npm run cli:zh` 或 `npm run cli` 启动 CLI 并探索主菜单
3. **策略管理**：导航到策略管理以创建和管理跟单交易策略
4. **直接交易**：使用代币交易子菜单进行即时买卖操作
5. **监控**：检查服务状态和查看日志历史以进行实时监控
6. **语言偏好**：使用更改语言选项在中文和英文之间切换

---

**📄 许可证**: OSNC-1.0 | **🔧 Node.js**: 18+ 必需 | **⚡ 运行时**: Node.js/Bun 兼容

## 🔧 开发与技术参考

### Jupiter 交易所集成

本服务使用 [Jupiter](https://jup.ag/) 进行 Solana 区块链上的交易处理。

#### 文档资源
- [通用文档](https://station.jup.ag/docs/)
- [API 概览](https://station.jup.ag/docs/swap-api/get-quote)
- [综合 API 文档](https://station.jup.ag/docs/api/introduction)
- [支持的去中心化交易所](https://api.jup.ag/swap/v1/program-id-to-label)

#### API 资源
- [费用结构信息](https://station.jup.ag/guides/general/faq#does-jupiter-swap-charge-any-fees)
- [平台费用说明](https://www.bbx.com/news-detail/1898146)
- [传统 API 文档](https://station.jup.ag/docs/old/apis/landing-transactions)
- [交换指令文档](https://station.jup.ag/docs/api/swap-instructions)

### 费用和优先级优化

#### 交易费用管理
- [在 Solana 上实施优先费用](https://solana.com/developers/guides/advanced/how-to-use-priority-fees)
- [Helius 优先费用 API 文档](https://docs.helius.dev/solana-apis/priority-fee-api)
- [交易费用优化讨论](https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/)

#### 计算预算优化
- [官方 Solana 交易费用文档](https://solana.com/docs/core/fees)
- [请求最优计算预算](https://solana.com/developers/guides/advanced/how-to-request-optimal-compute)
- [Solana JavaScript/TypeScript 帮助工具](https://github.com/solana-developers/helpers)

### 其他资源
- [QuickNode 交易文档](https://www.quicknode.com/docs/solana/transactions)
- [Jito 低延迟交易文档](https://docs.jito.wtf/lowlatencytxnsend/#tip-amount)
- [Jupiter API 交易机器人指南](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot)
- [跟单交易实施指南](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade)
