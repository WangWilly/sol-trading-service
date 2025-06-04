import type { SwapInfoDto } from "./dtos";
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
import { Result, ResultUtils } from "../../utils/result";
import { COIN_TYPE_WSOL_MINT } from "../../utils/constants";

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
): Promise<Result<SwapInfoDto>> {
  const signerTokenBalanceChanges = getSignerTokenBalanceChanges(txRes);
  if (signerTokenBalanceChanges.length === 1) {
    return await ResultUtils.wrap(
      fromSol2TknTx(
        conn,
        subId,
        txSignature,
        txRes,
        signerTokenBalanceChanges[0]
      )
    );
  }
  if (signerTokenBalanceChanges.length === 2) {
    return ResultUtils.wrap(
      fromTkn2TknTx(
        conn,
        subId,
        txSignature,
        txRes,
        signerTokenBalanceChanges[0],
        signerTokenBalanceChanges[1]
      )
    );
  }
  return ResultUtils.err(
    new Error(
      `Invalid number of token balance changes: ${signerTokenBalanceChanges.length}`
    )
  );
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

  const isBuy = signerSolBalanceChange.post.lt(signerSolBalanceChange.pre);
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
  signerTokenBalanceChange1AsFrom: TokenBalanceChange,
  signerTokenBalanceChange2AsTo: TokenBalanceChange
): Promise<SwapInfoDto> {
  if (
    signerTokenBalanceChange2AsTo.post.lt(signerTokenBalanceChange2AsTo.pre)
  ) {
    if (
      signerTokenBalanceChange1AsFrom.post.lt(
        signerTokenBalanceChange1AsFrom.pre
      )
    ) {
      throw new Error(
        `Invalid token balance changes mint1: {${signerTokenBalanceChange1AsFrom.mint}, ${signerTokenBalanceChange1AsFrom.pre}, ${signerTokenBalanceChange1AsFrom.post}}, mint2: {${signerTokenBalanceChange2AsTo.mint}, ${signerTokenBalanceChange2AsTo.pre}, ${signerTokenBalanceChange2AsTo.post}}`
      );
    }
    return fromTkn2TknTx(
      conn,
      subId,
      txSignature,
      txRes,
      signerTokenBalanceChange2AsTo,
      signerTokenBalanceChange1AsFrom
    );
  }

  const signer = getSigner(txRes);
  if (!signer) {
    throw new Error("Signer not found");
  }

  const mint1AccInfo = await conn.getAccountInfo(
    new PublicKey(signerTokenBalanceChange1AsFrom.mint)
  );
  if (!mint1AccInfo) {
    throw new Error("Mint1 account info not found");
  }
  const mint1OwnerProgramId = mint1AccInfo.owner;

  const mint2AccInfo = await conn.getAccountInfo(
    new PublicKey(signerTokenBalanceChange2AsTo.mint)
  );
  if (!mint2AccInfo) {
    throw new Error("Mint2 account info not found");
  }
  const mint2OwnerProgramId = mint2AccInfo.owner;

  return {
    subId,
    txSignature,
    msg_hash: txRes.transaction.message.recentBlockhash,
    timestamp: txRes.blockTime || 0,
    status: "success",
    block: txRes.slot,
    signer: signer.toBase58(),
    fromSol: signerTokenBalanceChange1AsFrom.mint.equals(COIN_TYPE_WSOL_MINT),
    fromCoinType: signerTokenBalanceChange1AsFrom.mint,
    fromCoinAmount: signerTokenBalanceChange1AsFrom.post
      .sub(signerTokenBalanceChange1AsFrom.pre)
      .abs(),
    fromCoinPreBalance: signerTokenBalanceChange1AsFrom.pre,
    fromCoinPostBalance: signerTokenBalanceChange1AsFrom.post,
    fromCoinOwnerProgramId: mint1OwnerProgramId,
    toSol: signerTokenBalanceChange2AsTo.mint.equals(COIN_TYPE_WSOL_MINT),
    toCoinType: signerTokenBalanceChange2AsTo.mint,
    toCoinAmount: signerTokenBalanceChange2AsTo.post
      .sub(signerTokenBalanceChange2AsTo.pre)
      .abs(),
    toCoinOwnerProgramId: mint2OwnerProgramId,
  };
}

////////////////////////////////////////////////////////////////////////////////
// common
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
    (instruction) => instruction.programId.toBase58() === TRANSFER_PROGRAM_ID
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
