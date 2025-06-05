import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { ResultUtils } from "../../utils/result";
import {
  COIN_TYPE_USDC_MINT,
  COIN_TYPE_USDT_MINT,
  COIN_TYPE_WSOL_MINT,
} from "../../utils/constants";
import { getTokenName } from "../../utils/tokenAsset";
import { TokenBalanceDto, WalletBalancesDto } from "./dtos";

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

  //////////////////////////////////////////////////////////////////////////////
  // Additional methods for SwapHelper compatibility
  //////////////////////////////////////////////////////////////////////////////

  static async getUserTokenBalanceDto(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    mintAccountPubkey: PublicKey,
    mintOwnerProgramId: PublicKey // TODO:
  ): Promise<TokenBalanceDto> {
    const balance = await this.getUserTokenBalance(
      solWeb3Conn,
      userPublicKey,
      mintAccountPubkey,
      mintOwnerProgramId
    );
    const name = await getTokenName(
      solWeb3Conn,
      mintAccountPubkey.toBase58()
    );

    if (balance.isZero()) {
      return {
        mint: mintAccountPubkey,
        amount: new BN(0),
        decimals: 0,
        uiAmount: 0,
        name,
      };
    }

    // Get mint info for decimals
    const mintInfo = await ResultUtils.wrap(
      getMint(solWeb3Conn, mintAccountPubkey, "confirmed", mintOwnerProgramId)
    );
    if (ResultUtils.isErr(mintInfo)) {
      return {
        mint: mintAccountPubkey,
        amount: balance,
        decimals: 0,
        uiAmount: 0,
        name,
      };
    }
    const mintInfoData = ResultUtils.unwrap(mintInfo);

    return {
      mint: mintAccountPubkey,
      amount: balance,
      decimals: mintInfoData.decimals,
      uiAmount: balance.toNumber() / Math.pow(10, mintInfoData.decimals),
      name,
    };
  }

  static async getUserWalletBalancesDto(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    mintOwnerProgramId: PublicKey // TODO:
  ): Promise<WalletBalancesDto> {
    const solBalance = await this.getUserSolWrappedAndUnwrapped(
      solWeb3Conn,
      userPublicKey
    );
    const tokenBalances: TokenBalanceDto[] = [];

    const tokenAccounts = await ResultUtils.wrap(
      solWeb3Conn.getParsedTokenAccountsByOwner(userPublicKey, {
        programId: mintOwnerProgramId,
      })
    );
    if (ResultUtils.isErr(tokenAccounts)) {
      return {
        solBalance: solBalance.unwrapped,
        tokenBalances: [],
      };
    }

    for (const { account } of ResultUtils.unwrap(tokenAccounts).value) {
      const parsedInfo = account.data.parsed.info;
      const mint = new PublicKey(parsedInfo.mint);
      const amount = new BN(parsedInfo.tokenAmount.amount);
      const decimals = parsedInfo.tokenAmount.decimals;
      const uiAmount = parsedInfo.tokenAmount.uiAmount || 0;
      const name = await getTokenName(solWeb3Conn, parsedInfo.mint);

      // Skip empty balances
      if (amount.gt(new BN(0))) {
        tokenBalances.push({
          mint,
          amount,
          decimals,
          uiAmount,
          name: name,
        });
      }
    }

    return {
      solBalance: solBalance.unwrapped,
      tokenBalances,
    };
  }

  /**
   * Check if wallet has sufficient SOL for a swap (including gas fees)
   */
  static async hasSufficientSol(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    requiredAmount: BN,
    includeGasFee: boolean = true
  ): Promise<boolean> {
    const balanceInfo = await this.getUserSolWrappedAndUnwrapped(
      solWeb3Conn,
      userPublicKey
    );

    if (includeGasFee) {
      // Add estimated gas fee (0.01 SOL should be enough for most swaps)
      const gasFee = new BN(10_000_000); // 0.01 SOL in lamports
      return balanceInfo.total.gte(requiredAmount.add(gasFee));
    }

    return balanceInfo.total.gte(requiredAmount);
  }

  /**
   * Check if wallet has sufficient tokens for a sell operation
   */
  static async hasSufficientTokens(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    tokenMint: PublicKey,
    requiredAmount: BN
  ): Promise<boolean> {
    const balance = await this.getUserTokenBalance(
      solWeb3Conn,
      userPublicKey,
      tokenMint,
      TOKEN_PROGRAM_ID
    );
    return balance.gte(requiredAmount);
  }

  static async hasSufficientBalance(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    tokenMint: PublicKey,
    requiredAmount: BN
  ): Promise<boolean> {
    if (tokenMint.equals(COIN_TYPE_WSOL_MINT)) {
      return this.hasSufficientSol(
        solWeb3Conn,
        userPublicKey,
        requiredAmount,
        true
      );
    }

    return this.hasSufficientTokens(
      solWeb3Conn,
      userPublicKey,
      tokenMint,
      requiredAmount
    );
  }

  /**
   * Calculate sell amount based on percentage
   */
  static async calculateSellAmount(
    solWeb3Conn: Connection,
    userPublicKey: PublicKey,
    tokenMint: PublicKey,
    percentage: number
  ): Promise<BN | null> {
    if (percentage <= 0 || percentage > 1) {
      throw new Error("Percentage must be between 0 and 1");
    }

    const tokenBalance = await this.getUserTokenBalance(
      solWeb3Conn,
      userPublicKey,
      tokenMint,
      TOKEN_PROGRAM_ID // TODO:
    );

    if (tokenBalance.isZero()) {
      return null;
    }

    if (percentage === 1) {
      // Sell 100% - return exact balance
      return tokenBalance;
    }

    // Calculate percentage amount
    return tokenBalance.muln(percentage * 10000).divn(10000);
  }

  /**
   * Convert SOL amount to lamports
   */
  static solToLamports(solAmount: number): BN {
    return new BN(Math.floor(solAmount * 1_000_000_000));
  }

  /**
   * Convert lamports to SOL
   */
  static lamportsToSol(lamports: BN): number {
    return lamports.toNumber() / 1_000_000_000;
  }

  /**
   * Format token amount for display
   */
  static formatTokenAmount(amount: BN, decimals: number): string {
    const divisor = new BN(10).pow(new BN(decimals));
    const quotient = amount.div(divisor);
    const remainder = amount.mod(divisor);

    if (remainder.isZero()) {
      return quotient.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, "0");
    const trimmedRemainder = remainderStr.replace(/0+$/, "");

    if (trimmedRemainder === "") {
      return quotient.toString();
    }

    return `${quotient.toString()}.${trimmedRemainder}`;
  }
}
