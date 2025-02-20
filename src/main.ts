import { Connection, Keypair } from "@solana/web3.js";
import BN from "bn.js";

import { CopyTradeHelper } from "./helpers/copyTradeHelper";
import { SolRpcWsHelper } from "./helpers/solRpcWsHelper/helper";
import { JupSwapClient } from "./helpers/3rdParties/jup";
import { JitoClient } from "./helpers/3rdParties/jito";
import {
  CopyTradeRecordOnBuyStrategySchema,
  CopyTradeRecordOnSellStrategySchema,
} from "./helpers/copyTradeHelper/dtos";
import { SolRpcWsSubscribeHelper } from "./helpers/solRpcWsSubscribeHelper";
import { COIN_TYPE_SOL_NATIVE } from "./helpers/solRpcWsHelper/const";

////////////////////////////////////////////////////////////////////////////////

async function main(): Promise<void> {
  const playerKeypair = Keypair.generate();

  //////////////////////////////////////////////////////////////////////////////

  const solWeb3Conn = new Connection("https://api.mainnet-beta.solana.com");
  const jupSwapClient = new JupSwapClient();
  const jitoClient = new JitoClient();
  const copyTradeHelper = new CopyTradeHelper(
    playerKeypair,
    solWeb3Conn,
    jupSwapClient,
    jitoClient
  );
  const solRpcWsHelper = new SolRpcWsHelper(
    "wss://newest-icy-isle.solana-mainnet.quiknode.pro/c72249a674becf5948b09bfa6ba1269f41a28607",
    copyTradeHelper
  );
  const solRpcWsSubscribeHelper = new SolRpcWsSubscribeHelper(
    solRpcWsHelper,
    copyTradeHelper
  );
  solRpcWsHelper.start();

  //////////////////////////////////////////////////////////////////////////////

  solRpcWsSubscribeHelper.createCopyTradeRecordOnBuyStrategy(
    "CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou",
    "OnBuyTest",
    CopyTradeRecordOnBuyStrategySchema.parse({
      sellCoinType: COIN_TYPE_SOL_NATIVE,
      sellCoinAmount: new BN(1000),
      slippageBps: 50,
    })
  );
  solRpcWsSubscribeHelper.createCopyTradeRecordOnSellStrategy(
    "ERCjfWc8ZYH2eCSzuhTn8CbSHorueEJ5XLpBvTe7ovVv",
    "OnSellTest",
    CopyTradeRecordOnSellStrategySchema.parse({
      fixedPercentage: null,
      slippageBps: 50,
    })
  );

  //////////////////////////////////////////////////////////////////////////////

  // https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357
  const exitFunc = async (): Promise<void> => {
    await solRpcWsSubscribeHelper.gracefulStop();
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
