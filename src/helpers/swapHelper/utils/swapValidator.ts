import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { Logger } from "../../../utils/logging";

import { SwapConfig, BuyParams, SellParams } from "../dtos";
import {
  COIN_TYPE_USDC_MINT,
  COIN_TYPE_USDT_MINT,
  COIN_TYPE_WSOL_MINT,
} from "../../../utils/constants";
import { ResultUtils } from "../../../utils/result";

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates swap parameters and calculates optimal slippage
 */
export class SwapValidator {
  constructor(
    private readonly connection: Connection,
    private readonly config: SwapConfig,
    private readonly logger: Logger
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Validate buy parameters
   */
  validateBuyParams(params: BuyParams): { valid: boolean; error?: string } {
    // Check if token mint is valid
    if (!PublicKey.isOnCurve(params.toTokenMint)) {
      return { valid: false, error: "Invalid token mint address" };
    }

    // Check if amount is reasonable
    if (params.amount.lte(new BN(0))) {
      return { valid: false, error: "Amount must be greater than 0" };
    }

    switch (params.fromTokenMint.toBase58()) {
      case COIN_TYPE_WSOL_MINT.toBase58(): {
        // Check if SOL amount is not too small (minimum 0.001 SOL)
        const minSolAmount = new BN(1_000_000); // 0.001 SOL in lamports
        if (params.amount.lt(minSolAmount)) {
          return {
            valid: false,
            error: "SOL amount too small (minimum 0.001 SOL)",
          };
        }

        // Check if SOL amount is not too large (maximum 1000 SOL)
        const maxSolAmount = new BN(1000_000_000_000); // 1000 SOL in lamports
        if (params.amount.gt(maxSolAmount)) {
          return {
            valid: false,
            error: "SOL amount too large (maximum 1000 SOL)",
          };
        }

        // Validate slippage if provided
        if (params.slippageBps !== undefined) {
          const slippageValid = this.validateSlippage(params.slippageBps);
          if (!slippageValid.valid) {
            return slippageValid;
          }
        }

        break;
      }

      case COIN_TYPE_USDC_MINT.toBase58():
      case COIN_TYPE_USDT_MINT.toBase58(): {
        // Check if USDC/USDT amount is not too small (minimum 0.01 USDC/USDT)
        const minUsdcAmount = new BN(1_000_000); // 0.01 USDC/USDT in smallest unit
        if (params.amount.lt(minUsdcAmount)) {
          return {
            valid: false,
            error: "USDC/USDT amount too small (minimum 0.01 USDC/USDT)",
          };
        }
        // Check if USDC/USDT amount is not too large (maximum 1,000,000 USDC/USDT)
        const maxUsdcAmount = new BN(1_000_000_000_000); // 1,000,000 USDC/USDT in smallest unit
        if (params.amount.gt(maxUsdcAmount)) {
          return {
            valid: false,
            error: "USDC/USDT amount too large (maximum 1,000,000 USDC/USDT)",
          };
        }
        // Validate slippage if provided
        if (params.slippageBps !== undefined) {
          const slippageValid = this.validateSlippage(params.slippageBps);
          if (!slippageValid.valid) {
            return slippageValid;
          }
        }
        break;
      }
    }

    return { valid: true };
  }

  /**
   * Validate sell parameters
   */
  validateSellParams(params: SellParams): { valid: boolean; error?: string } {
    // Check if token mint is valid
    if (!PublicKey.isOnCurve(params.fromTokenMint)) {
      return { valid: false, error: "Invalid token mint address" };
    }

    // Check if percentage is valid
    if (params.percentage !== undefined) {
      if (params.percentage <= 0 || params.percentage > 1) {
        return { valid: false, error: "Percentage must be between 0 and 1" };
      }
    }

    // Check if token amount is valid
    if (params.tokenAmount.lte(new BN(0))) {
      return { valid: false, error: "Token amount must be greater than 0" };
    }

    // Validate slippage if provided
    if (params.slippageBps !== undefined) {
      const slippageValid = this.validateSlippage(params.slippageBps);
      if (!slippageValid.valid) {
        return slippageValid;
      }
    }

    return { valid: true };
  }

  /**
   * Validate slippage value
   */
  validateSlippage(slippageBps: number): { valid: boolean; error?: string } {
    if (slippageBps < 0) {
      return { valid: false, error: "Slippage cannot be negative" };
    }

    if (slippageBps > 10000) {
      return { valid: false, error: "Slippage cannot exceed 100%" };
    }

    if (slippageBps < this.config.minSlippageBps) {
      return {
        valid: false,
        error: `Slippage too low (minimum ${
          this.config.minSlippageBps / 100
        }%)`,
      };
    }

    if (slippageBps > this.config.maxSlippageBps) {
      return {
        valid: false,
        error: `Slippage too high (maximum ${
          this.config.maxSlippageBps / 100
        }%)`,
      };
    }

    return { valid: true };
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Calculate optimal slippage for a swap
   */
  calculateSlippage(params: {
    customSlippageBps?: number;
    fromMint: PublicKey;
    toMint: PublicKey;
    amount: BN;
  }): number {
    // Use custom slippage if specified
    if (params.customSlippageBps !== undefined) {
      return Math.max(
        this.config.minSlippageBps,
        Math.min(this.config.maxSlippageBps, params.customSlippageBps)
      );
    }

    // Use sandwich protection mode if enabled
    if (this.config.sandwichMode) {
      return this.config.sandwichSlippageBps;
    }

    // Use auto slippage if enabled
    if (this.config.autoSlippage) {
      return this.calculateAutoSlippage(params);
    }

    // Fall back to default slippage
    return this.config.defaultSlippageBps;
  }

  /**
   * Calculate automatic slippage based on market conditions
   */
  private calculateAutoSlippage(params: {
    fromMint: PublicKey;
    toMint: PublicKey; // TODO: Use this in future for more complex logic
    amount: BN;
  }): number {
    // Basic auto slippage logic
    // In a real implementation, this would analyze:
    // - Token liquidity
    // - Recent price volatility
    // - Trade size impact
    // - Current market conditions

    let slippageBps = this.config.defaultSlippageBps;

    // Increase slippage for larger trades
    switch (params.fromMint.toBase58()) {
      case COIN_TYPE_WSOL_MINT.toBase58(): {
        // Large trades (>10 SOL) get higher slippage
        if (params.amount.gt(new BN(10_000_000_000))) {
          // 10 SOL
          slippageBps = Math.min(slippageBps * 2, this.config.maxSlippageBps);
        }
        // Medium trades (>1 SOL) get slightly higher slippage
        else if (params.amount.gt(new BN(1_000_000_000))) {
          // 1 SOL
          slippageBps = Math.min(slippageBps * 1.5, this.config.maxSlippageBps);
        }
        break;
      }
      case COIN_TYPE_USDT_MINT.toBase58():
      case COIN_TYPE_USDC_MINT.toBase58(): {
        // For USDT/USDC, we might want to apply different logic
        // For simplicity, let's assume similar logic as SOL
        if (params.amount.gt(new BN(10_000_000_000))) {
          slippageBps = Math.min(slippageBps * 2, this.config.maxSlippageBps);
        } else if (params.amount.gt(new BN(1_000_000_000))) {
          slippageBps = Math.min(slippageBps * 1.5, this.config.maxSlippageBps);
        }
        break;
      }
    }

    // Ensure slippage is within bounds
    return Math.max(
      this.config.minSlippageBps,
      Math.min(this.config.maxSlippageBps, slippageBps)
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get priority fee for a swap
   */
  getPriorityFee(isBuy: boolean, customFee?: number): number {
    if (customFee !== undefined) {
      return customFee;
    }

    return isBuy ? this.config.buyPriorityFee : this.config.sellPriorityFee;
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Check if token mint is likely to be a scam/honeypot
   * This is a basic implementation - in production you'd want more sophisticated checks
   */
  async isTokenSafe(
    tokenMint: PublicKey
  ): Promise<{ safe: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check if mint account exists
    const mintInfo = await ResultUtils.wrap(
      this.connection.getAccountInfo(tokenMint)
    );
    if (ResultUtils.isErr(mintInfo)) {
      this.logger.error(
        `Failed to fetch mint info for ${tokenMint.toBase58()}: ${
          mintInfo.error
        }`
      );
      warnings.push("Failed to fetch token mint account");
      return { safe: false, warnings };
    }
    if (!mintInfo.data) {
      warnings.push("Token mint account not found");
      return { safe: false, warnings };
    }

    // Basic checks - in production you'd want more comprehensive analysis
    // - Check mint authority (is it renounced?)
    // - Check freeze authority
    // - Check supply
    // - Check liquidity pools
    // - Check for known scam patterns

    this.logger.debug(
      `Token safety check for ${tokenMint.toBase58()}: basic checks passed`
    );

    return { safe: true, warnings };
  }
}
