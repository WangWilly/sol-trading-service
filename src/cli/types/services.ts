import { CopyTradeHelper } from "../../helpers/copyTradeHelper";
import { SolRpcWsHelper } from "../../helpers/solRpcWsClient";
import { SolRpcWsSubscribeManager } from "../../helpers/solRpcWsSubscribeManager";
import { SwapHelper } from "../../helpers/swapHelper";
import { ArbitrageHelper } from "../../helpers/arbitrageHelper";

////////////////////////////////////////////////////////////////////////////////

export interface ServiceComponents {
  solRpcWsSubscribeManager: SolRpcWsSubscribeManager;
  copyTradeHelper: CopyTradeHelper;
  solRpcWsHelper: SolRpcWsHelper;
  playerKeypair: any;
  solWeb3Conn: any;
  swapHelper: SwapHelper;
  arbitrageHelper: ArbitrageHelper;
}

// Define interface for the strategy object returned to CLI
export interface CopyTradeStrategy {
  id: string;
  name: string;
  type: string;
  targetWallet: string;
  config: any;
}
