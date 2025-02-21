import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { safe } from "../../../utils/exceptions";
import { COIN_TYPE_WSOL_MINT } from "../../solRpcWsClient/const";

////////////////////////////////////////////////////////////////////////////////

export class TokenHelper {
  // https://solana.stackexchange.com/questions/5571/is-it-possible-to-make-an-ata-in-one-instruction-then-use-that-created-ata-in-t
  static async getIxsPlayerAmpleWsolForSell(
    solWeb3Conn: Connection,
    playerPublicKey: PublicKey,
    sellAmount: BN
  ): Promise<TransactionInstruction[]> {
    const tokenAccountPubkey = getAssociatedTokenAddressSync(
      COIN_TYPE_WSOL_MINT,
      playerPublicKey,
      false
    );

    let ifInstallAcc = false;
    const depositWsol = new BN(0);
    const getAccRes = await safe(
      getAccount(solWeb3Conn, tokenAccountPubkey, "confirmed")
    );
    if (!getAccRes.success) {
      ifInstallAcc = true;
    }
    if (getAccRes.success) {
      const ata = getAccRes.data;
      if (ata.owner.toBase58() !== playerPublicKey.toBase58()) {
        throw new Error(`Invalid token account owner: ${ata.owner.toBase58()}`);
      }
      const amount = new BN(ata.amount.toString());
      if (amount.lt(sellAmount)) {
        depositWsol.iadd(sellAmount.sub(amount));
      }
    }

    const ixs: TransactionInstruction[] = [];
    if (ifInstallAcc) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        playerPublicKey,
        tokenAccountPubkey,
        playerPublicKey,
        COIN_TYPE_WSOL_MINT
      );
      ixs.push(createAtaIx);
    }
    if (depositWsol.gt(new BN(0))) {
      // https://spl.solana.com/token#example-wrapping-sol-in-a-token
      // https://solana.stackexchange.com/questions/1661/how-can-i-wrap-native-sol-in-js
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: playerPublicKey,
          toPubkey: tokenAccountPubkey,
          lamports: depositWsol.toNumber(),
        }),
        createSyncNativeInstruction(tokenAccountPubkey)
      );
    }
    return ixs;
  }

  static async getCreateIxPlayerTokenForDeposit(
    solWeb3Conn: Connection,
    playerPublicKey: PublicKey,
    mintAccountPubkey: PublicKey,
    mintOwnerProgramId: PublicKey
  ): Promise<TransactionInstruction | null> {
    const tokenAccountPubkey = getAssociatedTokenAddressSync(
      mintAccountPubkey,
      playerPublicKey,
      false,
      mintOwnerProgramId
    );
    const createAtaIx = createAssociatedTokenAccountInstruction(
      playerPublicKey,
      tokenAccountPubkey,
      playerPublicKey,
      mintAccountPubkey,
      mintOwnerProgramId
    );

    const getAccRes = await safe(
      getAccount(
        solWeb3Conn,
        tokenAccountPubkey,
        "confirmed",
        mintOwnerProgramId
      )
    );
    if (!getAccRes.success) {
      return createAtaIx;
    }
    if (getAccRes.data.owner.toBase58() !== playerPublicKey.toBase58()) {
      throw new Error(
        `Invalid token account owner: ${getAccRes.data.owner.toBase58()}`
      );
    }

    return null;
  }

  static async getCreateIxPlayerWsolForDeposit(
    solWeb3Conn: Connection,
    playerPublicKey: PublicKey
  ): Promise<TransactionInstruction | null> {
    const tokenAccountPubkey = getAssociatedTokenAddressSync(
      COIN_TYPE_WSOL_MINT,
      playerPublicKey,
      false
    );
    const createAtaIx = createAssociatedTokenAccountInstruction(
      playerPublicKey,
      tokenAccountPubkey,
      playerPublicKey,
      COIN_TYPE_WSOL_MINT
    );

    const getAccRes = await safe(
      getAccount(solWeb3Conn, tokenAccountPubkey, "confirmed")
    );
    if (!getAccRes.success) {
      return createAtaIx;
    }
    if (getAccRes.data.owner.toBase58() !== playerPublicKey.toBase58()) {
      throw new Error(
        `Invalid token account owner: ${getAccRes.data.owner.toBase58()}`
      );
    }

    return null;
  }

  // https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-look-up-the-address-of-a-token-account#link-web3
  // https://spl.solana.com/token
  // https://spl.solana.com/token-2022/extensions
  // https://spl.solana.com/associated-token-account
  static async getPlayerTokenBalanceForSell(
    solWeb3Conn: Connection,
    playerPublicKey: PublicKey,
    mintAccountPubkey: PublicKey,
    mintOwnerProgramId: PublicKey
  ): Promise<BN> {
    const tokenAccountPubkey = getAssociatedTokenAddressSync(
      mintAccountPubkey,
      playerPublicKey,
      false,
      mintOwnerProgramId
    );

    const getAccRes = await safe(
      getAccount(
        solWeb3Conn,
        tokenAccountPubkey,
        "confirmed",
        mintOwnerProgramId
      )
    );
    if (!getAccRes.success) {
      // throw new Error(`Cannot get token account: ${tokenAccountPubkey}`);
      return new BN(0);
    }
    const ata = getAccRes.data;
    if (ata.owner.toBase58() !== playerPublicKey.toBase58()) {
      throw new Error(`Invalid token account owner: ${ata.owner.toBase58()}`);
    }
    return new BN(ata.amount.toString());
  }
}
