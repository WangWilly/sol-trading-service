import BN from "bn.js";
import {
  validateCheckbox,
  validateInput,
  validateNumber,
  validateSelect,
  validations,
} from "../utils/validation";
import { i18n } from "../i18n";
import { ServiceComponents } from "../types/services";
import {
  CopyTradeRecordOnBuyStrategySchema,
  CopyTradeRecordOnSellStrategySchema,
} from "../../helpers/copyTradeHelper/dtos";
import { COIN_TYPE_NAME_MAP, COIN_TYPE_USDC_MINT, COIN_TYPE_USDT_MINT, COIN_TYPE_WSOL_MINT } from "../../utils/constants";
import { select } from "@inquirer/prompts";

////////////////////////////////////////////////////////////////////////////////

export class StrategyCommands {
  constructor(private services: ServiceComponents) {}

  async createBuyStrategy(): Promise<void> {
    const walletAddress = await validateInput({
      message: i18n.t("enterWalletAddress"),
      validate: validations.solanaAddress,
    });

    const strategyName = await validateInput({
      message: i18n.t("enterStrategyName"),
      validate: validations.strategyName,
    });

    const usedCoinTypes = await validateCheckbox({
      message: i18n.t("selectUsedCoin"),
      choices: [
        {
          name: COIN_TYPE_NAME_MAP[COIN_TYPE_WSOL_MINT.toBase58()],
          value: COIN_TYPE_WSOL_MINT,
          checked: true,
        },
        {
          name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDC_MINT.toBase58()],
          value: COIN_TYPE_USDC_MINT,
        },
        {
          name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDT_MINT.toBase58()],
          value: COIN_TYPE_USDT_MINT,
        }
        // Add more coins here if needed
      ],
      required: true,
    });

    for (const coinType of usedCoinTypes) {
      const sellCoinAmount = await validateNumber({
        message: i18n.strategySellAmount(coinType.toBase58()),
        validate: validations.positiveNumber,
      });

      const slippageBps = await validateNumber({
        message: i18n.t("enterSlippage"),
        validate: validations.basisPoints,
        default: 150, // Default to 1.5% slippage
      });

      const buyStrategy = CopyTradeRecordOnBuyStrategySchema.parse({
        sellCoinType: coinType,
        sellCoinAmount: new BN(sellCoinAmount),
        slippageBps: slippageBps,
      });

      await this.services.solRpcWsSubscribeManager.createCopyTradeRecordOnBuyStrategy(
        walletAddress,
        strategyName + ` - ${COIN_TYPE_NAME_MAP[coinType.toBase58()]}`,
        buyStrategy
      );
    }

    console.log(i18n.strategySuccess(strategyName, "buy"));
  }

  async createSellStrategy(): Promise<void> {
    const walletAddress = await validateInput({
      message: i18n.t("enterWalletAddress"),
      validate: validations.solanaAddress,
    });

    const strategyName = await validateInput({
      message: i18n.t("enterStrategyName"),
      validate: validations.strategyName,
    });

    const fixedSellingBps = await validateNumber({
      message: i18n.t("enterFixedSellingPercentage"),
      validate: validations.sellingBps,
      default: 0,
    });

    const slippageBps = await validateNumber({
      message: i18n.t("enterSlippage"),
      validate: validations.basisPoints,
      default: 150, // Default to 1.5% slippage
    });

    const sellStrategy = CopyTradeRecordOnSellStrategySchema.parse({
      fixedSellingBps: fixedSellingBps,
      slippageBps: slippageBps,
    });

    await this.services.solRpcWsSubscribeManager.createCopyTradeRecordOnSellStrategy(
      walletAddress,
      strategyName,
      sellStrategy
    );

    console.log(i18n.strategySuccess(strategyName, "sell"));
  }

  async listStrategies(): Promise<void> {
    const strategies =
      this.services.solRpcWsSubscribeManager.getAllCopyTradeRecords();

    if (strategies.length === 0) {
      console.log(i18n.t("noActiveStrategies"));
      return;
    }

    console.log(`\n${i18n.t("activeStrategiesTitle")}`);

    strategies.forEach((strategy: any, index: number) => {
      console.log(`\n${index + 1}. ✨ ${strategy.name} (${strategy.type})`);
      console.log(`   ${i18n.t("targetWallet")}: ${strategy.targetWallet}`);
      console.log(
        `   ${i18n.t("configuration")}: ${JSON.stringify(
          strategy.config,
          null,
          2
        )}`
      );
    });
  }

  async removeStrategy(): Promise<void> {
    const strategies =
      this.services.solRpcWsSubscribeManager.getAllCopyTradeRecords();

    if (strategies.length === 0) {
      console.log(i18n.t("noStrategiesToRemove"));
      return;
    }

    const strategyIndex = await validateSelect({
      message: i18n.t("selectStrategyToRemove"),
      choices: strategies.map((s: any, i: number) => ({
        name: `${s.name} (${s.type}) - ${s.targetWallet}`,
        value: i,
      })),
    });

    const strategy = strategies[strategyIndex];
    const ok = await this.services.solRpcWsSubscribeManager.removeCopyTradeRecord(
      strategy.id
    );
    if (!ok) {
      console.log(i18n.strategyRemovalFailed(strategy.name));
      return;
    }

    console.log(i18n.strategyRemovalSuccess(strategy.name));
  }
}
