import axios from 'axios';
import { HTTP_RPC_URL } from './config';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { DEX_POOLS } from './dexPools';
import { TransactionBuilder } from './utils/transactionBuilder';

export async function copyTrade(txSignature: string) {
  try {
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

    // // ✅ 這裡的查詢也改用 O(1) Set 查詢
    // const instructions: TransactionInstruction[] =
    //   data.result.transaction.message.instructions.filter((instr: any) =>
    //     DEX_POOLS.has(instr.programId)
    //   );

    // if (instructions.length === 0) {
    //   console.log('❌ 交易中沒有 Swap 指令，忽略...');
    //   return;
    // }

    console.log(`🚀 準備跟單! 交易哈希: ${txSignature}`);
    console.log('🔍 交易資訊: ', data);
    // 這裡可以發送 `newTx` 到鏈上

    const txBuilder = TransactionBuilder.from(data.result.transaction);
    console.log('txBuilder', txBuilder);
  } catch (error) {
    console.error('❌ 跟單失敗: ', error);
  }
}

async function parseTransasction() {}
