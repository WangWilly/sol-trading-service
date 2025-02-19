/**
import { TIPS_ADDRESSES } from './const';
import {
  TransactionResultSchema,
  TransactionResultDto,
  SwapDetailSchema,
  SwapDetailDto,
} from './dtos';
const BN = require('bn.js');

////////////////////////////////////////////////////////////////////////////////

// TODO: deprecated
function parseSwapTransaction(
  transactionResult: TransactionResultDto
): SwapDetailDto | {} {
  try {
    // 初始化事件物件
    const event = SwapDetailSchema.parse({
      msg_hash: transactionResult.transaction.signatures[0] || '',
      timestamp: (transactionResult.blockTime || 0) * 1000,
      block: transactionResult.slot || 0,
      status: '',
      signer: '',
      fromCoinType: '',
      fromCoinAmount: new BN(0),
      fromCoinPreBalance: new BN(0),
      fromCoinPostBalance: new BN(0),
      toCoinType: '',
      toCoinAmount: new BN(0),
    });

    if (transactionResult.meta?.err) {
      event.status = JSON.stringify(transactionResult.meta.err);
      return event;
    }

    const transactionMessage = transactionResult.transaction.message;
    const accountKeys = transactionMessage.accountKeys.map((key) => key.pubkey);

    const solBalanceChanges = transactionResult?.meta?.postBalances.map(
      (balance, index) =>
        new BN(balance) - new BN(transactionResult?.meta?.preBalances[index])
    );

    // Signer 是第一個 account key
    const signer = accountKeys[0];

    const signerSolBalanceChange =
      new BN(transactionResult.meta?.postBalances[0]) -
      new BN(transactionResult.meta?.preBalances[0]);

    // 找出轉給 Vault 的 SOL 交易
    const solTransferTxs = transactionMessage.instructions.filter(
      (instruction) =>
        instruction.programId === '11111111111111111111111111111111'
    );

    // 獲取簽名者的 Token 變動
    const postTokenBalances =
      transactionResult.meta?.postTokenBalances?.filter(
        (t) => t.owner === signer
      ) || [];
    const preTokenBalances =
      transactionResult.meta?.preTokenBalances?.filter(
        (t) => t.owner === signer
      ) || [];

    const signerTokenBalancesChanges = postTokenBalances.map(
      (postTokenBalance, index) => {
        const preTokenBalance = preTokenBalances[index];

        return {
          mint: postTokenBalance.mint,
          amount:
            postTokenBalance.uiTokenAmount.amount -
            preTokenBalance.uiTokenAmount.amount,
        };
      }
    );

    const createAccountFees = solBalanceChanges
      ?.filter((balance) => balance == 2039280)
      .reduce((total, balance) => total + balance, 0);

    const transferAmounts = solTransferTxs.reduce((total, tx) => {
      if (TIPS_ADDRESSES.has(tx?.parsed?.info?.destination as string)) {
        return new BN(total).add(new BN(tx?.parsed?.info?.lamports, 10));
      }

      // return new BN(total).add(new BN(tx?.parsed?.info?.lamports, 10));
    }, new BN(0));

    if (signerTokenBalancesChanges.length == 1) {
      // native <-> token
      const isBuy = signerTokenBalancesChanges[0].amount > 0;
      const fromCoinType = isBuy ? 'SOL' : postTokenBalances[0].mint;

      event.signer = signer;
      event.fromCoinType = fromCoinType;
      event.fromCoinAmount = isBuy
        ? new BN(signerSolBalanceChange)
            .abs()
            .sub(new BN(createAccountFees))
            .sub(new BN(transactionResult.meta?.fee))
            .sub(transferAmounts)
            .toString()
        : new BN(signerTokenBalancesChanges[0].amount).abs().toString();

      event.fromCoinPreBalance = new BN(
        isBuy
          ? transactionResult.meta?.preBalances[0]
          : preTokenBalances[0].uiTokenAmount.amount
      ).toString();

      event.fromCoinPostBalance = new BN(
        isBuy
          ? transactionResult.meta?.postBalances[0]
          : postTokenBalances[0].uiTokenAmount.amount
      ).toString();

      event.toCoinType = isBuy ? postTokenBalances[0].mint : 'SOL';
      event.toCoinAmount = isBuy
        ? new BN(signerTokenBalancesChanges[0].amount).toString()
        : new BN(signerSolBalanceChange)
            .add(new BN(createAccountFees))
            .add(new BN(transactionResult.meta?.fee))
            .add(transferAmounts)
            .toString();
    } else if (signerTokenBalancesChanges.length == 2) {
      const buyIndex = signerTokenBalancesChanges[0].amount < 0 ? 0 : 1;

      const fromCoinPreBalanceIndex = preTokenBalances.findIndex(
        (balance) => balance.mint === postTokenBalances[buyIndex].mint
      );
      const fromCoinPostBalanceIndex = postTokenBalances.findIndex(
        (balance) => balance.mint === postTokenBalances[buyIndex].mint
      );

      event.signer = signer;
      event.fromCoinType = postTokenBalances[buyIndex].mint;
      event.fromCoinAmount = new BN(signerTokenBalancesChanges[buyIndex].amount)
        .abs()
        .toString();
      event.fromCoinPreBalance = new BN(
        preTokenBalances[fromCoinPreBalanceIndex].uiTokenAmount.amount
      ).toString();
      event.fromCoinPostBalance = new BN(
        postTokenBalances[fromCoinPostBalanceIndex].uiTokenAmount.amount
      ).toString();
      event.toCoinType = postTokenBalances[1 - buyIndex].mint;
      event.toCoinAmount = new BN(
        signerTokenBalancesChanges[1 - buyIndex].amount
      )
        .abs()
        .toString();
    } else {
      throw new Error('Signer token balances changes length is more than 2');
    }

    return event;

    return {};
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return {};
  }
}

export { parseSwapTransaction };
*/
