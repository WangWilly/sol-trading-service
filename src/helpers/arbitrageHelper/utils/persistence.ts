import fs from "fs";
import path from "path";
import type { Logger } from "../../../utils/logging";
import { ArbitrageHelperData, ArbitrageConfig, ArbitrageStats, ArbitrageHistoryEntry } from "../dtos";

////////////////////////////////////////////////////////////////////////////////
// Arbitrage Persistence Interface
////////////////////////////////////////////////////////////////////////////////

export interface IArbitragePersistence {
  saveData(data: ArbitrageHelperData): Promise<void>;
  loadData(): Promise<ArbitrageHelperData | null>;
  deleteData(): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
// JSON File Persistence Implementation
////////////////////////////////////////////////////////////////////////////////

export class JsonArbitragePersistence implements IArbitragePersistence {
  private readonly dataDir: string;
  private readonly configFile: string;

  constructor(
    private readonly logger: Logger,
    baseDir: string = process.cwd()
  ) {
    this.dataDir = path.join(baseDir, "data", "arbitrage");
    this.configFile = path.join(this.dataDir, "arbitrage-data.json");
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      this.logger.debug(`Created arbitrage data directory: ${this.dataDir}`);
    }
  }

  async saveData(data: ArbitrageHelperData): Promise<void> {
    try {
      // Convert BN instances to strings for JSON serialization
      const serializedData = this.serializeData(data);
      
      fs.writeFileSync(this.configFile, JSON.stringify(serializedData, null, 2));
      this.logger.debug("Arbitrage data saved successfully");
    } catch (error) {
      this.logger.error(`Failed to save arbitrage data: ${error}`);
      throw error;
    }
  }

  async loadData(): Promise<ArbitrageHelperData | null> {
    try {
      if (!fs.existsSync(this.configFile)) {
        this.logger.debug("No arbitrage data file found");
        return null;
      }

      const fileContent = fs.readFileSync(this.configFile, "utf-8");
      const parsedData = JSON.parse(fileContent);
      
      // Convert string values back to BN instances
      const deserializedData = this.deserializeData(parsedData);
      
      this.logger.debug("Arbitrage data loaded successfully");
      return deserializedData;
    } catch (error) {
      this.logger.error(`Failed to load arbitrage data: ${error}`);
      return null;
    }
  }

  async deleteData(): Promise<void> {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
        this.logger.debug("Arbitrage data deleted successfully");
      }
    } catch (error) {
      this.logger.error(`Failed to delete arbitrage data: ${error}`);
      throw error;
    }
  }

  private serializeData(data: ArbitrageHelperData): any {
    return {
      config: {
        ...data.config,
        tokenA: data.config.tokenA.toBase58(),
        tokenB: data.config.tokenB.toBase58(),
        tradeAmount: data.config.tradeAmount.toString(),
      },
      stats: {
        ...data.stats,
        totalProfit: data.stats.totalProfit.toString(),
      },
      history: data.history.map(entry => ({
        ...entry,
        opportunity: {
          ...entry.opportunity,
          path1: {
            ...entry.opportunity.path1,
            fromMint: entry.opportunity.path1.fromMint.toBase58(),
            toMint: entry.opportunity.path1.toMint.toBase58(),
            inputAmount: entry.opportunity.path1.inputAmount.toString(),
            expectedOutput: entry.opportunity.path1.expectedOutput.toString(),
          },
          path2: {
            ...entry.opportunity.path2,
            fromMint: entry.opportunity.path2.fromMint.toBase58(),
            toMint: entry.opportunity.path2.toMint.toBase58(),
            inputAmount: entry.opportunity.path2.inputAmount.toString(),
            expectedOutput: entry.opportunity.path2.expectedOutput.toString(),
          },
          estimatedProfitAmount: entry.opportunity.estimatedProfitAmount.toString(),
        },
        result: {
          ...entry.result,
          profit: entry.result.profit?.toString(),
        },
      })),
    };
  }

  private deserializeData(data: any): ArbitrageHelperData {
    const BN = require("bn.js");
    const { PublicKey } = require("@solana/web3.js");

    return {
      config: {
        ...data.config,
        tokenA: new PublicKey(data.config.tokenA),
        tokenB: new PublicKey(data.config.tokenB),
        tradeAmount: new BN(data.config.tradeAmount),
      },
      stats: {
        ...data.stats,
        totalProfit: new BN(data.stats.totalProfit),
      },
      history: data.history.map((entry: any) => ({
        ...entry,
        opportunity: {
          ...entry.opportunity,
          path1: {
            ...entry.opportunity.path1,
            fromMint: new PublicKey(entry.opportunity.path1.fromMint),
            toMint: new PublicKey(entry.opportunity.path1.toMint),
            inputAmount: new BN(entry.opportunity.path1.inputAmount),
            expectedOutput: new BN(entry.opportunity.path1.expectedOutput),
          },
          path2: {
            ...entry.opportunity.path2,
            fromMint: new PublicKey(entry.opportunity.path2.fromMint),
            toMint: new PublicKey(entry.opportunity.path2.toMint),
            inputAmount: new BN(entry.opportunity.path2.inputAmount),
            expectedOutput: new BN(entry.opportunity.path2.expectedOutput),
          },
          estimatedProfitAmount: new BN(entry.opportunity.estimatedProfitAmount),
        },
        result: {
          ...entry.result,
          profit: entry.result.profit ? new BN(entry.result.profit) : undefined,
        },
      })),
    };
  }
}
