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

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const playerKeypair = Keypair.fromSecretKey(
    new Uint8Array([
      248, 70, 91, 109, 120, 91, 204, 74, 224, 186, 71, 196, 81, 188, 6, 93,
      128, 198, 94, 189, 109, 209, 217, 68, 244, 248, 77, 26, 141, 174
    ])
  );
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
    "wss://api.mainnet-beta.solana.com/",
    copyTradeHelper
  );
  const solRpcWsSubscribeHelper = new SolRpcWsSubscribeHelper(
    solRpcWsHelper,
    copyTradeHelper
  );
  solRpcWsHelper.start();

  solRpcWsSubscribeHelper.createCopyTradeRecordOnBuyStrategy(
    "HDs743XeHc6LS9akHf8sGVaonpGfP4YnZD2PD5M4HixZ",
    "OnBuyTest",
    CopyTradeRecordOnBuyStrategySchema.parse({
      sellCoinType: "SOL",
      sellCoinAmount: new BN(1000),
      slippageBps: 50,
    })
  );
  solRpcWsSubscribeHelper.createCopyTradeRecordOnSellStrategy(
    "HDs743XeHc6LS9akHf8sGVaonpGfP4YnZD2PD5M4HixZ",
    "OnSellTest",
    CopyTradeRecordOnSellStrategySchema.parse({
      slippageBps: 50,
    })
  );
}

main();
