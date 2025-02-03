import 'dotenv/config';
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  VersionedTransaction,
  ParsedInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';

// **載入環境變數**
const RPC_URL = process.env.RPC_URL || clusterApiUrl('mainnet-beta');
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const TARGET_ADDRESS = process.env.TARGET_ADDRESS || '';

// **Solana DEX (Raydium & Orca)**
const RAYDIUM_LIQUIDITY_POOL = new PublicKey('YourRaydiumPoolAddress');
const ORCA_LIQUIDITY_POOL = new PublicKey('YourOrcaPoolAddress');

// **設置 Solana 連線**
const connection = new Connection(RPC_URL, 'confirmed');
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

console.log(`🚀 開始監聽目標地址: ${TARGET_ADDRESS}`);

// **監聽交易**
async function listenForSwaps() {
  connection.onLogs(new PublicKey(TARGET_ADDRESS), async (logs, context) => {
    if (logs.err) return;

    console.log(`📌 目標地址發起交易: ${logs.signature}`);

    // 獲取交易詳細信息
    const tx = await connection.getTransaction(logs.signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return;
    const instructions = tx.transaction.message
      .instructions as ParsedInstruction[];

    // 檢查是否為 Swap 交易
    let isSwap = false;
    for (const instr of instructions) {
      if (
        instr.programId.equals(RAYDIUM_LIQUIDITY_POOL) ||
        instr.programId.equals(ORCA_LIQUIDITY_POOL)
      ) {
        isSwap = true;
        break;
      }
    }

    if (isSwap) {
      console.log('🔄 目標地址正在進行 Swap，開始跟單...');
      await copyTrade(tx);
    }
  });
}

// **跟單邏輯**
async function copyTrade(originalTx: any) {
  try {
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const newTx = new Transaction().add(
      ...originalTx.transaction.message.instructions
    );
    newTx.recentBlockhash = blockhash;
    newTx.feePayer = wallet.publicKey;

    // **簽名並發送**
    const signedTx = await wallet.signTransaction(newTx);
    const txHash = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
    });

    console.log(`🚀 成功跟單! 交易哈希: ${txHash}`);
  } catch (error) {
    console.error('❌ 跟單失敗: ', error);
  }
}

// 啟動監聽
listenForSwaps();
