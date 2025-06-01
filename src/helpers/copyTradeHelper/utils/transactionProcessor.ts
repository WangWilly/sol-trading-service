import { Connection, Logs } from "@solana/web3.js";
import type { Logger } from "../../../utils/logging";
import { safe } from "../../../utils/exceptions";
import { COMMON_DEX_REGEX } from "../const";
import * as txHelper from "../../transactionHelper";

export interface TransactionProcessingResult {
  swapInfo: txHelper.SwapInfoDto;
  isValid: boolean;
}

/**
 * Processes and validates Solana transactions for copy trading
 */
export class TransactionProcessor {
  constructor(
    private readonly connection: Connection,
    private readonly logger: Logger,
  ) {}

  /**
   * Process logs from Solana WebSocket and extract swap information
   */
  async processLogs(
    subId: number,
    logs: Logs,
  ): Promise<TransactionProcessingResult | null> {
    // Validate transaction success
    if (logs.err) {
      return null;
    }

    // Check if it's a swap transaction
    if (!this.isSwapTransaction(logs.logs)) {
      return null;
    }

    // Get detailed transaction information
    const txDetails = await this.getTransactionDetails(logs.signature);
    if (!txDetails) {
      return null;
    }

    // Convert to swap info
    const swapInfoResult = await this.extractSwapInfo(subId, logs.signature, txDetails);
    if (!swapInfoResult) {
      return null;
    }

    // Validate SOL involvement
    if (!swapInfoResult.fromSol && !swapInfoResult.toSol) {
      this.logger.warn(
        `No SOL involved in swap: ${logs.signature}`,
      );
      return null;
    }

    return {
      swapInfo: swapInfoResult,
      isValid: true,
    };
  }

  private isSwapTransaction(logs: string[]): boolean {
    return logs.some((log) => COMMON_DEX_REGEX.test(log));
  }

  private async getTransactionDetails(signature: string) {
    const txRes = await safe(
      this.connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }),
    );

    if (!txRes.success) {
      this.logger.debug(`Failed to get transaction: ${signature}`);
      return null;
    }

    if (!txRes.data) {
      this.logger.debug(`Transaction data not found: ${signature}`);
      return null;
    }

    return txRes.data;
  }

  private async extractSwapInfo(
    subId: number,
    signature: string,
    txData: any,
  ): Promise<txHelper.SwapInfoDto | null> {
    const swapInfoRes = await safe(
      txHelper.toSwapInfoDto(this.connection, subId, signature, txData),
    );

    if (!swapInfoRes.success) {
      this.logger.error(
        `Failed to extract swap info: ${signature}, ${swapInfoRes.error}`,
      );
      return null;
    }

    return swapInfoRes.data;
  }
}
