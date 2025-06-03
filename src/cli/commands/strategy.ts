import BN from "bn.js";
import { validateInput, validateNumber, validateSelect, validations } from "../utils/validation";
import { i18n } from "../i18n";
import { ServiceComponents } from "../types/services";
import { COIN_TYPE_WSOL_MINT } from "../../helpers/solRpcWsClient/const";
import {
  CopyTradeRecordOnBuyStrategySchema,
  CopyTradeRecordOnSellStrategySchema,
} from "../../helpers/copyTradeHelper/dtos";

export class StrategyCommands {
  constructor(private services: ServiceComponents) {}

  async createBuyStrategy(): Promise<void> {
    const walletAddress = await validateInput({
      message: i18n.t('enterWalletAddress'),
      validate: validations.solanaAddress,
    });

    const strategyName = await validateInput({
      message: i18n.t('enterStrategyName'),
      validate: validations.strategyName,
    });

    const sellCoinAmount = await validateNumber({
      message: i18n.t('enterSolAmount'),
      validate: validations.positiveNumber,
    });

    const slippageBps = await validateNumber({
      message: i18n.t('enterSlippage'),
      validate: validations.basisPoints,
    });

    const buyStrategy = CopyTradeRecordOnBuyStrategySchema.parse({
      sellCoinType: COIN_TYPE_WSOL_MINT,
      sellCoinAmount: new BN(sellCoinAmount),
      slippageBps: slippageBps,
    });

    await this.services.solRpcWsSubscribeManager.createCopyTradeRecordOnBuyStrategy(
      walletAddress,
      strategyName,
      buyStrategy,
    );

    console.log(i18n.strategySuccess(strategyName, 'buy'));
  }

  async createSellStrategy(): Promise<void> {
    const walletAddress = await validateInput({
      message: i18n.t('enterWalletAddress'),
      validate: validations.solanaAddress,
    });

    const strategyName = await validateInput({
      message: i18n.t('enterStrategyName'),
      validate: validations.strategyName,
    });

    const fixedSellingBps = await validateNumber({
      message: i18n.t('enterFixedSellingPercentage'),
      validate: validations.basisPoints,
    });

    const slippageBps = await validateNumber({
      message: i18n.t('enterSlippage'),
      validate: validations.basisPoints,
    });

    const sellStrategy = CopyTradeRecordOnSellStrategySchema.parse({
      fixedSellingBps: fixedSellingBps,
      slippageBps: slippageBps,
    });

    await this.services.solRpcWsSubscribeManager.createCopyTradeRecordOnSellStrategy(
      walletAddress,
      strategyName,
      sellStrategy,
    );

    console.log(i18n.strategySuccess(strategyName, 'sell'));
  }

  async listStrategies(): Promise<void> {
    const strategies = this.services.solRpcWsSubscribeManager.getAllCopyTradeRecords();

    if (strategies.length === 0) {
      console.log(i18n.t('noActiveStrategies'));
      return;
    }

    console.log(`\n${i18n.t('activeStrategiesTitle')}`);

    strategies.forEach((strategy: any, index: number) => {
      console.log(`\n${index + 1}. ✨ ${strategy.name} (${strategy.type})`);
      console.log(`   ${i18n.t('targetWallet')}: ${strategy.targetWallet}`);
      console.log(`   ${i18n.t('configuration')}: ${JSON.stringify(strategy.config, null, 2)}`);
    });
  }

  async removeStrategy(): Promise<void> {
    const strategies = this.services.solRpcWsSubscribeManager.getAllCopyTradeRecords();

    if (strategies.length === 0) {
      console.log(i18n.t('noStrategiesToRemove'));
      return;
    }

    const strategyIndex = await validateSelect({
      message: i18n.t('selectStrategyToRemove'),
      choices: strategies.map((s: any, i: number) => ({
        name: `${s.name} (${s.type}) - ${s.targetWallet}`,
        value: i,
      })),
    });

    const strategy = strategies[strategyIndex];
    await this.services.solRpcWsSubscribeManager.removeCopyTradeRecord(strategy.id);

    console.log(i18n.strategyRemovalSuccess(strategy.name));
  }
}
