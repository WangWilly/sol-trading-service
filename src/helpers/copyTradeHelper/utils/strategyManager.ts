import type {
  CopyTradeRecord,
  CopyTradeRecordOnBuyStrategy,
  CopyTradeRecordOnSellStrategy,
  RecordMap,
  SubIdTarPubkeyMap,
} from "../dtos";
import type { Logger } from "../../../utils/logging";
import type { IStrategyPersistence } from "./persistence";

/**
 * Manages copy trade strategies with cleaner abstractions and persistence support
 */
export class StrategyManager {
  constructor(
    private readonly subIdTarPubkeyMap: SubIdTarPubkeyMap,
    private readonly recordMap: RecordMap,
    private readonly logger: Logger,
    private readonly persistence?: IStrategyPersistence,
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
  async addBuyStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnBuyStrategy,
  ): Promise<boolean> {
    const record = this.getOrCreateRecord(targetPublicKey);
    
    if (record.onBuyStrategiesMap.has(strategyName)) {
      this.logger.warn(`Buy strategy ${strategyName} already exists`);
      return false;
    }

    record.onBuyStrategiesMap.set(strategyName, strategy);
    
    // Auto-save after modification
    try {
      await this.saveStrategies();
    } catch (error) {
      this.logger.error(`Failed to auto-save after adding buy strategy: ${error}`);
      // Don't revert the change, just log the error
    }
    
    return true;
  }

  /**
   * Add or update a sell strategy
   */
  async addSellStrategy(
    targetPublicKey: string,
    strategyName: string,
    strategy: CopyTradeRecordOnSellStrategy,
  ): Promise<boolean> {
    const record = this.getOrCreateRecord(targetPublicKey);
    
    if (record.onSellStrategiesMap.has(strategyName)) {
      this.logger.warn(`Sell strategy ${strategyName} already exists`);
      return false;
    }

    record.onSellStrategiesMap.set(strategyName, strategy);
    
    // Auto-save after modification
    try {
      await this.saveStrategies();
    } catch (error) {
      this.logger.error(`Failed to auto-save after adding sell strategy: ${error}`);
      // Don't revert the change, just log the error
    }
    
    return true;
  }

  /**
   * Remove a buy strategy
   */
  async removeBuyStrategy(targetPublicKey: string, strategyName: string): Promise<boolean> {
    const record = this.recordMap.get(targetPublicKey);
    if (!record || !record.onBuyStrategiesMap.has(strategyName)) {
      this.logger.warn(`Buy strategy ${strategyName} not found`);
      return false;
    }

    record.onBuyStrategiesMap.delete(strategyName);
    this.cleanupEmptyRecord(targetPublicKey);
    
    // Auto-save after modification
    try {
      await this.saveStrategies();
    } catch (error) {
      this.logger.error(`Failed to auto-save after removing buy strategy: ${error}`);
      // Don't revert the change, just log the error
    }
    
    return true;
  }

  /**
   * Remove a sell strategy
   */
  async removeSellStrategy(targetPublicKey: string, strategyName: string): Promise<boolean> {
    const record = this.recordMap.get(targetPublicKey);
    if (!record || !record.onSellStrategiesMap.has(strategyName)) {
      this.logger.warn(`Sell strategy ${strategyName} not found`);
      return false;
    }

    record.onSellStrategiesMap.delete(strategyName);
    this.cleanupEmptyRecord(targetPublicKey);
    
    // Auto-save after modification
    try {
      await this.saveStrategies();
    } catch (error) {
      this.logger.error(`Failed to auto-save after removing sell strategy: ${error}`);
      // Don't revert the change, just log the error
    }
    
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

  /**
   * Load strategies from persistence if available
   */
  async loadStrategies(): Promise<void> {
    if (!this.persistence) {
      this.logger.debug("No persistence configured, skipping strategy loading");
      return;
    }

    try {
      const { recordMap } = await this.persistence.load();
      
      // Clear current data and load persisted data
      this.recordMap.clear();
      this.subIdTarPubkeyMap.clear();
      
      // Copy loaded data to current maps
      let recordCount = 0;
      for (const [key, value] of recordMap.entries()) {
        this.recordMap.set(key, value);
        recordCount += value.onBuyStrategiesMap.size + value.onSellStrategiesMap.size;
      }
      
      this.logger.info(`Loaded ${recordCount} records from persistence`);
    } catch (error) {
      this.logger.error(`Failed to load strategies from persistence: ${error}`);
      // Don't throw - allow application to continue with empty state
    }
  }

  /**
   * Save current strategies to persistence if available
   */
  async saveStrategies(): Promise<void> {
    if (!this.persistence) {
      this.logger.debug("No persistence configured, skipping strategy saving");
      return;
    }

    let recordCount = 0;
      for (const [_, value] of this.recordMap.entries()) {
        recordCount += value.onBuyStrategiesMap.size + value.onSellStrategiesMap.size;
      }

    try {
      await this.persistence.save(this.recordMap);
      this.logger.info(`Saved ${recordCount} records to persistence`);
    } catch (error) {
      this.logger.error(`Failed to save strategies to persistence: ${error}`);
      throw error; // Re-throw for graceful shutdown handling
    }
  }

  /**
   * Get persistence status
   */
  hasPersistence(): boolean {
    return this.persistence !== undefined;
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
