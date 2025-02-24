import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { SolRpcWsHelper } from "./helpers/solRpcWsClient/client";
import { JupSwapClient } from "./helpers/3rdParties/jup";
import { JitoClient } from "./helpers/3rdParties/jito";
import {
  CopyTradeRecordOnBuyStrategySchema,
  CopyTradeRecordOnSellStrategySchema,
} from "./helpers/copyTradeHelperV2/dtos";
import { SolRpcWsSubscribeManager } from "./helpers/solRpcWsSubscribeManager";
import { COIN_TYPE_WSOL_MINT } from "./helpers/solRpcWsClient/const";
import { TsLogLogger } from "./utils/logging";
import { CopyTradeHelperV2 } from "./helpers/copyTradeHelperV2";
import { FeeHelper } from "./helpers/copyTradeHelperV2/feeHelper/helper";
import { loadPrivateKeyBase58 } from "./utils/privateKey";
import { PRIVATE_KEY_BASE58 } from "./config";

////////////////////////////////////////////////////////////////////////////////

async function main(): Promise<void> {
  const playerKeypair = loadPrivateKeyBase58(PRIVATE_KEY_BASE58);

  //////////////////////////////////////////////////////////////////////////////

  const rootLogger = new TsLogLogger({ name: "copy-trade-service" });

  //////////////////////////////////////////////////////////////////////////////

  const solWeb3Conn = new Connection(
    "https://newest-icy-isle.solana-mainnet.quiknode.pro/c72249a674becf5948b09bfa6ba1269f41a28607"
  );
  const jupSwapClient = new JupSwapClient(
    "https://api.jup.ag",
    "",
    rootLogger.getSubLogger({ name: "JupSwapClient" })
  );
  const jitoClient = new JitoClient(
    "https://mainnet.block-engine.jito.wtf",
    "https://bundles.jito.wtf",
    "",
    rootLogger.getSubLogger({ name: "JitoClient" })
  );
  // FIXME:
  const feeHelper = new FeeHelper(
    100_000,
    new PublicKey("81v6neWF9XPArSSeHoUqc49Zb6npuK4cWsErQ8TiA5Rh")
  );
  const copyTradeHelper = new CopyTradeHelperV2(
    playerKeypair,
    solWeb3Conn,
    jupSwapClient,
    jitoClient,
    feeHelper,
    rootLogger.getSubLogger({ name: "CopyTradeHelper" })
  );
  const solRpcWsHelper = new SolRpcWsHelper(
    "wss://newest-icy-isle.solana-mainnet.quiknode.pro/c72249a674becf5948b09bfa6ba1269f41a28607",
    copyTradeHelper,
    rootLogger.getSubLogger({ name: "SolRpcWsHelper" })
  );
  const solRpcWsSubscribeManager = new SolRpcWsSubscribeManager(
    solRpcWsHelper,
    copyTradeHelper,
    rootLogger.getSubLogger({ name: "SolRpcWsSubscribeHelper" })
  );
  solRpcWsHelper.start();

  //////////////////////////////////////////////////////////////////////////////

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
