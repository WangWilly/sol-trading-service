import fs from "fs/promises";
import path from "path";
import type { Logger } from "../../../utils/logging";
import { SwapConfig, SwapHistoryEntry, SwapHelperData } from "../dtos";
import { ResultUtils } from "../../../utils/result";

////////////////////////////////////////////////////////////////////////////////

export interface SwapPersistence {
  save(data: SwapHelperData): Promise<void>;
  load(): Promise<SwapHelperData | null>;
  addHistoryEntry(entry: SwapHistoryEntry): Promise<void>;
  getHistory(limit?: number): Promise<SwapHistoryEntry[]>;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * JSON file-based persistence for SwapHelper data
 */
export class JsonSwapPersistence implements SwapPersistence {
  private data: SwapHelperData | null = null;

  constructor(
    private readonly filePath: string,
    private readonly logger: Logger
  ) {}

  /**
   * Save swap data to file
   */
  async save(data: SwapHelperData): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    const mkdirResult = await ResultUtils.wrap(
      fs.mkdir(dir, { recursive: true })
    );
    if (ResultUtils.isErr(mkdirResult)) {
      this.logger.error(`Failed to create directory: ${mkdirResult.error}`);
      throw mkdirResult.error;
    }

    // Convert data to JSON-serializable format
    const serializableResult = ResultUtils.wrapSync(() =>
      this.toSerializable(data)
    );
    if (ResultUtils.isErr(serializableResult)) {
      this.logger.error(
        `Failed to serialize data: ${serializableResult.error}`
      );
      throw serializableResult.error;
    }

    const writeResult = await ResultUtils.wrap(
      fs.writeFile(
        this.filePath,
        JSON.stringify(serializableResult.data, null, 2),
        "utf-8"
      )
    );

    if (ResultUtils.isErr(writeResult)) {
      this.logger.error(`Failed to save swap data: ${writeResult.error}`);
      throw writeResult.error;
    }

    this.data = data;
    this.logger.debug(`Swap data saved to ${this.filePath}`);
  }

  /**
   * Load swap data from file
   */
  async load(): Promise<SwapHelperData | null> {
    const readResult = await ResultUtils.wrap(
      fs.readFile(this.filePath, "utf-8")
    );

    if (ResultUtils.isErr(readResult)) {
      if ((readResult.error as any).code === "ENOENT") {
        this.logger.debug(`Swap data file not found: ${this.filePath}`);
        return null;
      }

      this.logger.error(`Failed to load swap data: ${readResult.error}`);
      throw readResult.error;
    }

    const parseResult = ResultUtils.wrapSync(() => JSON.parse(readResult.data));
    if (ResultUtils.isErr(parseResult)) {
      this.logger.error(`Failed to parse swap data: ${parseResult.error}`);
      throw parseResult.error;
    }

    const deserializeResult = ResultUtils.wrapSync(() =>
      this.fromSerializable(parseResult.data)
    );
    if (ResultUtils.isErr(deserializeResult)) {
      this.logger.error(
        `Failed to deserialize swap data: ${deserializeResult.error}`
      );
      throw deserializeResult.error;
    }

    this.data = deserializeResult.data;
    this.logger.debug(`Swap data loaded from ${this.filePath}`);

    return this.data;
  }

  /**
   * Add a history entry
   */
  async addHistoryEntry(entry: SwapHistoryEntry): Promise<void> {
    if (!this.data) {
      this.data = {
        config: {} as SwapConfig, // Will be set by SwapHelper
        history: [],
      };
    }

    this.data.history.unshift(entry); // Add to beginning

    // Keep only last 1000 entries
    if (this.data.history.length > 1000) {
      this.data.history = this.data.history.slice(0, 1000);
    }

    await this.save(this.data);
  }

  /**
   * Get swap history
   */
  async getHistory(limit: number = 50): Promise<SwapHistoryEntry[]> {
    if (!this.data) {
      const loaded = await this.load();
      if (!loaded) {
        return [];
      }
    }

    return this.data!.history.slice(0, limit);
  }

  /**
   * Convert data to JSON-serializable format
   */
  private toSerializable(data: SwapHelperData): any {
    return {
      config: data.config,
      history: data.history.map((entry) => ({
        ...entry,
        fromTokenMint: entry.fromTokenMint,
        toTokenMint: entry.toTokenMint,
        amount: entry.amount?.toString(),
        tokensReceived: entry.tokensReceived?.toString(),
        tokenAmount: entry.tokenAmount?.toString(),
        solReceived: entry.solReceived?.toString(),
      })),
    };
  }

  /**
   * Convert from JSON-serializable format back to data
   */
  private fromSerializable(serializable: any): SwapHelperData {
    const { BN } = require("bn.js");

    return {
      config: serializable.config,
      history: serializable.history.map((entry: any) => ({
        ...entry,
        solAmount: entry.solAmount ? new BN(entry.solAmount) : undefined,
        tokensReceived: entry.tokensReceived
          ? new BN(entry.tokensReceived)
          : undefined,
        tokenAmount: entry.tokenAmount ? new BN(entry.tokenAmount) : undefined,
        solReceived: entry.solReceived ? new BN(entry.solReceived) : undefined,
      })),
    };
  }
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Memory-only persistence for testing
 */
export class MemorySwapPersistence implements SwapPersistence {
  private data: SwapHelperData | null = null;

  constructor(private readonly logger: Logger) {}

  async save(data: SwapHelperData): Promise<void> {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.logger.debug("Swap data saved to memory");
  }

  async load(): Promise<SwapHelperData | null> {
    this.logger.debug("Swap data loaded from memory");
    return this.data ? JSON.parse(JSON.stringify(this.data)) : null;
  }

  async addHistoryEntry(entry: SwapHistoryEntry): Promise<void> {
    if (!this.data) {
      this.data = {
        config: {} as SwapConfig,
        history: [],
      };
    }

    this.data.history.unshift(entry);

    if (this.data.history.length > 1000) {
      this.data.history = this.data.history.slice(0, 1000);
    }
  }

  async getHistory(limit: number = 50): Promise<SwapHistoryEntry[]> {
    return this.data ? this.data.history.slice(0, limit) : [];
  }
}
