import 'dotenv/config';
import WebSocket from 'ws';
import bs58 from 'bs58';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import axios from 'axios';

// **環境變數**
const WSS_RPC_URL = process.env.WSS_RPC_URL || 'wss://your-rpc-provider';
const HTTP_RPC_URL = process.env.HTTP_RPC_URL || 'https://your-rpc-provider';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const TARGET_ADDRESS = new PublicKey(process.env.TARGET_ADDRESS || '');

// **Solana DEX (Raydium & Orca)**
const RAYDIUM_STANDARD_AMM = new PublicKey(
  'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'
);
const RAYDIUM_LEGACY_AMM_V4 = new PublicKey(
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
);
const RAYDIUM_STABLE_AMM = new PublicKey(
  '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h'
);

const RAYDIUM_CLMM = new PublicKey(
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
);

const ORCA_WHIRL_POOLS = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';

const ORCA_TOKEN_SWAP = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';

const ORCA_TOKEN_SWAP_V2 = '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP';

const PUMP_FUN = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

// **載入私鑰**
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

let ws: WebSocket | null = null;
let subscriptionId: number | null = null;

// **初始化 WebSocket**
function connectWebSocket() {
  if (ws) {
    console.log('🔄 重新連接 WebSocket...');
    ws.close();
  }

  ws = new WebSocket(WSS_RPC_URL);

  ws.on('open', () => {
    console.log(`🚀 WebSocket 連線成功: ${WSS_RPC_URL}`);

    // **訂閱目標地址的交易**
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

    // 訂閱成功
    if (message.result) {
      subscriptionId = message.result;
      console.log(`✅ 訂閱成功! Subscription ID: ${subscriptionId}`);
    }

    // 收到交易日誌
    if (message.method === 'logsNotification') {
      console.log('📡 收到交易日誌...:', message);
      const logs = message.params.result;

      console.log(`📌 交易發生: ${logs.value.signature}`);

      const isSwap = logs.value.logs.some(
        (log: string) =>
          log.includes(RAYDIUM_STANDARD_AMM.toBase58()) ||
          log.includes(RAYDIUM_LEGACY_AMM_V4.toBase58()) ||
          log.includes(RAYDIUM_STABLE_AMM.toBase58()) ||
          log.includes(RAYDIUM_CLMM.toBase58()) ||
          log.includes(ORCA_WHIRL_POOLS) ||
          log.includes(ORCA_TOKEN_SWAP) ||
          log.includes(ORCA_TOKEN_SWAP_V2) ||
          log.includes(PUMP_FUN.toBase58())
      );

      if (isSwap) {
        console.log('🔄 目標地址正在 Swap，開始跟單...');
        await copyTrade(logs.value.signature);
      } else {
        console.log('❌ 交易不是 Swap，忽略...');
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

  // **Heartbeat**
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

// **查詢交易細節，執行跟單**
async function copyTrade(txSignature: string) {
  try {
    // **使用 HTTP API 查詢交易**
    const { data } = await axios.post(HTTP_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [txSignature, { commitment: 'confirmed' }],
    });

    if (!data.result) {
      console.log('⚠️ 交易查詢失敗，無法跟單');
      return;
    }

    // **提取 Swap 指令**
    const instructions: TransactionInstruction[] =
      data.result.transaction.message.instructions.filter(
        (instr: any) =>
          instr.programId === RAYDIUM_STANDARD_AMM.toBase58() ||
          instr.programId === RAYDIUM_LEGACY_AMM_V4.toBase58() ||
          instr.programId === RAYDIUM_STABLE_AMM.toBase58() ||
          instr.programId === RAYDIUM_CLMM.toBase58()
      );

    if (instructions.length === 0) {
      console.log('❌ 交易中沒有 Swap 指令，忽略...');
      return;
    }

    // **建立新的交易**
    const newTx = new TransactionInstruction({
      programId: new PublicKey(instructions[0].programId),
      keys: instructions[0].keys.map((key: any) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      // data: Buffer.from(instructions[0].data, 'base64'),
      data: Buffer.from(instructions[0].data, 64),
    });

    console.log(`🚀 準備跟單! 交易哈希: ${txSignature}`);
    // 這裡可以發送 `newTx` 到鏈上
  } catch (error) {
    console.error('❌ 跟單失敗: ', error);
  }
}

// **啟動 WebSocket**
connectWebSocket();
