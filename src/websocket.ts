import WebSocket from 'ws';
import { TARGET_ADDRESS, WSS_RPC_URL } from './config';
import { copyTrade } from './trading';
import { DEX_POOLS } from './dexPools';

let ws: WebSocket | null = null;
let subscriptionId: number | null = null;

export function connectWebSocket() {
  if (ws) {
    console.log('🔄 重新連接 WebSocket...');
    ws.close();
  }

  ws = new WebSocket(WSS_RPC_URL);

  ws.on('open', () => {
    console.log(`🚀 WebSocket 連線成功: ${WSS_RPC_URL}`);

    const subscribeMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'logsSubscribe',
      params: [
        { mentions: [TARGET_ADDRESS.toBase58()] },
        { commitment: 'confirmed' },
      ],
    };
    ws?.send(JSON.stringify(subscribeMsg));
  });

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.result) {
      subscriptionId = message.result;
      console.log(`✅ 訂閱成功! Subscription ID: ${subscriptionId}`);
    }

    if (message.method === 'logsNotification') {
      const logs = message.params.result;
      const logMessages: string[] = logs.value.logs || [];

      // isSwap 判斷，檢查 logs 是否包含任何一個 DEX POOL 地址
      const isSwap = logMessages.some((log) =>
        Array.from(DEX_POOLS).some((dexPool) => log.includes(dexPool))
      );

      if (isSwap) {
        console.log(
          '🔄 目標地址正在 Swap，開始跟單，交易哈希: ',
          logs.value.signature
        );
        // await copyTrade(logs.value.signature);
      } else {
        // console.log('❌ 交易不是 Swap，忽略...');
      }
    }
  });

  ws.on('close', () => {
    console.warn('⚠️ WebSocket 連線斷開，5 秒後重新連線...');
    setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 錯誤: ', error);
  });

  setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log('💓 Heartbeat: WebSocket 仍然存活');
      ws.ping();
    } else {
      console.warn('⚠️ WebSocket 可能已掉線，嘗試重連...');
      connectWebSocket();
    }
  }, 30_000);
}
