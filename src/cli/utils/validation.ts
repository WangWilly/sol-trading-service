import { input, select, number, checkbox } from "@inquirer/prompts";
import { PublicKey } from "@solana/web3.js";
import { i18n } from "../i18n";

////////////////////////////////////////////////////////////////////////////////

// Wrapper functions to handle validation re-prompting
export async function validateInput(options: {
  message: string;
  validate?: (input: string) => boolean | string;
}): Promise<string> {
  while (true) {
    try {
      return await input(options);
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`${i18n.t("error")}: ${error}`);
    }
  }
}

export async function validateNumber(options: {
  message: string;
  validate?: (input: number | undefined) => boolean | string;
  default?: number;
}): Promise<number> {
  while (true) {
    try {
      const res = await number(options);
      if (res !== undefined) {
        return res;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`${i18n.t("error")}: ${error}`);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

export async function validateSelect<T>(options: {
  message: string;
  choices: Array<{ name: string; value: T }>;
}): Promise<T> {
  while (true) {
    try {
      return await select(options);
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`${i18n.t("error")}: ${error}`);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

export async function validateCheckbox<T>(options: {
  message: string;
  choices: Choice<T>[];
  required: boolean;
}): Promise<T[]> {
  while (true) {
    try {
      return await checkbox(options);
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        // back to main menu
        throw new Error("ExitPromptError");
      }
      console.log(`${i18n.t("error")}: ${error}`);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

// Validation functions
export const validations = {
  solanaAddress: (input: string): boolean | string => {
    try {
      new PublicKey(input);
      return true;
    } catch (error) {
      return i18n.t("validSolanaAddress");
    }
  },

  strategyName: (input: string): boolean | string => {
    if (input.trim() !== "") {
      return true;
    }
    return i18n.t("strategyNameNotEmpty");
  },

  positiveNumber: (input: number | undefined): boolean | string => {
    if (input !== undefined && input > 0) {
      return true;
    }
    return i18n.t("validNumberGreaterThanZero");
  },

  basisPoints: (input: number | undefined): boolean | string => {
    if (input !== undefined && input > 0 && input <= 10000) {
      return true;
    }
    return i18n.t("validNumberBetween1And10000");
  },

  sellingBps: (input: number | undefined): boolean | string => {
    if (input !== undefined && input >= 0 && input <= 10000) {
      return true;
    }
    return i18n.t("validNumberBetween0And10000");
  }
};
