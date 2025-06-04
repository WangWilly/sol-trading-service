import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { ResultUtils } from "../../../utils/result";
import {
  COIN_TYPE_USDC_MINT,
  COIN_TYPE_USDT_MINT,
  COIN_TYPE_WSOL_MINT,
} from "../../../utils/constants";

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
    const getAccRes = await ResultUtils.wrap(
      getAccount(solWeb3Conn, tokenAccountPubkey, "confirmed")
    );
    if (ResultUtils.isErr(getAccRes)) {
      ifInstallAcc = true;
    }
    if (ResultUtils.isOk(getAccRes)) {
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
    const getAccRes = await ResultUtils.wrap(
      getAccount(
        solWeb3Conn,
        tokenAccountPubkey,
        "confirmed",
        mintOwnerProgramId
      )
    );
    if (ResultUtils.isOk(getAccRes)) {
      if (getAccRes.data.owner.toBase58() !== playerPublicKey.toBase58()) {
        throw new Error(
          `Invalid token account owner: ${getAccRes.data.owner.toBase58()}`
        );
      }
    }

    const createAtaIx = createAssociatedTokenAccountInstruction(
      playerPublicKey,
      tokenAccountPubkey,
      playerPublicKey,
      mintAccountPubkey,
      mintOwnerProgramId
    );

    return createAtaIx;
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

    const getAccRes = await ResultUtils.wrap(
      getAccount(solWeb3Conn, tokenAccountPubkey, "confirmed")
    );
    if (ResultUtils.isErr(getAccRes)) {
      return createAtaIx;
    }
    if (getAccRes.data.owner.toBase58() !== playerPublicKey.toBase58()) {
      throw new Error(
        `Invalid token account owner: ${getAccRes.data.owner.toBase58()}`
      );
    }

    return null;
  }

  //////////////////////////////////////////////////////////////////////////////

  // https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-look-up-the-address-of-a-token-account#link-web3
  // https://spl.solana.com/token
  // https://spl.solana.com/token-2022/extensions
  // https://spl.solana.com/associated-token-account
  static async getUserTokenBalance(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    mintAccountPubkey: PublicKey,
    mintOwnerProgramId: PublicKey
  ): Promise<BN> {
    const tokenAccountPubkey = await ResultUtils.wrap(
      getAssociatedTokenAddress(
        mintAccountPubkey,
        userPublicKey,
        false,
        mintOwnerProgramId
      )
    );
    if (ResultUtils.isErr(tokenAccountPubkey)) {
      return new BN(0);
    }

    const getAccRes = await ResultUtils.wrap(
      getAccount(
        solWeb3Conn,
        ResultUtils.unwrap(tokenAccountPubkey),
        "confirmed",
        mintOwnerProgramId
      )
    );
    if (ResultUtils.isErr(getAccRes)) {
      // throw new Error(`Cannot get token account: ${tokenAccountPubkey}`);
      return new BN(0);
    }
    const ata = ResultUtils.unwrap(getAccRes);
    if (ata.owner.toBase58() !== userPublicKey.toBase58()) {
      throw new Error(`Invalid token account owner: ${ata.owner.toBase58()}`);
    }
    return new BN(ata.amount.toString());
  }

  static async getUserSolWrappedAndUnwrapped(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey
  ): Promise<{ wrapped: BN; unwrapped: BN; total: BN }> {
    const tokenAccountPubkey = await ResultUtils.wrap(
      getAssociatedTokenAddress(COIN_TYPE_WSOL_MINT, userPublicKey, false)
    );
    if (ResultUtils.isErr(tokenAccountPubkey)) {
      return { wrapped: new BN(0), unwrapped: new BN(0), total: new BN(0) };
    }

    const res = {
      wrapped: new BN(0),
      unwrapped: new BN(0),
      total: new BN(0),
    };

    const getAccRes = await ResultUtils.wrap(
      getAccount(
        solWeb3Conn,
        ResultUtils.unwrap(tokenAccountPubkey),
        "confirmed"
      )
    );
    if (ResultUtils.isOk(getAccRes)) {
      const ata = ResultUtils.unwrap(getAccRes);
      if (ata.owner.toBase58() !== userPublicKey.toBase58()) {
        throw new Error(`Invalid token account owner: ${ata.owner.toBase58()}`);
      }
      res.wrapped = new BN(ata.amount.toString());
      res.total.iadd(res.wrapped);
    }

    const solBalance = await ResultUtils.wrap(
      solWeb3Conn.getBalance(userPublicKey)
    );
    if (ResultUtils.isErr(solBalance)) {
      return { wrapped: res.wrapped, unwrapped: new BN(0), total: new BN(0) };
    }
    res.unwrapped = new BN(solBalance.data.toString());
    res.total.iadd(res.unwrapped);

    return res;
  }

  static async getUserQuoteBalance(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    mintAccountPubkey: PublicKey
  ): Promise<BN> {
    switch (mintAccountPubkey.toBase58()) {
      case COIN_TYPE_WSOL_MINT.toBase58(): {
        const res = await this.getUserSolWrappedAndUnwrapped(
          solWeb3Conn,
          userPublicKey
        );
        return res.total;
      }
      case COIN_TYPE_USDC_MINT.toBase58():
      case COIN_TYPE_USDT_MINT.toBase58(): {
        const balance = await this.getUserTokenBalance(
          solWeb3Conn,
          userPublicKey,
          mintAccountPubkey,
          SystemProgram.programId // Assuming USDC/USDT are using the System Program as the owner
        );
        return balance;
      }
      default: {
        throw new Error(
          `Unsupported mint account for quote balance: ${mintAccountPubkey.toBase58()}`
        );
      }
    }
  }
}
