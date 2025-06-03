import { CopyTradeHelper } from "../../helpers/copyTradeHelper";
import { SolRpcWsHelper } from "../../helpers/solRpcWsClient";
import { SolRpcWsSubscribeManager } from "../../helpers/solRpcWsSubscribeManager";

export interface ServiceComponents {
  solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
  copyTradeHelper: CopyTradeHelper;
  solRpcWsHelper: SolRpcWsHelper;
  playerKeypair: any;
  solWeb3Conn: any;
}

// Define interface for the strategy object returned to CLI
export interface CopyTradeStrategy {
  id: string;
  name: string;
  type: string;
  targetWallet: string;
  config: any;
}
