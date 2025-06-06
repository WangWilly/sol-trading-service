import { Command } from "commander";

import { validateSelect } from "./utils/validation";
import { ConsoleUtils } from "./utils/console";

import { i18n, Language } from "./i18n";

import { ServiceComponents } from "./types/services";
import { StrategyCommands } from "./commands/strategy";
import { DisplayCommands } from "./commands/display";
import { SwapCommands } from "./commands/swap";

import { initializeAllServices } from "../main";
import { loadPrivateKeyBase58 } from "../utils/privateKey";
import { LogHistoryHelper } from "../helpers/logHistoryHelper/helper";

////////////////////////////////////////////////////////////////////////////////

// Node.js compatible sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

////////////////////////////////////////////////////////////////////////////////

export class CliApplication {
  private services!: ServiceComponents;
  private strategyCommands!: StrategyCommands;
  private displayCommands!: DisplayCommands;
  private swapCommands!: SwapCommands;
  private program = new Command();

  async initialize(): Promise<void> {
    console.log(i18n.t("initializing"));

    this.program
      .version("1.0.0")
      .description("Interactive CLI for Solana copy-trading service")
      .option(
        "-k, --private-key <string>",
        "Private key (base58 encoded) for the wallet"
      )
      .option("-l, --language <string>", "Language (en|zh)", "en");

    this.program.parse(process.argv);
    const options = this.program.opts();

    // Set language
    if (options.language && ["en", "zh"].includes(options.language)) {
      i18n.setLanguage(options.language as Language);
    }

    if (!options.privateKey) {
      console.error(i18n.t("privateKeyRequired"));
      process.exit(1);
    }

    const playerKeypair = loadPrivateKeyBase58(options.privateKey);
    const services = await initializeAllServices(playerKeypair);

    this.services = {
      ...services,
      playerKeypair,
    };

    this.strategyCommands = new StrategyCommands(this.services);
    this.displayCommands = new DisplayCommands(this.services);
    this.swapCommands = new SwapCommands(this.services);

    console.log(i18n.t("serviceInitialized"));
  }

  async run(): Promise<void> {
    ConsoleUtils.displayHeader();

    await this.initialize();
    await sleep(1000); // Wait for 1 second before showing the menu
    ConsoleUtils.refreshConsole();

    await this.promptMainMenu();
  }

  private async promptMainMenu(): Promise<void> {
    const action = await validateSelect({
      message: i18n.t("whatToDo"),
      choices: [
        { name: i18n.t("viewServiceStatus"), value: "status" },
        { name: "─────────────────────", value: "separator1" },
        { name: i18n.t("strategyManagement"), value: "strategyMenu" },
        { name: i18n.t("tokenTrading"), value: "tradingMenu" },
        { name: "─────────────────────", value: "separator2" },
        { name: i18n.t("viewLogHistory"), value: "logs" },
        { name: i18n.t("viewWalletAssets"), value: "assets" },
        { name: "─────────────────────", value: "separator3" },
        { name: i18n.t("changeLanguage"), value: "language" },
        { name: i18n.t("exitApp"), value: "exit" },
        { name: "─────────────────────", value: "separator4" },
      ],
    });

    ConsoleUtils.refreshConsole();

    try {
      switch (action) {
        case "status":
          await this.displayCommands.displayStatus();
          break;
        case "strategyMenu":
          await this.promptStrategyMenu();
          break;
        case "tradingMenu":
          await this.promptTradingMenu();
          break;
        case "logs":
          await this.displayCommands.displayLogHistory();
          break;
        case "assets":
          await this.displayCommands.displayWalletAssets();
          break;
        case "language":
          await this.changeLanguage();
          break;
        case "exit":
          console.log(i18n.t("exit"));
          await this.gracefulExit();
          process.exit(0);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "ExitPromptError") {
        // back to main menu
        ConsoleUtils.refreshConsole();
        console.log(`\n${i18n.t("backToMainMenu")}`);
      } else {
        ConsoleUtils.logError(`${error}`);
      }
    }

    // Continue prompting unless exit was chosen
    if (action !== "exit") {
      await this.promptMainMenu();
    }
  }

  private async promptStrategyMenu(): Promise<void> {
    const action = await validateSelect({
      message: i18n.t("strategyManagementTitle"),
      choices: [
        { name: i18n.t("listActiveStrategies"), value: "list" },
        { name: i18n.t("createBuyStrategy"), value: "buy" },
        { name: i18n.t("createSellStrategy"), value: "sell" },
        { name: i18n.t("removeStrategy"), value: "remove" },
        { name: "─────────────────────", value: "separator" },
        { name: i18n.t("backToMainMenuOption"), value: "back" },
        { name: "─────────────────────", value: "separator2" },
      ],
    });

    ConsoleUtils.refreshConsole();

    if (action === "back") {
      return; // Return to main menu
    }

    try {
      switch (action) {
        case "list":
          await this.strategyCommands.listStrategies();
          break;
        case "buy":
          await this.strategyCommands.createBuyStrategy();
          break;
        case "sell":
          await this.strategyCommands.createSellStrategy();
          break;
        case "remove":
          await this.strategyCommands.removeStrategy();
          break;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "ExitPromptError") {
        // back to main menu
        ConsoleUtils.refreshConsole();
        console.log(`\n${i18n.t("backToMainMenu")}`);
        return;
      } else {
        ConsoleUtils.logError(`${error}`);
      }
    }

    // Continue in strategy menu unless back was chosen
    await this.promptStrategyMenu();
  }

  private async promptTradingMenu(): Promise<void> {
    const action = await validateSelect({
      message: i18n.t("tokenTradingTitle"),
      choices: [
        { name: i18n.t("directBuyToken"), value: "directBuy" },
        { name: i18n.t("directSellToken"), value: "directSell" },
        { name: i18n.t("quickBuyToken"), value: "quickBuy" },
        { name: i18n.t("quickSellToken"), value: "quickSell" },
        { name: "─────────────────────", value: "separator" },
        { name: i18n.t("viewSwapConfig"), value: "swapConfig" },
        { name: i18n.t("updateSwapConfig"), value: "updateSwapConfig" },
        { name: i18n.t("viewSwapHistory"), value: "swapHistory" },
        { name: "─────────────────────", value: "separator2" },
        { name: i18n.t("backToMainMenuOption"), value: "back" },
        { name: "─────────────────────", value: "separator3" },
      ],
    });

    ConsoleUtils.refreshConsole();

    if (action === "back" || action === "separator" || action === "separator2") {
      return; // Return to main menu
    }

    try {
      switch (action) {
        case "directBuy":
          await this.swapCommands.directBuyToken();
          break;
        case "directSell":
          await this.swapCommands.directSellToken();
          break;
        case "quickBuy":
          await this.swapCommands.quickBuyToken();
          break;
        case "quickSell":
          await this.swapCommands.quickSellToken();
          break;
        case "swapConfig":
          await this.swapCommands.showSwapConfig();
          break;
        case "updateSwapConfig":
          await this.swapCommands.updateSwapConfig();
          break;
        case "swapHistory":
          await this.swapCommands.getSwapHistory();
          break;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "ExitPromptError") {
        // back to main menu
        ConsoleUtils.refreshConsole();
        console.log(`\n${i18n.t("backToMainMenu")}`);
        return;
      } else {
        ConsoleUtils.logError(`${error}`);
      }
    }

    // Continue in trading menu unless back was chosen
    await this.promptTradingMenu();
  }

  private async changeLanguage(): Promise<void> {
    console.log(
      `${i18n.t("currentLanguage")}: ${
        i18n.getCurrentLanguage() === "en"
          ? i18n.t("english")
          : i18n.t("chinese")
      }`
    );

    const newLanguage = await validateSelect({
      message: i18n.t("selectLanguage"),
      choices: [
        { name: i18n.t("english"), value: "en" },
        { name: i18n.t("chinese"), value: "zh" },
      ],
    });

    if (newLanguage !== i18n.getCurrentLanguage()) {
      i18n.setLanguage(newLanguage as Language);
      console.log(`✅ ${i18n.t("languageChanged")}`);

      // Refresh the console to show the change immediately for the menu
      ConsoleUtils.refreshConsole();
    } else {
      console.log(
        `ℹ️ ${i18n.t("currentLanguage")}: ${
          newLanguage === "en" ? i18n.t("english") : i18n.t("chinese")
        }`
      );
    }
  }

  private async gracefulExit(): Promise<void> {
    try {
      if (this.services.copyTradeHelper) {
        console.log(i18n.t("savingStrategies"));
        await this.services.copyTradeHelper.gracefulShutdown();
      }
      if (this.services.solRpcWsSubscribeManager) {
        await this.services.solRpcWsSubscribeManager.gracefulStop();
      }
      if (this.swapCommands) {
        await this.swapCommands.cleanup();
      }
      // Save logs before exiting
      LogHistoryHelper.saveLogsToFile();
      console.log(i18n.t("gracefulExitCompleted"));
    } catch (error) {
      console.error(`${i18n.t("errorDuringGracefulExit")}: ${error}`);
      throw error;
    }
  }

  setupSignalHandlers(): void {
    const handleSignal = async (signal: string) => {
      console.log(
        signal === "SIGINT"
          ? i18n.t("sigintReceived")
          : i18n.t("sigtermReceived")
      );
      try {
        await this.gracefulExit();
        process.exit(0);
      } catch (error) {
        console.error(`${i18n.t("errorDuringGracefulExit")}: ${error}`);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
  }
}
