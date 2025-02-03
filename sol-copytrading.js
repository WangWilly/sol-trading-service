require('dotenv').config();
const {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
} = require('@solana/web3.js');
const bs58 = require('bs58');

// === 設置環境變數 ===
const RPC_URL = process.env.RPC_URL || clusterApiUrl('mainnet-beta'); // Solana 主網節點
const PRIVATE_KEY = process.env.PRIVATE_KEY; // 你的私鑰 (Base58 格式)
const TARGET_ADDRESS = new PublicKey(process.env.TARGET_ADDRESS); // 你要跟單的地址

// **Solana DEX 合約地址 (Raydium & Orca)**
const RAYDIUM_LIQUIDITY_POOL = new PublicKey('0xYourRaydiumPoolAddress');
const ORCA_LIQUIDITY_POOL = new PublicKey('0xYourOrcaPoolAddress');

// **設置 Solana RPC 連線**
const connection = new Connection(RPC_URL, 'confirmed');
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

console.log(`🚀 開始監聽目標地址: ${TARGET_ADDRESS.toBase58()}`);

// **監聽交易池中的交易**
async function listenForSwaps() {
  connection.onLogs(TARGET_ADDRESS, async (logs, context) => {
    if (!logs.err) {
      console.log(`📌 目標地址發起交易: ${logs.signature}`);

      // 取得交易詳細資料
      const tx = await connection.getTransaction(logs.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) return;
      const instructions = tx.transaction.message.compiledInstructions;

      // 檢查是否是 Raydium / Orca Swap
      let isSwap = false;
      for (let instr of instructions) {
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
    }
  });
}

// **跟單邏輯**
async function copyTrade(originalTx) {
  try {
    // 取得原始交易資訊
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
