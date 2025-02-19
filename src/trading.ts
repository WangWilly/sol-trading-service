/**
import axios from 'axios';
import { HTTP_RPC_URL } from './config';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { DEX_POOLS } from './dexPools';
import { TransactionBuilder } from './utils/transactionBuilder';
import { parseSwapTransaction } from './utils/transactionHelper';

export async function copyTrade(txSignature: string) {
  try {
    const { data } = await axios.post(HTTP_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [
        txSignature,
        {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
          encoding: 'jsonParsed',
        },
      ],
    });

    if (!data.result) {
      console.log('⚠️ 交易查詢失敗，無法跟單');
      return;
    }

    const swapDetails = parseSwapTransaction(data.result);

    // 包裝交易
  } catch (error) {
    console.error('❌ 跟單失敗: ', error);
  }
}

async function parseTransasction() {}
*/
