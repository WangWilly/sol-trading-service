import {
  TransactionResultSchema,
  TransactionResultDto,
  SwapDetailSchema,
  SwapDetailDto,
} from './dtos';
const BN = require('bn.js');

const TIPS_ADDRESSES = [
  // Jito
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
  // BloxRoute
  'HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY',
  '95cfoy472fcQHaw4tPGBTKpn6ZQnfEPfBgDQx6gcRmRg',
  //Jupiter
  '45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpye7Hp',
  'EcDs7cZxDHnGtjBuL6E1QC5smfPaBVWbdTShCXyor6H3',
  // PinkPunk
  'DShXwLqk6ZHZFtdzE8HMDsGJLhEvrxgRdB5K16V28arK',
  // bullx
  'F4hJ3Ee3c5UuaorKAMfELBjYCjiiLH75haZTKqTywRP3',
  //phonton
  'AVUCZyuT35YSuj4RH7fwiyPu82Djn2Hfg7y2ND2XcnZH',
  //pepeboost
  'G9PhF9C9H83mAjjkdJz4MDqkufiTPMJkx7TnKE1kFyCp',
  //gmgn
  'BB5dnY55FXS1e1NXqZDwCzgdYJdMCj3B92PU6Q5Fb6DT',
  //sol trading bot
  'HEPL5rTb6n1Ax6jt9z2XMPFJcDe9bSWvWQpsK7AMcbZg',
  // Bonk
  'ZG98FUCjb8mJ824Gbs6RsgVmr1FhXb2oNiJHa2dwmPd',
];

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
      if (TIPS_ADDRESSES.includes(tx?.parsed?.info?.destination as string)) {
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
