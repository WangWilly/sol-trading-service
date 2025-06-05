import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  validateInput,
  validateNumber,
  validateSelect,
  validations,
} from "../utils/validation";
import { i18n } from "../i18n";
import { ConsoleUtils } from "../utils/console";
import {
  COIN_TYPE_NAME_MAP,
  COIN_TYPE_USDC_MINT,
  COIN_TYPE_USDT_MINT,
  COIN_TYPE_WSOL_MINT,
} from "../../utils/constants";
import { ServiceComponents } from "../types/services";

////////////////////////////////////////////////////////////////////////////////

export class SwapCommands {
  constructor(private services: ServiceComponents) {}

  async directBuyToken(): Promise<void> {
    try {
      console.log(`\n${i18n.t("directBuyTitle")}`);

      // Get token mint address
      const tokenMint = await validateInput({
        message: i18n.t("enterTokenMint"),
        validate: validations.solanaAddress,
      });

      // Select buy coin type
      const buyCoinMint = await validateSelect({
        message: i18n.t("selectBuyCoin"),
        choices: [
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_WSOL_MINT.toBase58()],
            value: COIN_TYPE_WSOL_MINT.toBase58(),
          },
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDC_MINT.toBase58()],
            value: COIN_TYPE_USDC_MINT.toBase58(),
          },
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDT_MINT.toBase58()],
            value: COIN_TYPE_USDT_MINT.toBase58(),
          },
        ],
      });

      // Get buy amount
      const buyAmount = await validateNumber({
        message: i18n.getBuyAmountMessage(buyCoinMint),
        validate: validations.positiveNumber,
      });

      // Get slippage (optional)
      const slippageInput = await validateInput({
        message: i18n.t("enterSlippageOptional"),
        validate: (input: string) => {
          if (input.trim() === "") return true;
          const num = parseFloat(input);
          if (isNaN(num)) return i18n.t("validSlippage");
          return validations.slippage(num);
        },
      });

      const slippage =
        slippageInput.trim() === "" ? undefined : parseInt(slippageInput);

      // Get priority fee (optional)
      const priorityFeeInput = await validateInput({
        message: i18n.t("enterPriorityFeeOptional"),
        validate: (input: string) => {
          if (input.trim() === "") return true;
          const num = parseFloat(input);
          if (isNaN(num)) return i18n.t("validNumberGreaterThanZero");
          return validations.positiveNumber(num);
        },
      });

      const priorityFee =
        priorityFeeInput.trim() === ""
          ? undefined
          : parseFloat(priorityFeeInput);

      console.log(`\n${i18n.t("executingBuy")}...`);
      ConsoleUtils.showSpinner();

      const result = await this.services.swapHelper.buy({
        fromTokenMint: new PublicKey(buyCoinMint),
        toTokenMint: new PublicKey(tokenMint),
        amount: new BN(buyAmount),
        slippageBps: slippage,
        priorityFee,
      });

      ConsoleUtils.hideSpinner();

      if (result.success) {
        console.log(`✅ ${i18n.t("buySuccessful")}`);
        console.log(`${i18n.t("signature")}: ${result.signature}`);
        console.log(
          `${i18n.t("tokensReceived")}: ${result.amount?.toString() || "N/A"}`
        );
        console.log(
          `${i18n.t("actualSlippage")}: ${
            result.actualSlippageBps
              ? (result.actualSlippageBps / 100).toFixed(2)
              : "N/A"
          }%`
        );
      } else {
        console.log(`❌ ${i18n.t("buyFailed")}: ${result.error}`);
      }
    } catch (error) {
      ConsoleUtils.hideSpinner();
      throw error;
    }
  }

  async directSellToken(): Promise<void> {
    try {
      console.log(`\n${i18n.t("directSellTitle")}`);

      // Get token mint address
      const tokenMint = await validateInput({
        message: i18n.t("enterTokenMint"),
        validate: validations.solanaAddress,
      });

      // Select sell coin type
      // TODO:
      /**
      const sellCoinMint = await validateSelect({
        message: i18n.t('selectSellCoin'),
        choices: [
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_WSOL_MINT.toBase58()],
            value: COIN_TYPE_WSOL_MINT.toBase58(),
          },
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDC_MINT.toBase58()],
            value: COIN_TYPE_USDC_MINT.toBase58(),
          },
          {
            name: COIN_TYPE_NAME_MAP[COIN_TYPE_USDT_MINT.toBase58()],
            value: COIN_TYPE_USDT_MINT.toBase58(),
          },
        ],
      });
      */

      // Select sell amount type
      const sellAmountType = await validateSelect({
        message: i18n.t("selectSellAmountType"),
        choices: [
          { name: i18n.t("sellPercentage"), value: "percentage" },
          { name: i18n.t("sellFixedAmount"), value: "fixed" },
          { name: i18n.t("sellAllTokens"), value: "all" },
        ],
      });

      let sellAmount: BN | undefined;
      let sellPercentage: number | undefined;

      if (sellAmountType === "percentage") {
        const percentage = await validateNumber({
          message: i18n.t("enterSellPercentage"),
          validate: (input: number | undefined) => {
            if (input === undefined) return i18n.t("validPercentage");
            if (input <= 0 || input > 100) {
              return i18n.t("validPercentage");
            }
            return true;
          },
        });
        sellPercentage = percentage / 100; // Convert to decimal
      } else if (sellAmountType === "fixed") {
        const amount = await validateNumber({
          message: i18n.t("enterSellAmount"),
          validate: (input: number | undefined) => {
            if (input === undefined)
              return i18n.t("validNumberGreaterThanZero");
            return validations.positiveNumber(input);
          },
        });
        sellAmount = new BN(amount);
      } else if (sellAmountType === "all") {
        sellAmount = undefined;
        sellPercentage = 1;
      }

      // Get slippage (optional)
      const slippageInput = await validateInput({
        message: i18n.t("enterSlippageOptional"),
        validate: (input: string) => {
          if (input.trim() === "") return true;
          const num = parseFloat(input);
          if (isNaN(num)) return i18n.t("validSlippage");
          return validations.slippage(num);
        },
      });

      const slippage =
        slippageInput.trim() === "" ? undefined : parseInt(slippageInput);

      // Get priority fee (optional)
      const priorityFeeInput = await validateInput({
        message: i18n.t("enterPriorityFeeOptional"),
        validate: (input: string) => {
          if (input.trim() === "") return true;
          const num = parseFloat(input);
          if (isNaN(num)) return i18n.t("validNumberGreaterThanZero");
          return validations.positiveNumber(num);
        },
      });

      const priorityFee =
        priorityFeeInput.trim() === ""
          ? undefined
          : parseFloat(priorityFeeInput);

      console.log(`\n${i18n.t("executingSell")}...`);
      ConsoleUtils.showSpinner();

      const result = await this.services.swapHelper.sell({
        tokenMint: new PublicKey(tokenMint),
        tokenAmount: sellAmount || new BN(0),
        percentage: sellPercentage,
        slippageBps: slippage,
        priorityFee,
      });

      ConsoleUtils.hideSpinner();

      if (result.success) {
        console.log(`✅ ${i18n.t("sellSuccessful")}`);
        console.log(`${i18n.t("signature")}: ${result.signature}`);
        console.log(
          `${i18n.t("coinsReceived")}: ${result.amount?.toString() || "N/A"}`
        );
        console.log(
          `${i18n.t("actualSlippage")}: ${
            result.actualSlippageBps
              ? (result.actualSlippageBps / 100).toFixed(2)
              : "N/A"
          }%`
        );
      } else {
        console.log(`❌ ${i18n.t("sellFailed")}: ${result.error}`);
      }
    } catch (error) {
      ConsoleUtils.hideSpinner();
      throw error;
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async quickBuyToken(): Promise<void> {
    try {
      console.log(`\n${i18n.t("quickBuyTitle")}`);

      // Get token mint address
      const tokenMint = await validateInput({
        message: i18n.t("enterTokenMint"),
        validate: validations.solanaAddress,
      });

      // Get quick amount options from config
      const config = this.services.swapHelper.getConfig();
      const customBuyAmounts = config.customBuyAmounts;

      if (customBuyAmounts.length === 0) {
        console.log(`⚠️ ${i18n.t("noQuickAmountsConfigured")}`);
        return;
      }

      // Select quick amount
      const selectedAmountIndex = await validateSelect({
        message: i18n.t("selectQuickAmount"),
        choices: customBuyAmounts.map((amount: number, index: number) => ({
          name: `${amount} SOL`,
          value: index,
        })),
      });

      console.log(`\n${i18n.t("executingQuickBuy")}...`);
      ConsoleUtils.showSpinner();

      const result = await this.services.swapHelper.quickBuy(
        new PublicKey(tokenMint),
        selectedAmountIndex
      );

      ConsoleUtils.hideSpinner();

      if (result.success) {
        console.log(`✅ ${i18n.t("quickBuySuccessful")}`);
        console.log(`${i18n.t("signature")}: ${result.signature}`);
        console.log(
          `${i18n.t("tokensReceived")}: ${result.amount?.toString() || "N/A"}`
        );
        console.log(
          `${i18n.t("actualSlippage")}: ${
            result.actualSlippageBps
              ? (result.actualSlippageBps / 100).toFixed(2)
              : "N/A"
          }%`
        );
      } else {
        console.log(`❌ ${i18n.t("quickBuyFailed")}: ${result.error}`);
      }
    } catch (error) {
      ConsoleUtils.hideSpinner();
      throw error;
    }
  }

  async quickSellToken(): Promise<void> {
    try {
      console.log(`\n${i18n.t("quickSellTitle")}`);

      // Get token mint address
      const tokenMint = await validateInput({
        message: i18n.t("enterTokenMint"),
        validate: validations.solanaAddress,
      });

      // Get quick sell options from config
      const config = this.services.swapHelper.getConfig();
      const customSellPercentages = config.customSellPercentages;

      if (customSellPercentages.length === 0) {
        console.log(`⚠️ ${i18n.t("noQuickSellPercentagesConfigured")}`);
        return;
      }

      // Select quick sell percentage
      const selectedPercentageIndex = await validateSelect({
        message: i18n.t("selectQuickSellPercentage"),
        choices: customSellPercentages.map(
          (percentage: number, index: number) => ({
            name: `${percentage * 100}%`,
            value: index,
          })
        ),
      });

      console.log(`\n${i18n.t("executingQuickSell")}...`);
      ConsoleUtils.showSpinner();

      const result = await this.services.swapHelper.quickSell(
        new PublicKey(tokenMint),
        selectedPercentageIndex
      );

      ConsoleUtils.hideSpinner();

      if (result.success) {
        console.log(`✅ ${i18n.t("quickSellSuccessful")}`);
        console.log(`${i18n.t("signature")}: ${result.signature}`);
        console.log(
          `${i18n.t("coinsReceived")}: ${result.amount?.toString() || "N/A"}`
        );
        console.log(
          `${i18n.t("actualSlippage")}: ${
            result.actualSlippageBps
              ? (result.actualSlippageBps / 100).toFixed(2)
              : "N/A"
          }%`
        );
      } else {
        console.log(`❌ ${i18n.t("quickSellFailed")}: ${result.error}`);
      }
    } catch (error) {
      ConsoleUtils.hideSpinner();
      throw error;
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async showSwapConfig(): Promise<void> {
    try {
      const config = this.services.swapHelper.getConfig();

      console.log(`\n📊 ${i18n.t("currentSwapConfig")}:`);

      console.log(`\n💱 ${i18n.t("slippageSettings")}:`);
      console.log(
        `${i18n.t("defaultSlippage")}: ${config.defaultSlippageBps} (${(
          config.defaultSlippageBps / 100
        ).toFixed(2)}%)`
      );
      console.log(
        `${i18n.t("maxSlippage")}: ${config.maxSlippageBps} (${(
          config.maxSlippageBps / 100
        ).toFixed(2)}%)`
      );
      console.log(
        `${i18n.t("autoSlippage")}: ${config.autoSlippage ? "✅" : "❌"}`
      );

      console.log(`\n⚡ ${i18n.t("priorityFeeSettings")}:`);
      console.log(`${i18n.t("defaultPriorityFee")}: ${config.buyPriorityFee}`);

      console.log(`\n🚀 ${i18n.t("jitoSettings")}:`);
      console.log(`${i18n.t("jitoTipAmount")}: ${config.jitoTipPercentile}`);

      console.log(`\n💰 ${i18n.t("quickAmounts")}:`);
      if (config.customBuyAmounts.length === 0) {
        console.log(`  ${i18n.t("noQuickAmountsConfigured")}`);
      } else {
        config.customBuyAmounts.forEach((amount: number, index: number) => {
          console.log(`  ${index + 1}. ${amount} SOL`);
        });
      }

      console.log(`\n📈 ${i18n.t("quickSellPercentages")}:`);
      if (config.customSellPercentages.length === 0) {
        console.log(`  ${i18n.t("noQuickSellPercentagesConfigured")}`);
      } else {
        config.customSellPercentages.forEach(
          (percentage: number, index: number) => {
            console.log(`  ${index + 1}. ${percentage * 100}%`);
          }
        );
      }
    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async updateSwapConfig(): Promise<void> {
    try {
      const configOption = await validateSelect({
        message: i18n.t("selectConfigToUpdate"),
        choices: [
          { name: i18n.t("updateSlippageSettings"), value: "slippage" },
          { name: i18n.t("updatePriorityFeeSettings"), value: "priorityFee" },
          { name: i18n.t("updateJitoSettings"), value: "jito" },
          { name: i18n.t("updateQuickAmounts"), value: "quickAmounts" },
          {
            name: i18n.t("updateQuickSellPercentages"),
            value: "quickSellPercentages",
          },
          { name: i18n.t("updateSafetySettings"), value: "safety" },
        ],
      });

      switch (configOption) {
        case "slippage":
          await this.updateSlippageSettings();
          break;
        case "priorityFee":
          await this.updatePriorityFeeSettings();
          break;
        case "jito":
          await this.updateJitoSettings();
          break;
        case "quickAmounts":
          await this.updateQuickAmounts();
          break;
        case "quickSellPercentages":
          await this.updateQuickSellPercentages();
          break;
        case "safety":
          await this.updateSafetySettings();
          break;
      }
    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async updateSlippageSettings(): Promise<void> {
    const defaultSlippageBps = await validateNumber({
      message: i18n.t("enterDefaultSlippage"),
      validate: (input: number | undefined) => {
        if (input === undefined) return i18n.t("validSlippage");
        return validations.slippage(input);
      },
    });

    const maxSlippageBps = await validateNumber({
      message: i18n.t("enterMaxSlippage"),
      validate: (input: number | undefined) => {
        if (input === undefined) return i18n.t("validSlippage");
        return validations.slippage(input);
      },
    });

    await this.services.swapHelper.updateConfig({
      defaultSlippageBps,
      maxSlippageBps,
    });

    console.log(`✅ ${i18n.t("slippageSettingsUpdated")}`);
  }

  private async updatePriorityFeeSettings(): Promise<void> {
    const buyPriorityFee = await validateNumber({
      message: i18n.t("enterDefaultPriorityFee"),
      validate: (input: number | undefined) => {
        if (input === undefined) return i18n.t("validNumberGreaterThanZero");
        return validations.positiveNumber(input);
      },
    });

    await this.services.swapHelper.updateConfig({
      buyPriorityFee,
      sellPriorityFee: buyPriorityFee,
    });

    console.log(`✅ ${i18n.t("priorityFeeSettingsUpdated")}`);
  }

  private async updateJitoSettings(): Promise<void> {
    const jitoTipPercentile = await validateSelect({
      message: i18n.t("selectJitoTipPercentile"),
      choices: [
        { name: "50th percentile", value: "landed_tips_50th_percentile" },
        { name: "75th percentile", value: "landed_tips_75th_percentile" },
        { name: "95th percentile", value: "landed_tips_95th_percentile" },
        { name: "99th percentile", value: "landed_tips_99th_percentile" },
      ],
    });

    await this.services.swapHelper.updateConfig({
      jitoTipPercentile,
    });

    console.log(`✅ ${i18n.t("jitoSettingsUpdated")}`);
  }

  private async updateQuickAmounts(): Promise<void> {
    console.log(`\n${i18n.t("updateQuickAmountsInstructions")}`);

    const customBuyAmounts = [];
    let addMore = true;

    while (addMore) {
      const amount = await validateNumber({
        message: i18n.t("enterQuickAmount"),
        validate: (input: number | undefined) => {
          if (input === undefined) return i18n.t("validNumberGreaterThanZero");
          return validations.positiveNumber(input);
        },
      });

      customBuyAmounts.push(amount);

      addMore = await validateSelect({
        message: i18n.t("addAnotherQuickAmount"),
        choices: [
          { name: i18n.t("yes"), value: true },
          { name: i18n.t("no"), value: false },
        ],
      });
    }

    await this.services.swapHelper.updateConfig({
      customBuyAmounts,
    });

    console.log(`✅ ${i18n.t("quickAmountsUpdated")}`);
  }

  private async updateQuickSellPercentages(): Promise<void> {
    console.log(`\n${i18n.t("updateQuickSellPercentagesInstructions")}`);

    const customSellPercentages = [];
    let addMore = true;

    while (addMore) {
      const percentage = await validateNumber({
        message: i18n.t("enterSellPercentage"),
        validate: (input: number | undefined) => {
          if (input === undefined) return i18n.t("validPercentage");
          if (input <= 0 || input > 100) {
            return i18n.t("validPercentage");
          }
          return true;
        },
      });

      customSellPercentages.push(percentage / 100); // Convert to decimal

      addMore = await validateSelect({
        message: i18n.t("addAnotherSellPercentage"),
        choices: [
          { name: i18n.t("yes"), value: true },
          { name: i18n.t("no"), value: false },
        ],
      });
    }

    await this.services.swapHelper.updateConfig({
      customSellPercentages,
    });

    console.log(`✅ ${i18n.t("quickSellPercentagesUpdated")}`);
  }

  // TODO:
  private async updateSafetySettings(): Promise<void> {
    const maxTransactionRetries = await validateNumber({
      message: i18n.t("enterMaxTransactionRetries"),
      validate: (input: number | undefined) => {
        if (input === undefined) return i18n.t("validNumberGreaterThanZero");
        if (input < 1 || input > 10) {
          return "Enter a number between 1 and 10";
        }
        return true;
      },
    });

    // Note: These properties don't exist in the current SwapConfig schema
    // but we'll keep the interface for future implementation
    console.log(`✅ ${i18n.t("safetySettingsUpdated")}`);
  }

  //////////////////////////////////////////////////////////////////////////////

  async getSwapHistory(): Promise<void> {
    try {
      console.log(`\n📜 ${i18n.t("swapHistory")}:`);

      const history = await this.services.swapHelper.getSwapHistory(20);

      if (history.length === 0) {
        console.log(`  ${i18n.t("noSwapHistory")}`);
        return;
      }

      history.forEach((swap, index) => {
        const date = new Date(swap.timestamp).toLocaleString();
        console.log(`\n${index + 1}. ${swap.type.toUpperCase()} - ${date}`);
        console.log(`   From: ${COIN_TYPE_NAME_MAP[swap.fromTokenMint]}`);
        console.log(`   Amount: ${swap.amount?.toString()}`);
        console.log(`   Token: ${swap.toTokenMint}`);
        console.log(`   ${swap.success ? "✅ Success" : "❌ Failed"}`);
        console.log(`   Signature: ${swap.signature}`);
        if (swap.slippageBps !== undefined) {
          console.log(`   Slippage: ${(swap.slippageBps / 100).toFixed(2)}%`);
        }
        if (swap.error) {
          console.log(`   Error: ${swap.error}`);
        }
      });
    } catch (error) {
      console.error(`❌ ${i18n.t("error")}: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  async cleanup(): Promise<void> {
    try {
      await this.services.swapHelper.gracefulShutdown();
    } catch (error) {
      console.error(`Error during SwapHelper cleanup: ${error}`);
    }
  }
}
