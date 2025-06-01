import { promises as fs } from "fs";
import path from "path";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import type {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
  RecordMap,
} from "../dtos";
import type { Logger } from "../../../utils/logging";

/**
 * Serializable version of strategy data for JSON persistence
 */
interface SerializableBuyStrategy {
  sellCoinType: string; // PublicKey as base58 string
  sellCoinAmount: string; // BN as string
  slippageBps: number;
  jitoTipPercentile: string;
  jitoTxFeeTipRatio: number;
}

interface SerializableSellStrategy {
  fixedSellingBps: number | null;
  slippageBps: number;
  jitoTipPercentile: string;
  jitoTxFeeTipRatio: number;
}

interface SerializableCopyTradeRecord {
  onBuyStrategiesMap: Record<string, SerializableBuyStrategy>;
  onSellStrategiesMap: Record<string, SerializableSellStrategy>;
}

interface SerializableStrategyData {
  recordMap: Record<string, SerializableCopyTradeRecord>;
  version: string;
  timestamp: string;
}

/**
 * Interface for strategy persistence
 */
export interface IStrategyPersistence {
  save(recordMap: RecordMap): Promise<void>;
  load(): Promise<{ recordMap: RecordMap; }>;
  exists(): Promise<boolean>;
}

/**
 * JSON file-based strategy persistence implementation
 */
export class JsonStrategyPersistence implements IStrategyPersistence {

  constructor(
    private readonly dataPath: string,
    private readonly logger?: Logger,
  ) {}

  async save(recordMap: RecordMap): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });

      // Convert Maps to serializable format
      const serializableData: SerializableStrategyData = {
        recordMap: this.serializeRecordMap(recordMap),
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      };

      // Write to file with pretty printing for readability
      await fs.writeFile(this.dataPath, JSON.stringify(serializableData, null, 2), "utf8");
      
      this.logger?.info(`Strategies saved to ${this.dataPath}`);
    } catch (error) {
      this.logger?.error(`Failed to save strategies: ${error}`);
      throw new Error(`Failed to save strategies: ${error}`);
    }
  }

  async load(): Promise<{ recordMap: RecordMap }> {
    try {
      const fileExists = await this.exists();
      if (!fileExists) {
        this.logger?.info("No strategy file found, starting with empty strategies");
        return {
          recordMap: new Map()
        };
      }

      const fileContent = await fs.readFile(this.dataPath, "utf8");
      const data: SerializableStrategyData = JSON.parse(fileContent);

      // Validate version compatibility
      if (!data.version || data.version !== "1.0.0") {
        this.logger?.warn(`Strategy file version ${data.version} may not be compatible`);
      }

      const recordMap = this.deserializeRecordMap(data.recordMap);

      this.logger?.info(`Strategies loaded from ${this.dataPath} (saved at: ${data.timestamp})`);
      return { recordMap };
    } catch (error) {
      this.logger?.error(`Failed to load strategies: ${error}`);
      throw new Error(`Failed to load strategies: ${error}`);
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.dataPath);
      return true;
    } catch {
      return false;
    }
  }

  private serializeRecordMap(recordMap: RecordMap): Record<string, SerializableCopyTradeRecord> {
    const result: Record<string, SerializableCopyTradeRecord> = {};

    for (const [targetPubkey, record] of recordMap.entries()) {
      const onBuyStrategiesMap: Record<string, SerializableBuyStrategy> = {};
      const onSellStrategiesMap: Record<string, SerializableSellStrategy> = {};

      // Serialize buy strategies
      for (const [strategyName, strategy] of record.onBuyStrategiesMap.entries()) {
        onBuyStrategiesMap[strategyName] = {
          sellCoinType: strategy.sellCoinType.toBase58(),
          sellCoinAmount: strategy.sellCoinAmount.toString(),
          slippageBps: strategy.slippageBps,
          jitoTipPercentile: strategy.jitoTipPercentile,
          jitoTxFeeTipRatio: strategy.jitoTxFeeTipRatio,
        };
      }

      // Serialize sell strategies
      for (const [strategyName, strategy] of record.onSellStrategiesMap.entries()) {
        onSellStrategiesMap[strategyName] = {
          fixedSellingBps: strategy.fixedSellingBps,
          slippageBps: strategy.slippageBps,
          jitoTipPercentile: strategy.jitoTipPercentile,
          jitoTxFeeTipRatio: strategy.jitoTxFeeTipRatio,
        };
      }

      result[targetPubkey] = {
        onBuyStrategiesMap,
        onSellStrategiesMap,
      };
    }

    return result;
  }

  private deserializeRecordMap(data: Record<string, SerializableCopyTradeRecord>): RecordMap {
    const recordMap = new Map<string, CopyTradeRecord>();

    for (const [targetPubkey, serializableRecord] of Object.entries(data)) {
      const onBuyStrategiesMap = new Map<string, CopyTradeRecordOnBuyStrategy>();
      const onSellStrategiesMap = new Map<string, CopyTradeRecordOnSellStrategy>();

      // Deserialize buy strategies
      for (const [strategyName, strategy] of Object.entries(serializableRecord.onBuyStrategiesMap)) {
        onBuyStrategiesMap.set(strategyName, {
          sellCoinType: new PublicKey(strategy.sellCoinType),
          sellCoinAmount: new BN(strategy.sellCoinAmount),
          slippageBps: strategy.slippageBps,
          jitoTipPercentile: strategy.jitoTipPercentile,
          jitoTxFeeTipRatio: strategy.jitoTxFeeTipRatio,
        });
      }

      // Deserialize sell strategies
      for (const [strategyName, strategy] of Object.entries(serializableRecord.onSellStrategiesMap)) {
        onSellStrategiesMap.set(strategyName, {
          fixedSellingBps: strategy.fixedSellingBps,
          slippageBps: strategy.slippageBps,
          jitoTipPercentile: strategy.jitoTipPercentile,
          jitoTxFeeTipRatio: strategy.jitoTxFeeTipRatio,
        });
      }

      recordMap.set(targetPubkey, {
        onBuyStrategiesMap,
        onSellStrategiesMap,
      });
    }

    return recordMap;
  }
}
