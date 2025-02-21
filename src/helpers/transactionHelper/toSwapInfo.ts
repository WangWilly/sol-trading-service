import { SwapInfoDto } from "./dtos";
import {
  CREATE_ACCOUNT_FEE,
  TIPS_ADDRESSE_SET,
  TRANSFER_PROGRAM_ID,
} from "./const";

import {
  ParsedTransactionWithMeta,
  PublicKey,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  Connection,
  SystemProgram,
} from "@solana/web3.js";
import BN from "bn.js";
import { COIN_TYPE_WSOL_MINT } from "../solRpcWsClient/const";

////////////////////////////////////////////////////////////////////////////////

interface BalanceChange {
  pre: BN;
  post: BN;
}

interface TokenBalanceChange {
  mint: PublicKey;
  pre: BN;
  post: BN;
}

////////////////////////////////////////////////////////////////////////////////

export async function toSwapInfoDto(
  conn: Connection,
  subId: number,
  txSignature: string,
  txRes: ParsedTransactionWithMeta
): Promise<SwapInfoDto> {
  const signerTokenBalanceChanges = getSignerTokenBalanceChanges(txRes);
  if (signerTokenBalanceChanges.length === 1) {
    return await fromSol2TknTx(
      conn,
      subId,
      txSignature,
      txRes,
      signerTokenBalanceChanges[0]
    );
  }
  if (signerTokenBalanceChanges.length === 2) {
    return fromTkn2TknTx(
      conn,
      subId,
      txSignature,
      txRes,
      signerTokenBalanceChanges[0],
      signerTokenBalanceChanges[1]
    );
  }
  throw new Error("Invalid number of token balance changes");
}

async function fromSol2TknTx(
  conn: Connection,
  subId: number,
  txSignature: string,
  txRes: ParsedTransactionWithMeta,
  signerTokenBalanceChange: TokenBalanceChange
): Promise<SwapInfoDto> {
  const signer = getSigner(txRes);
  if (!signer) {
    throw new Error("Signer not found");
  }

  const signerSolBalanceChange = getSignerBalanceChange(txRes);
  if (!signerSolBalanceChange) {
    throw new Error("Signer balance change not found");
  }
  const txFee = getTxFee(txRes);
  const createAccountFeesSum = getCreateAccountFeesSum(txRes);
  const tipsSum = getTipsSum(getSolTransferIxs(txRes));
  const solBalanceAmount = signerSolBalanceChange.post
    .add(txFee)
    .add(createAccountFeesSum)
    .add(tipsSum)
    .sub(signerSolBalanceChange.pre)
    .abs();

  const tokenBalanceAmount = signerTokenBalanceChange.post
    .sub(signerTokenBalanceChange.pre)
    .abs();
  const mintAccInfo = await conn.getAccountInfo(
    new PublicKey(signerTokenBalanceChange.mint)
  );
  if (!mintAccInfo) {
    throw new Error("Mint account info not found");
  }
  const tokenMintOwnerProgramId = mintAccInfo.owner;

  const isBuy = signerTokenBalanceChange.post.lt(signerTokenBalanceChange.pre);
  if (isBuy) {
    return {
      subId,
      txSignature,
      msg_hash: txRes.transaction.message.recentBlockhash,
      timestamp: txRes.blockTime || 0,
      status: "success",
      block: txRes.slot,
      signer: signer.toBase58(),
      fromSol: true,
      fromCoinType: null,
      fromCoinAmount: solBalanceAmount,
      fromCoinPreBalance: signerSolBalanceChange.pre,
      fromCoinPostBalance: signerSolBalanceChange.post,
      fromCoinOwnerProgramId: SystemProgram.programId,
      toSol: false,
      toCoinType: signerTokenBalanceChange.mint,
      toCoinAmount: tokenBalanceAmount,
      toCoinOwnerProgramId: tokenMintOwnerProgramId,
    };
  }

  return {
    subId,
    txSignature,
    msg_hash: txRes.transaction.message.recentBlockhash,
    timestamp: txRes.blockTime || 0,
    status: "success",
    block: txRes.slot,
    signer: signer.toBase58(),
    fromSol: false,
    fromCoinType: signerTokenBalanceChange.mint,
    fromCoinAmount: tokenBalanceAmount,
    fromCoinPreBalance: signerTokenBalanceChange.pre,
    fromCoinPostBalance: signerTokenBalanceChange.post,
    fromCoinOwnerProgramId: tokenMintOwnerProgramId,
    toSol: true,
    toCoinType: null,
    toCoinAmount: solBalanceAmount,
    toCoinOwnerProgramId: SystemProgram.programId,
  };
}

async function fromTkn2TknTx(
  conn: Connection,
  subId: number,
  txSignature: string,
  txRes: ParsedTransactionWithMeta,
  signerTokenBalanceChange1: TokenBalanceChange,
  signerTokenBalanceChange2: TokenBalanceChange
): Promise<SwapInfoDto> {
  if (signerTokenBalanceChange1.post.lt(signerTokenBalanceChange1.pre)) {
    if (signerTokenBalanceChange2.post.lt(signerTokenBalanceChange2.pre)) {
      throw new Error(
        `Invalid token balance changes mint1: {${signerTokenBalanceChange1.mint}, ${signerTokenBalanceChange1.pre}, ${signerTokenBalanceChange1.post}}, mint2: {${signerTokenBalanceChange2.mint}, ${signerTokenBalanceChange2.pre}, ${signerTokenBalanceChange2.post}}`
      );
    }
    return fromTkn2TknTx(
      conn,
      subId,
      txSignature,
      txRes,
      signerTokenBalanceChange2,
      signerTokenBalanceChange1
    );
  }

  const signer = getSigner(txRes);
  if (!signer) {
    throw new Error("Signer not found");
  }

  const mint1AccInfo = await conn.getAccountInfo(
    new PublicKey(signerTokenBalanceChange1.mint)
  );
  if (!mint1AccInfo) {
    throw new Error("Mint1 account info not found");
  }
  const mint1OwnerProgramId = mint1AccInfo.owner;

  const mint2AccInfo = await conn.getAccountInfo(
    new PublicKey(signerTokenBalanceChange2.mint)
  );
  if (!mint2AccInfo) {
    throw new Error("Mint2 account info not found");
  }
  const mint2OwnerProgramId = mint2AccInfo.owner;

  return {
    subId,
    txSignature,
    msg_hash: txRes.transaction.message.recentBlockhash, // ✅
    timestamp: txRes.blockTime || 0, // ✅
    status: "success",
    block: txRes.slot, // ✅
    signer: signer.toBase58(),
    fromSol: signerTokenBalanceChange1.mint.equals(COIN_TYPE_WSOL_MINT),
    fromCoinType: signerTokenBalanceChange1.mint,
    fromCoinAmount: signerTokenBalanceChange1.post
      .sub(signerTokenBalanceChange1.pre)
      .abs(),
    fromCoinPreBalance: signerTokenBalanceChange1.pre,
    fromCoinPostBalance: signerTokenBalanceChange1.post,
    fromCoinOwnerProgramId: mint1OwnerProgramId,
    toSol: signerTokenBalanceChange2.mint.equals(COIN_TYPE_WSOL_MINT),
    toCoinType: signerTokenBalanceChange2.mint,
    toCoinAmount: signerTokenBalanceChange2.post
      .sub(signerTokenBalanceChange2.pre)
      .abs(),
    toCoinOwnerProgramId: mint2OwnerProgramId,
  };
}

////////////////////////////////////////////////////////////////////////////////
// common
// ✅: parseTransactionAccounts
// https://github.com/debridge-finance/solana-tx-parser-public/blob/18e3642d5423f388b4c1031ab71d51f07dbb77de/src/helpers.ts#L123
function getSigner(txRes: ParsedTransactionWithMeta): PublicKey {
  if (txRes.transaction.message.accountKeys.length === 0) {
    throw new Error("No account keys found");
  }
  // TODO: signer is the first account key?
  const signers = txRes.transaction.message.accountKeys.filter(
    (account) => account.signer
  );

  if (signers.length === 0) {
    throw new Error("No signer found");
  }

  if (signers.length > 1) {
    console.warn("More than one signer found");
  }

  return signers[0].pubkey;
}

////////////////////////////////////////////////////////////////////////////////
// native sol
// ✅
// VersionedTransactionResponse -> meta -> ConfirmedTransactionMeta -> preBalances, postBalances
function getSignerBalanceChange(
  txRes: ParsedTransactionWithMeta
): BalanceChange {
  if (!txRes.meta) {
    throw new Error("Transaction meta not found");
  }
  if (
    txRes.meta.preBalances.length === 0 ||
    txRes.meta.postBalances.length === 0
  ) {
    throw new Error("Balances not found");
  }
  // TODO: signer is the first account key?
  return {
    pre: new BN(txRes.meta.preBalances[0]),
    post: new BN(txRes.meta.postBalances[0]),
  };
}

// ✅
// VersionedTransactionResponse -> meta -> ConfirmedTransactionMeta -> fee
function getTxFee(txRes: ParsedTransactionWithMeta): BN {
  if (!txRes.meta) {
    return new BN(0);
  }
  return new BN(txRes.meta.fee);
}

// ✅
// VersionedTransactionResponse -> meta -> ConfirmedTransactionMeta -> preBalances, postBalances
function getCreateAccountFeesSum(txRes: ParsedTransactionWithMeta): BN {
  if (!txRes.meta) {
    return new BN(0);
  }
  const postBalances = txRes.meta.postBalances;
  const preBalances = txRes.meta.preBalances;
  return postBalances
    .map((balance, index) => balance - preBalances[index])
    .filter((balance) => balance === CREATE_ACCOUNT_FEE)
    .reduce((total, balance) => total.add(new BN(balance)), new BN(0));
}

// ✅
// flattenTransactionResponse: https://github.com/debridge-finance/solana-tx-parser-public/blob/18e3642d5423f388b4c1031ab71d51f07dbb77de/src/helpers.ts#L119C17-L119C43
// VersionedTransactionResponse -> TransactionInstruction -> programId
function getSolTransferIxs(
  txRes: ParsedTransactionWithMeta
): (ParsedInstruction | PartiallyDecodedInstruction)[] {
  return txRes.transaction.message.instructions.filter(
    (instruction) => instruction.programId.toBase58() === TRANSFER_PROGRAM_ID
  );
}

// ✅
// https://github.com/debridge-finance/solana-tx-parser-public/blob/18e3642d5423f388b4c1031ab71d51f07dbb77de/src/parsers.ts#L249
// https://github.com/debridge-finance/solana-tx-parser-public/blob/18e3642d5423f388b4c1031ab71d51f07dbb77de/src/parsers.ts#L197
// https://github.com/debridge-finance/solana-tx-parser-public/blob/18e3642d5423f388b4c1031ab71d51f07dbb77de/src/decoders/system.ts#L132
function getTipsSum(
  ixs: (ParsedInstruction | PartiallyDecodedInstruction)[]
): BN {
  return ixs
    .filter((ix) => {
      const parsed = (ix as ParsedInstruction).parsed;
      if (!parsed) {
        return false;
      }
      return TIPS_ADDRESSE_SET.has(parsed?.info?.destination as string);
    })
    .reduce((total, ix) => {
      const parsed = (ix as ParsedInstruction).parsed;
      if (!parsed) {
        return total;
      }
      return total.add(new BN(parsed?.info?.lamports || 0));
    }, new BN(0));
}

////////////////////////////////////////////////////////////////////////////////
// token

// TokenBalance
function getSignerTokenBalanceChanges(
  txRes: ParsedTransactionWithMeta
): TokenBalanceChange[] {
  const signer = getSigner(txRes);
  if (!signer) {
    throw new Error("Signer not found");
  }
  if (
    !txRes.meta ||
    !txRes.meta.preTokenBalances ||
    !txRes.meta.postTokenBalances
  ) {
    throw new Error("Token balances not found");
  }
  const preTokenBalances = new Map(
    txRes.meta.preTokenBalances
      .filter((token) => token.owner === signer.toBase58())
      .map((token) => [token.mint, token.uiTokenAmount.amount])
  );
  return txRes.meta.postTokenBalances
    .filter((token) => token.owner === signer.toBase58())
    .map((token) => {
      return {
        mint: new PublicKey(token.mint),
        pre: new BN(preTokenBalances.get(token.mint) || 0),
        post: new BN(token.uiTokenAmount.amount),
      };
    })
    .filter((token) => token.pre.cmp(token.post) !== 0);
}
