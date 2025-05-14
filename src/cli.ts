// Third-party library imports
import { Command } from "commander";
import { input, select, number } from "@inquirer/prompts";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { sleep } from "bun";

// Service imports
import { initializeCopyTradingService } from "./main";
import { CopyTradeHelper } from "./helpers/copyTradeHelper";
import { SolRpcWsHelper } from "./helpers/solRpcWsClient";
import { SolRpcWsSubscribeManager } from "./helpers/solRpcWsSubscribeManager";

// Constants and DTOs
import { COIN_TYPE_WSOL_MINT } from "./helpers/solRpcWsClient/const";
import {
  CopyTradeRecordOnBuyStrategySchema,
  CopyTradeRecordOnSellStrategySchema,
} from "./helpers/copyTradeHelper/dtos";

// Utility helpers
import { LogHistoryHelper } from "./helpers/logHistoryHelper/helper";
import { loadPrivateKeyBase58 } from "./utils/privateKey";
import { getWalletTokenAssets } from "./utils/tokenAsset";

////////////////////////////////////////////////////////////////////////////////

// Wrapper functions to handle validation re-prompting
async function validateInput(options: any): Promise<string> {
  while (true) {
    try {
      return await input(options);
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`❌ Error: ${error}`);
    }
  }
}

async function validateNumber(options: any): Promise<number> {
  while (true) {
    try {
      const res = await number(options);
      if (res !== undefined && res > 0) {
        return res;
      } else {
        console.log(`❌ Please enter a valid number greater than 0`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`❌ Error: ${error}`);
    }
  }
}

async function validateSelect(options: any): Promise<any> {
  while (true) {
    try {
      return await select(options);
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`❌ Error: ${error}`);
    }
  }
}

const program = new Command();

// Initialize variables to hold service components
let solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
let copyTradeHelper: CopyTradeHelper;
let solRpcWsHelper: SolRpcWsHelper;
let playerKeypair: any;
let solWeb3Conn: any;

async function initialize() {
  console.log(`🚀 Initializing Copy Trading Service...`);

  program
    .version("1.0.0")
    .description("Interactive CLI for Solana copy-trading service")
    .option(
      "-k, --private-key <string>",
      "Private key (base58 encoded) for the wallet",
    );

  program.parse(process.argv);
  const options = program.opts();

  if (!options.privateKey) {
    console.error(
      `❌ Error: Private key is required. Use -k or --private-key option.`,
    );
    process.exit(1);
  }
  playerKeypair = loadPrivateKeyBase58(options.privateKey);

  const services = await initializeCopyTradingService(playerKeypair);

  solRpcWsSubscribeManager = services.solRpcWsSubscribeManager;
  copyTradeHelper = services.copyTradeHelper;
  solRpcWsHelper = services.solRpcWsHelper;
  solWeb3Conn = services.solWeb3Conn;

  console.log(`✅ Service initialized successfully!`);
}

async function createBuyStrategy() {
  const walletAddress = await validateInput({
    message: "Enter wallet address to copy trades from:",
    validate: (input: string) => {
      try {
        new PublicKey(input);
        return true;
      } catch (error) {
        return "Please enter a valid Solana wallet address";
      }
    },
  });

  const strategyName = await validateInput({
    message: "Enter a name for this strategy:",
    validate: (input: string) => {
      if (input.trim() !== "") {
        return true;
      }
      return "Strategy name cannot be empty";
    },
  });

  const sellCoinAmount = await validateNumber({
    message: "Enter the amount of SOL to use for trades (in lamports):",
    validate: (input: number) => {
      if (input !== undefined && input > 0) {
        return true;
      }
      return "Please enter a valid number greater than 0";
    },
  });

  const slippageBps = await validateNumber({
    message: "Enter slippage in basis points (e.g. 100 for 1%):",
    validate: (input: number) => {
      if (input !== undefined && input > 0 && input <= 10000) {
        return true;
      }
      return "Please enter a valid number between 1 and 10000";
    },
  });

  const buyStrategy = CopyTradeRecordOnBuyStrategySchema.parse({
    sellCoinType: COIN_TYPE_WSOL_MINT,
    sellCoinAmount: new BN(sellCoinAmount),
    slippageBps: slippageBps,
  });

  await solRpcWsSubscribeManager.createCopyTradeRecordOnBuyStrategy(
    walletAddress,
    strategyName,
    buyStrategy,
  );

  console.log(`✅ Buy strategy "${strategyName}" created successfully!`);
}

async function createSellStrategy() {
  const walletAddress = await validateInput({
    message: "Enter wallet address to copy trades from:",
    validate: (input: string) => {
      try {
        new PublicKey(input);
        return true;
      } catch (error) {
        return "Please enter a valid Solana wallet address";
      }
    },
  });

  const strategyName = await validateInput({
    message: "Enter a name for this strategy:",
    validate: (input: string) => {
      if (input.trim() !== "") {
        return true;
      }
      return "Strategy name cannot be empty";
    },
  });

  const fixedSellingBps = await validateNumber({
    message:
      "Enter fixed selling percentage in basis points (e.g. 500 for 5%):",
    validate: (num: number) => {
      if (num !== undefined && num > 0 && num <= 10000) {
        return true;
      }
      return "Please enter a valid number between 1 and 10000";
    },
  });

  const slippageBps = await validateNumber({
    message: "Enter slippage in basis points (e.g. 100 for 1%):",
    validate: (input: number) => {
      if (input !== undefined && input > 0 && input <= 10000) {
        return true;
      }
      return "Please enter a valid number between 1 and 10000";
    },
  });

  const sellStrategy = CopyTradeRecordOnSellStrategySchema.parse({
    fixedSellingBps: fixedSellingBps,
    slippageBps: slippageBps,
  });

  await solRpcWsSubscribeManager.createCopyTradeRecordOnSellStrategy(
    walletAddress,
    strategyName,
    sellStrategy,
  );

  console.log(`✅ Sell strategy "${strategyName}" created successfully!`);
}

async function listStrategies() {
  const strategies = solRpcWsSubscribeManager.getAllCopyTradeRecords();

  if (strategies.length === 0) {
    console.log(`⚠️ No active strategies found`);
    return;
  }

  console.log(`\n📋 ====== Active Copy-Trade Strategies ======`);

  strategies.forEach((strategy: any, index: number) => {
    console.log(`\n${index + 1}. ✨ ${strategy.name} (${strategy.type})`);
    console.log(`   👤 Target Wallet: ${strategy.targetWallet}`);
    console.log(
      `   ⚙️  Configuration: ${JSON.stringify(strategy.config, null, 2)}`,
    );
  });
}

async function removeStrategy() {
  const strategies = solRpcWsSubscribeManager.getAllCopyTradeRecords();

  if (strategies.length === 0) {
    console.log(`⚠️ No active strategies to remove`);
    return;
  }

  const strategyIndex = await validateSelect({
    message: "Select a strategy to remove:",
    choices: strategies.map((s: any, i: number) => ({
      name: `${s.name} (${s.type}) - ${s.targetWallet}`,
      value: i,
    })),
  });

  const strategy = strategies[strategyIndex];
  await solRpcWsSubscribeManager.removeCopyTradeRecord(strategy.id);

  console.log(`✅ Strategy "${strategy.name}" removed successfully!`);
}

async function displayStatus() {
  const wsStatus = solRpcWsHelper.getStatus();
  const activeStrategies =
    solRpcWsSubscribeManager.getAllCopyTradeRecords().length;

  console.log(`📊 ====== Copy-Trading Service Status ======`);
  console.log(
    `🔌 WebSocket Connection: ${
      wsStatus.connected ? "✅ Connected" : "❌ Disconnected"
    }`,
  );
  console.log(`📈 Active Strategies: ${activeStrategies}`);
  console.log(`⏱️ Last Activity: ${wsStatus.lastActivity || "N/A"}`);
  console.log(`⏰ Uptime: ${wsStatus.uptime || "N/A"}`);
}

async function displayLogHistory() {
  const logs = LogHistoryHelper.listLogHistory();

  if (logs.length === 0) {
    console.log(`⚠️ No logs found in history`);
    return;
  }

  console.log(`\n📋 ====== Log History ======`);

  logs.forEach((log: any) => {
    console.log(
      `\n${log.index}. ⏱️ ${new Date(log["_meta"].date).toLocaleString()}`,
    );
    console.log(`   📝 ${JSON.stringify(log["0"], null, 2)}`);
  });

  console.log(`\nTotal logs: ${logs.length}`);
}

async function displayWalletAssets() {
  console.log(`🔍 Fetching your wallet token assets...`);
  
  try {
    const assets = await getWalletTokenAssets(
      playerKeypair.publicKey,
      solWeb3Conn
    );

    if (assets.length === 0) {
      console.log(`⚠️ No token assets found in your wallet`);
      return;
    }

    console.log(`\n💰 ====== Your Wallet Token Assets ======`);
    
    assets.forEach((asset, index) => {
      console.log(`\n${index + 1}. Token: ${asset.mint}`);
      console.log(`   • Amount: ${asset.uiAmount} (${asset.amount} raw)`);
      console.log(`   • Decimals: ${asset.decimals}`);
    });
    
    console.log(`\nTotal tokens: ${assets.length}`);
  } catch (error) {
    console.error(`❌ Error fetching token assets: ${error}`);
  }
}

// Function to refresh the console
function refreshConsole() {
  // Clear the console using the cross-platform method
  console.clear();

  // Re-display the header for visual consistency
  console.log(`       🤖 SOLANA COPY-TRADING SERVICE 🤖       \n`);
}

async function main() {
  console.log(`\n==============================================`);
  console.log(`       🤖 SOLANA COPY-TRADING SERVICE 🤖       `);
  console.log(`==============================================\n`);

  await initialize();

  await sleep(1000); // Wait for 1 second before showing the menu

  refreshConsole();

  const promptMainMenu = async () => {
    const action = await validateSelect({
      message: "What would you like to do?",
      choices: [
        { name: "📊 View service status", value: "status" },
        { name: "📋 List active strategies", value: "list" },
        { name: "🟢 Create buy strategy", value: "buy" },
        { name: "🔴 Create sell strategy", value: "sell" },
        { name: "🗑️  Remove strategy", value: "remove" },
        { name: "📜 View log history", value: "logs" },
        { name: "💰 View wallet token assets", value: "assets" },
        { name: "❌ Exit", value: "exit" },
      ],
    });

    refreshConsole();
    try {
      switch (action) {
        case "status":
          await displayStatus();
          break;
        case "list":
          await listStrategies();
          break;
        case "buy":
          await createBuyStrategy();
          break;
        case "sell":
          await createSellStrategy();
          break;
        case "remove":
          await removeStrategy();
          break;
        case "logs":
          await displayLogHistory();
          break;
        case "assets":
          await displayWalletAssets();
          break;
        case "exit":
          console.log(`👋 Exiting service gracefully...`);
          await solRpcWsSubscribeManager.gracefulStop();
          LogHistoryHelper.saveLogsToFile();
          process.exit(0);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "ExitPromptError") {
        // back to main menu
        refreshConsole();
        console.log(`\n🔙 Back to main menu...`);
      } else {
        console.log(`❌ Error: ${error}`);
      }
    }
    // Refresh the console for the next prompt

    // Continue prompting unless exit was chosen
    if (action !== "exit") {
      await promptMainMenu();
    }
  };

  await promptMainMenu();
}

// Handle SIGINT and SIGTERM for graceful exit
process.on("SIGINT", async () => {
  console.log(`\n⚠️ SIGINT received. Exiting gracefully...`);
  if (solRpcWsSubscribeManager) {
    await solRpcWsSubscribeManager.gracefulStop();
  }
  // Save logs before exiting
  LogHistoryHelper.saveLogsToFile();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(`\n⚠️ SIGTERM received. Exiting gracefully...`);
  if (solRpcWsSubscribeManager) {
    await solRpcWsSubscribeManager.gracefulStop();
  }
  // Save logs before exiting
  LogHistoryHelper.saveLogsToFile();
  process.exit(0);
});

// Start the CLI
main().catch((error) => {
  console.error(`❌ Error in CLI: ${error}`);
  process.exit(1);
});
