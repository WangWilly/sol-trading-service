import WebSocket from "ws";
import { BURNNER_RPC_ID } from "./const";

////////////////////////////////////////////////////////////////////////////////

export type RpcIdRange = {
  start: number;
  end: number;
};
export type RpcId = {
  curr: number;
};

////////////////////////////////////////////////////////////////////////////////

export type PublicKeySubIdMap = Map<string, number>;
export type RpcIdpubKeyMap4SubUnsub = Map<number, string>;
export type RpcIdGenerator = (publicKey: string) => number;

////////////////////////////////////////////////////////////////////////////////

export function buildRpcIdGenerator(
  rpcIdRange: RpcIdRange,
  rpcIdpubKeyMap: RpcIdpubKeyMap4SubUnsub,
  curr: RpcId,
): RpcIdGenerator {
  return (publicKey: string): number => {
    while (rpcIdpubKeyMap.has(curr.curr)) {
      curr.curr += 1;
      if (curr.curr > rpcIdRange.end) {
        curr.curr = rpcIdRange.start;
      }
    }
    rpcIdpubKeyMap.set(curr.curr, publicKey);
    return curr.curr;
  };
}

////////////////////////////////////////////////////////////////////////////////

export function logsSubscribe(
  wsConn: WebSocket,
  rpcIdGen: RpcIdGenerator,
  publicKey: string,
  publicKeySubIdMap: PublicKeySubIdMap,
): void {
  // https://solana.com/docs/rpc/websocket/logssubscribe
  const subscribeMsg = {
    jsonrpc: "2.0",
    id: rpcIdGen(publicKey),
    method: "logsSubscribe",
    // https://solana.com/docs/rpc#configuring-state-commitment
    params: [{ mentions: [publicKey] }, { commitment: "confirmed" }],
  };
  publicKeySubIdMap.set(publicKey, -1); // prevent duplicate subscription
  wsConn.send(JSON.stringify(subscribeMsg));
}

export function logsUnsubscribe(
  wsConn: WebSocket,
  rpcIdGen: RpcIdGenerator,
  subId: number,
  publicKey: string | null = null,
  publicKeySubIdMap: PublicKeySubIdMap | null = null,
): void {
  // https://solana.com/docs/rpc/websocket/logsunsubscribe
  const unsubscribeMsg = {
    jsonrpc: "2.0",
    id: publicKey ? rpcIdGen(publicKey) : BURNNER_RPC_ID,
    method: "logsUnsubscribe",
    params: [subId],
  };
  wsConn.send(JSON.stringify(unsubscribeMsg));
  if (!publicKeySubIdMap || !publicKey) {
    return;
  }
  publicKeySubIdMap.delete(publicKey);
}

////////////////////////////////////////////////////////////////////////////////
