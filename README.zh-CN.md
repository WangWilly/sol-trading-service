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
- **🎨 交互式菜单系统** - 9 个综合交易选项
- **📱 实时监控** - 实时服务状态和策略跟踪
- **📈 投资组合管理** - 完整的钱包和资产概览
- **📋 交易历史** - 详细日志记录和可搜索记录

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
# 编辑 .env 文件，添加您的 Solana 私钥和设置

# 3. 启动 CLI（中文）
npm run cli:zh

# 3a. 启动 CLI（英文）
npm run cli
```

## 🎛️ CLI 导航

### 主菜单选项：

| 选项 | 功能 | 描述 |
|------|------|------|
| 1️⃣ | **📊 服务状态** | 实时监控跟单交易服务健康状况 |
| 2️⃣ | **📋 活跃策略** | 查看和管理所有运行中的交易策略 |
| 3️⃣ | **💰 创建买入策略** | 基于目标钱包设置自动买入 |
| 4️⃣ | **🔄 创建卖出策略** | 配置智能卖出规则和触发器 |
| 5️⃣ | **🗑️ 移除策略** | 安全删除现有交易策略 |
| 6️⃣ | **📜 交易日志** | 全面的交易历史和分析 |
| 7️⃣ | **💼 钱包资产** | 完整的投资组合概览和代币余额 |
| 8️⃣ | **🌐 语言设置** | 切换界面语言（中文 ↔ EN） |
| 9️⃣ | **❌ 退出应用** | 优雅关闭并保存数据 |

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
├── 🖥️  cli/                    # 高级 CLI 应用程序
│   ├── app.ts             # 主应用程序控制器
│   ├── commands/          # 功能命令模块
│   ├── i18n/              # 多语言支持系统
│   │   ├── en.ts          # 英文翻译
│   │   ├── zh.ts          # 中文翻译
│   │   └── types.ts       # 翻译接口
│   └── utils/             # CLI 工具和助手
├── 🎯 core/                   # 跟单交易引擎
├── 📝 types/                  # TypeScript 定义
└── 🔧 utils/                  # 共享工具
```

## 🛡️ 安全性与可靠性

- **🔐 私钥保护** - 安全密钥处理，永不记录或暴露
- **✅ 交易验证** - 执行前多层验证
- **🚨 错误恢复** - 全面错误处理和用户指导
- **💾 数据完整性** - 可靠的策略和交易数据存储

## 📚 入门指南

1. **环境设置**：配置您的 Solana RPC 端点和私钥
2. **首次运行**：启动 CLI 并探索交互式菜单
3. **策略创建**：设置您的第一个跟单交易策略
4. **监控**：使用实时状态和日志功能
5. **语言偏好**：切换到您偏好的界面语言

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
