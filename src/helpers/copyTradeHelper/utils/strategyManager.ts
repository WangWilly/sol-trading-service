import type {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
  RecordMap,
  SubIdTarPubkeyMap,
} from "../dtos";
import type { Logger } from "../../../utils/logging";

/**
 * Manages copy trade strategies with cleaner abstractions
 */
export class StrategyManager {
  constructor(
    private readonly subIdTarPubkeyMap: SubIdTarPubkeyMap,
    private readonly recordMap: RecordMap,
    private readonly logger: Logger,
  ) {}

  /**
   * Get copy trade record for a given subId
   */
  getCopyTradeRecord(subId: number): CopyTradeRecord | null {
    const targetPublicKey = this.subIdTarPubkeyMap.get(subId);
    if (!targetPublicKey) {
      return null;
    }
    return this.recordMap.get(targetPublicKey) || null;
  }

  /**
   * Add or update a buy strategy
   */
  addBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy,
  ): boolean {
    const record = this.getOrCreateRecord(targetPublicKey);
    
    if (record.onBuyStrategiesMap.has(strategyName)) {
      this.logger.warn(`Buy strategy ${strategyName} already exists`);
      return false;
    }

    record.onBuyStrategiesMap.set(strategyName, strategy);
    return true;
  }

  /**
   * Add or update a sell strategy
   */
  addSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy,
  ): boolean {
    const record = this.getOrCreateRecord(targetPublicKey);
    
    if (record.onSellStrategiesMap.has(strategyName)) {
      this.logger.warn(`Sell strategy ${strategyName} already exists`);
      return false;
    }

    record.onSellStrategiesMap.set(strategyName, strategy);
    return true;
  }

  /**
   * Remove a buy strategy
   */
  removeBuyStrategy(targetPublicKey: string, strategyName: string): boolean {
    const record = this.recordMap.get(targetPublicKey);
    if (!record || !record.onBuyStrategiesMap.has(strategyName)) {
      this.logger.warn(`Buy strategy ${strategyName} not found`);
      return false;
    }

    record.onBuyStrategiesMap.delete(strategyName);
    this.cleanupEmptyRecord(targetPublicKey);
    return true;
  }

  /**
   * Remove a sell strategy
   */
  removeSellStrategy(targetPublicKey: string, strategyName: string): boolean {
    const record = this.recordMap.get(targetPublicKey);
    if (!record || !record.onSellStrategiesMap.has(strategyName)) {
      this.logger.warn(`Sell strategy ${strategyName} not found`);
      return false;
    }

    record.onSellStrategiesMap.delete(strategyName);
    this.cleanupEmptyRecord(targetPublicKey);
    return true;
  }

  /**
   * Register a subscription mapping
   */
  registerSubscription(subId: number, targetPublicKey: string): void {
    if (this.subIdTarPubkeyMap.has(subId)) {
      this.logger.debug(`SubId ${subId} already exists`);
      return;
    }
    
    this.logger.debug(`Registering subId ${subId} with target ${targetPublicKey}`);
    this.subIdTarPubkeyMap.set(subId, targetPublicKey);
  }

  /**
   * Get all target public keys
   */
  getTargetPublicKeys(): string[] {
    return Array.from(this.recordMap.keys());
  }

  /**
   * Clear all records
   */
  clearAll(): void {
    this.recordMap.clear();
    this.subIdTarPubkeyMap.clear();
  }

  private getOrCreateRecord(targetPublicKey: string): CopyTradeRecord {
    let record = this.recordMap.get(targetPublicKey);
    if (!record) {
      record = {
        onBuyStrategiesMap: new Map(),
        onSellStrategiesMap: new Map(),
      };
      this.recordMap.set(targetPublicKey, record);
    }
    return record;
  }

  private cleanupEmptyRecord(targetPublicKey: string): void {
    const record = this.recordMap.get(targetPublicKey);
    if (
      record &&
      record.onBuyStrategiesMap.size === 0 &&
      record.onSellStrategiesMap.size === 0
    ) {
      this.recordMap.delete(targetPublicKey);
      // Remove from subscription map
      for (const [subId, target] of this.subIdTarPubkeyMap.entries()) {
        if (target === targetPublicKey) {
          this.subIdTarPubkeyMap.delete(subId);
        }
      }
    }
  }
}
