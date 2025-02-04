import 'dotenv/config';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export const WSS_RPC_URL = process.env.WSS_RPC_URL || 'wss://your-rpc-provider';
export const HTTP_RPC_URL =
  process.env.HTTP_RPC_URL || 'https://your-rpc-provider';
export const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
export const TARGET_ADDRESS = new PublicKey(process.env.TARGET_ADDRESS || '');

export const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
