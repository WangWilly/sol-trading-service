import { TsLogger, TsLogLogger } from "./utils/logging";
import {
  PRIVATE_KEY_BASE58,
  LOG_TYPE,
  NOT_USE_CLI,
  ENABLE_PERSISTENCE,
  PERSISTENCE_DATA_PATH,
} from "./config";
import {
  LogHistoryHelper,
  transportFunc,
} from "./helpers/logHistoryHelper/helper";
import {
  SOLANA_RPC_HTTP_URL,
  SOLANA_RPC_WS_URL,
  FEE_DESTINATION_PUBKEY,
  JUPITER_API_URL,
  JITO_BLOCK_ENGINE_URL,
  JITO_BUNDLES_URL,
  FEE_AMOUNT,
} from "./utils/constants";

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { loadPrivateKeyBase58 } from "./utils/privateKey";

import { SolRpcWsHelper } from "./helpers/solRpcWsClient/client";
import { JupSwapClient } from "./helpers/3rdParties/jup";
import { JitoClient } from "./helpers/3rdParties/jito";

import { CopyTradeHelper } from "./helpers/copyTradeHelper";
import { SolRpcWsSubscribeManager } from "./helpers/solRpcWsSubscribeManager";
import { FeeHelper } from "./helpers/feeHelper/helper";
import { SwapHelper } from "./helpers/swapHelper";
import { ArbitrageHelper } from "./helpers/arbitrageHelper";

////////////////////////////////////////////////////////////////////////////////

// Export the initialization function for CLI usage
export async function initializeCopyTradingService(
  playerKeypair: Keypair,
  rootLogger?: TsLogger,
): Promise<{
  solWeb3Conn: Connection;
  copyTradeHelper: CopyTradeHelper;
  solRpcWsHelper: SolRpcWsHelper;
  solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
  jupSwapClient: JupSwapClient;
  jitoClient: JitoClient;
}> {
  if (!rootLogger) {
    LogHistoryHelper.loadLogHistory();
    rootLogger = new TsLogLogger({
      name: "copy-trade-service",
      type: LOG_TYPE,
      overwrite: {
        transportJSON: NOT_USE_CLI
          ? undefined
          : (json: unknown) => {
              transportFunc(json);
            },
      },
    });
  }

  //////////////////////////////////////////////////////////////////////////////

  const solWeb3Conn = new Connection(SOLANA_RPC_HTTP_URL);
  const jupSwapClient = new JupSwapClient(
    JUPITER_API_URL,
    "",
    rootLogger.getSubLogger({ name: "JupSwapClient" })
  );
  const jitoClient = new JitoClient(
    JITO_BLOCK_ENGINE_URL,
    JITO_BUNDLES_URL,
    "",
    rootLogger.getSubLogger({ name: "JitoClient" })
  );
  const feeHelper = new FeeHelper(
    FEE_AMOUNT,
    new PublicKey(FEE_DESTINATION_PUBKEY)
  );
  const copyTradeHelper = new CopyTradeHelper(
    playerKeypair,
    solWeb3Conn,
    jupSwapClient,
    jitoClient,
    feeHelper,
    rootLogger.getSubLogger({ name: "CopyTradeHelper" }),
    ENABLE_PERSISTENCE,
    PERSISTENCE_DATA_PATH
  );

  // Initialize the copy trade helper (loads persisted strategies)
  await copyTradeHelper.initialize();
  const solRpcWsHelper = new SolRpcWsHelper(
    SOLANA_RPC_WS_URL,
    copyTradeHelper,
    rootLogger.getSubLogger({ name: "SolRpcWsHelper" })
  );
  const solRpcWsSubscribeManager = new SolRpcWsSubscribeManager(
    solRpcWsHelper,
    copyTradeHelper,
    rootLogger.getSubLogger({ name: "SolRpcWsSubscribeHelper" })
  );
  solRpcWsHelper.start();

  // Return service components
  return {
    solWeb3Conn,
    copyTradeHelper,
    solRpcWsHelper,
    solRpcWsSubscribeManager,
    jupSwapClient,
    jitoClient,
  };
}

// Export the initialization function for CLI usage with all required services
export async function initializeAllServices(playerKeypair: Keypair): Promise<{
  solWeb3Conn: Connection;
  copyTradeHelper: CopyTradeHelper;
  solRpcWsHelper: SolRpcWsHelper;
  solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
  jupSwapClient: JupSwapClient;
  jitoClient: JitoClient;
  feeHelper: FeeHelper;
  swapHelper: SwapHelper;
  arbitrageHelper: ArbitrageHelper;
}> {
  // Create logger for SwapExecutor
  LogHistoryHelper.loadLogHistory();
  const rootLogger = new TsLogLogger({
    name: "copy-trade-service",
    type: LOG_TYPE,
    overwrite: {
      transportJSON: NOT_USE_CLI
        ? undefined
        : (json: unknown) => {
            transportFunc(json);
          },
    },
  });

  const baseServices = await initializeCopyTradingService(
    playerKeypair,
    rootLogger
  );

  // Create FeeHelper
  const feeHelper = new FeeHelper(
    FEE_AMOUNT,
    new PublicKey(FEE_DESTINATION_PUBKEY)
  );

  const swapHelper = new SwapHelper(
    playerKeypair,
    baseServices.solWeb3Conn,
    baseServices.jupSwapClient,
    baseServices.jitoClient,
    feeHelper,
    rootLogger.getSubLogger({ name: "SwapHelper" }),
    {
      jitoTipPercentile: "landed_tips_95th_percentile",
      defaultSlippageBps: 100,
      minSlippageBps: 50,
      maxSlippageBps: 1000,
      autoSlippage: true,
      sandwichMode: false,
      sandwichSlippageBps: 300,
      buyPriorityFee: 0.0001,
      sellPriorityFee: 0.0001,
      customBuyAmounts: [0.05, 0.1, 0.5, 1, 3],
      customSellPercentages: [0.25, 0.5, 0.75, 1.0],
    }
  );

  // Create ArbitrageHelper
  const arbitrageHelper = new ArbitrageHelper(
    baseServices.solWeb3Conn,
    playerKeypair,
    baseServices.jupSwapClient,
    baseServices.jitoClient,
    feeHelper,
    rootLogger.getSubLogger({ name: "ArbitrageHelper" }),
  );

  // Initialize ArbitrageHelper
  await arbitrageHelper.initialize();

  return {
    ...baseServices,
    feeHelper,
    swapHelper,
    arbitrageHelper,
  };
}

// If file is run directly (not imported), start the service
if (require.main === module) {
  async function main(): Promise<void> {
    const playerKeypair = loadPrivateKeyBase58(PRIVATE_KEY_BASE58);
    const { copyTradeHelper, solRpcWsSubscribeManager } =
      await initializeCopyTradingService(playerKeypair);

    //////////////////////////////////////////////////////////////////////////////

    // Example usage (commented out)
    // solRpcWsSubscribeManager.createCopyTradeRecordOnBuyStrategy(
    //   "Ey2zXiwP4Kaytz76e28TfhYx2n8QWx4KajmoZK1w623C",
    //   "OnBuyTest",
    //   CopyTradeRecordOnBuyStrategySchema.parse({
    //     sellCoinType: COIN_TYPE_WSOL_MINT,
    //     sellCoinAmount: new BN(1_000),
    //     slippageBps: 100,
    //   })
    // );
    // solRpcWsSubscribeManager.createCopyTradeRecordOnSellStrategy(
    //   "Ey2zXiwP4Kaytz76e28TfhYx2n8QWx4KajmoZK1w623C",
    //   "OnSellTest",
    //   CopyTradeRecordOnSellStrategySchema.parse({
    //     fixedSellingBps: 500,
    //     slippageBps: 100,
    //   })
    // );

    //////////////////////////////////////////////////////////////////////////////

    // https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357
    const exitFunc = async (): Promise<void> => {
      try {
        // Save strategies before shutting down
        await copyTradeHelper.gracefulShutdown();
        await solRpcWsSubscribeManager.gracefulStop();
        process.exit(0);
      } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    };
    process.on("SIGTERM", async () => {
      await exitFunc();
    });
    process.on("SIGINT", async () => {
      await exitFunc();
    });
  }

  main();
}
