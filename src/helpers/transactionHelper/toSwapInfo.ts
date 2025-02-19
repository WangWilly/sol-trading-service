import { SwapInfoDto } from "./dtos";
import { CREATE_ACCOUNT_FEE, TIPS_ADDRESSE_SET, TRANSFER_PROGRAM_ID } from "./const";

import {
  ParsedTransactionWithMeta,
  PublicKey,
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

////////////////////////////////////////////////////////////////////////////////

interface BalanceChange {
  pre: BN;
  post: BN;
}

interface TokenBalanceChange {
  mint: string;
  pre: BN;
  post: BN;
}

////////////////////////////////////////////////////////////////////////////////

export function toSwapInfoDto(
  txRes: ParsedTransactionWithMeta
): SwapInfoDto | null {
  const signerTokenBalanceChanges = getSignerTokenBalanceChanges(txRes);
  if (signerTokenBalanceChanges.length === 1) {
    return fromSol2TknTx(txRes, signerTokenBalanceChanges[0]);
  }
  if (signerTokenBalanceChanges.length === 2) {
    return fromTkn2TknTx(
      txRes,
      signerTokenBalanceChanges[0],
      signerTokenBalanceChanges[1]
    );
  }
  return null;
}

function fromSol2TknTx(
  txRes: ParsedTransactionWithMeta,
  signerTokenBalanceChange: TokenBalanceChange
): SwapInfoDto | null {
  const signer = getSigner(txRes);
  if (!signer) {
    return null;
  }

  const signerSolBalanceChange = getSignerBalanceChange(txRes);
  if (!signerSolBalanceChange) {
    return null;
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

  const isBuy = signerTokenBalanceChange.post.lt(signerTokenBalanceChange.pre);
  if (isBuy) {
    return {
      solChanging: true,
      msg_hash: txRes.transaction.message.recentBlockhash,
      timestamp: txRes.blockTime || 0,
      status: "success",
      block: txRes.slot,
      signer: signer.toBase58(),
      fromCoinType: "SOL",
      fromCoinAmount: solBalanceAmount,
      fromCoinPreBalance: signerSolBalanceChange.pre,
      fromCoinPostBalance: signerSolBalanceChange.post,
      toCoinType: signerTokenBalanceChange.mint,
      toCoinAmount: tokenBalanceAmount,
    };
  }

  return {
    solChanging: true,
    msg_hash: txRes.transaction.message.recentBlockhash,
    timestamp: txRes.blockTime || 0,
    status: "success",
    block: txRes.slot,
    signer: signer.toBase58(),
    fromCoinType: signerTokenBalanceChange.mint,
    fromCoinAmount: tokenBalanceAmount,
    fromCoinPreBalance: signerTokenBalanceChange.pre,
    fromCoinPostBalance: signerTokenBalanceChange.post,
    toCoinType: "SOL",
    toCoinAmount: solBalanceAmount,
  };
}

function fromTkn2TknTx(
  txRes: ParsedTransactionWithMeta,
  signerTokenBalanceChange1: TokenBalanceChange,
  signerTokenBalanceChange2: TokenBalanceChange
): SwapInfoDto | null {
  if (signerTokenBalanceChange1.post.lt(signerTokenBalanceChange1.pre)) {
    if (signerTokenBalanceChange2.post.lt(signerTokenBalanceChange2.pre)) {
      // TODO: error handling
      return null;
    }
    return fromTkn2TknTx(
      txRes,
      signerTokenBalanceChange2,
      signerTokenBalanceChange1
    );
  }

  const signer = getSigner(txRes);
  if (!signer) {
    return null;
  }

  return {
    solChanging: false,
    msg_hash: txRes.transaction.message.recentBlockhash,
    timestamp: txRes.blockTime || 0,
    status: "success",
    block: txRes.slot,
    signer: signer.toBase58(),
    fromCoinType: signerTokenBalanceChange1.mint,
    fromCoinAmount: signerTokenBalanceChange1.post
      .sub(signerTokenBalanceChange1.pre)
      .abs(),
    fromCoinPreBalance: signerTokenBalanceChange1.pre,
    fromCoinPostBalance: signerTokenBalanceChange1.post,
    toCoinType: signerTokenBalanceChange2.mint,
    toCoinAmount: signerTokenBalanceChange2.post
      .sub(signerTokenBalanceChange2.pre)
      .abs(),
  };
}

////////////////////////////////////////////////////////////////////////////////
// common

function getSigner(txRes: ParsedTransactionWithMeta): PublicKey | null {
  if (txRes.transaction.message.accountKeys.length === 0) {
    return null;
  }
  // TODO: signer is the first account key?
  const signers = txRes.transaction.message.accountKeys.filter(
    (account) => account.signer
  );

  if (signers.length === 0) {
    return null;
  }

  if (signers.length > 1) {
    console.warn("More than one signer found");
  }

  return signers[0].pubkey;
}

////////////////////////////////////////////////////////////////////////////////
// native sol

function getSignerBalanceChange(
  txRes: ParsedTransactionWithMeta
): BalanceChange | null {
  if (!txRes.meta) {
    return null;
  }
  if (
    txRes.meta.preBalances.length === 0 ||
    txRes.meta.postBalances.length === 0
  ) {
    return null;
  }
  // TODO: signer is the first account key?
  return {
    pre: new BN(txRes.meta.preBalances[0]),
    post: new BN(txRes.meta.postBalances[0]),
  };
}

function getTxFee(txRes: ParsedTransactionWithMeta): BN {
  if (!txRes.meta) {
    return new BN(0);
  }
  return new BN(txRes.meta.fee);
}

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

function getSolTransferIxs(
  txRes: ParsedTransactionWithMeta
): (ParsedInstruction | PartiallyDecodedInstruction)[] {
  return txRes.transaction.message.instructions.filter(
    (instruction) =>
      instruction.programId.toBase58() === TRANSFER_PROGRAM_ID
  );
}

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

function getSignerTokenBalanceChanges(
  txRes: ParsedTransactionWithMeta
): TokenBalanceChange[] {
  const signer = getSigner(txRes);
  if (!signer) {
    return [];
  }
  if (
    !txRes.meta ||
    !txRes.meta.preTokenBalances ||
    !txRes.meta.postTokenBalances
  ) {
    return [];
  }
  const preTokenBalances = txRes.meta.preTokenBalances;
  return txRes.meta.postTokenBalances
    .filter((token) => token.owner === signer.toBase58())
    .map((token, idx) => {
      return {
        mint: token.mint,
        pre: new BN(preTokenBalances[idx].uiTokenAmount.amount),
        post: new BN(token.uiTokenAmount.amount),
      };
    });
}
