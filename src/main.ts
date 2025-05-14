import { TsLogLogger } from "./utils/logging";
import { PRIVATE_KEY_BASE58, LOG_TYPE, NOT_USE_CLI } from "./config";
import { transportFunc } from "./helpers/logHistoryHelper/helper";
import { 
  SOLANA_RPC_HTTP_URL, 
  SOLANA_RPC_WS_URL, 
  FEE_DESTINATION_PUBKEY,
  JUPITER_API_URL,
  JITO_BLOCK_ENGINE_URL,
  JITO_BUNDLES_URL,
  FEE_AMOUNT
} from "./utils/constants";

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { loadPrivateKeyBase58 } from "./utils/privateKey";

import { SolRpcWsHelper } from "./helpers/solRpcWsClient/client";
import { JupSwapClient } from "./helpers/3rdParties/jup";
import { JitoClient } from "./helpers/3rdParties/jito";

import { CopyTradeHelper } from "./helpers/copyTradeHelper";
import { SolRpcWsSubscribeManager } from "./helpers/solRpcWsSubscribeManager";
import { FeeHelper } from "./helpers/copyTradeHelper/feeHelper/helper";

////////////////////////////////////////////////////////////////////////////////

// Export the initialization function for CLI usage
export async function initializeCopyTradingService(
  playerKeypair: Keypair
): Promise<{
  solWeb3Conn: Connection;
  copyTradeHelper: CopyTradeHelper;
  solRpcWsHelper: SolRpcWsHelper;
  solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
  jupSwapClient: JupSwapClient;
  jitoClient: JitoClient;
}> {
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
    rootLogger.getSubLogger({ name: "CopyTradeHelper" })
  );
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

// If file is run directly (not imported), start the service
if (require.main === module) {
  async function main(): Promise<void> {
    const playerKeypair = loadPrivateKeyBase58(PRIVATE_KEY_BASE58);
    const { solRpcWsSubscribeManager } = await initializeCopyTradingService(
      playerKeypair
    );

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
      await solRpcWsSubscribeManager.gracefulStop();
      process.exit(0);
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
