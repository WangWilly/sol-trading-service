import WebSocket from "ws";

import { LOGS_SUBSCRIBE_FIXED_ID, LOGS_UNSUBSCRIBE_FIXED_ID } from "./const";

////////////////////////////////////////////////////////////////////////////////

export function logsSubscribe(
  wsConn: WebSocket,
  publicKey: string,
  publicKeySubIdMap: Map<string, number>,
): void {
  // https://solana.com/docs/rpc/websocket/logssubscribe
  const subscribeMsg = {
    jsonrpc: "2.0",
    id: LOGS_SUBSCRIBE_FIXED_ID,
    method: "logsSubscribe",
    params: [{ mentions: [publicKey] }, { commitment: "confirmed" }],
  };
  publicKeySubIdMap.set(publicKey, -1); // prevent duplicate subscription
  wsConn.send(JSON.stringify(subscribeMsg));
}

export function logsUnsubscribe(
  wsConn: WebSocket,
  publicKey: string,
  subId: number,
  toBeRemovedPublicKeys: string[],
): void {
  // https://solana.com/docs/rpc/websocket/logsunsubscribe
  const unsubscribeMsg = {
    jsonrpc: "2.0",
    id: LOGS_UNSUBSCRIBE_FIXED_ID,
    method: "logsUnsubscribe",
    params: [subId],
  };
  toBeRemovedPublicKeys.push(publicKey);
  wsConn.send(JSON.stringify(unsubscribeMsg));
}