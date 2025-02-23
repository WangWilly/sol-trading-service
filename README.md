# Core (service) for copy trading

This module will be frequently updated. Serve as listener for the target account and copy the trades to the source account.

## Development

### Testing

```bash
./scripts/test-jup-client.sh
```

### Running

```bash
./scripts/trade-serve.sh
```

## References

- [Jupyter](https://jup.ag/): handling the tx
    - [Usage](https://station.jup.ag/docs/)
    - [Api brief](https://station.jup.ag/docs/swap-api/get-quote)
    - [Api full](https://station.jup.ag/docs/api/introduction)
    - [Supported dex](https://api.jup.ag/swap/v1/program-id-to-label)
    - APIs
        - [Does Jupiter swap charge any fees?](https://station.jup.ag/guides/general/faq#does-jupiter-swap-charge-any-fees)
            - [Solscan: Jupiter Platform Fee address has been renamed to avoid potential confusion](https://www.bbx.com/news-detail/1898146)
        - https://station.jup.ag/docs/old/apis/landing-transactions
        - 📌 https://station.jup.ag/docs/api/swap-instructions
        - 🥵 https://solana.stackexchange.com/questions/19136/how-to-get-a-swap-transaction-from-jupiter-api-which-uses-a-priority-fee-and-jit
    - [Understanding the transaction fees on a Jupiter swap](https://www.reddit.com/r/solana/comments/1bjh2g5/understanding_the_transaction_fees_on_a_jupiter/)
- Fee/Tip optimizing
    - https://solana.com/developers/guides/advanced/how-to-use-priority-fees
        - 🤔 https://docs.helius.dev/solana-apis/priority-fee-api
    - https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/
    - https://solana.stackexchange.com/questions/11860/how-to-optimize-transaction-speed
    - [Solana Fees + Burn Tracker](https://solanacompass.com/statistics/fees)
    - [Transaction Fees](https://solana.com/docs/core/fees)
        - 📌 [How to Request Optimal Compute Budget](https://solana.com/developers/guides/advanced/how-to-request-optimal-compute)
            - [JS/TS helpers for Solana](https://github.com/solana-developers/helpers)
        - 📖 [How to Optimize Compute Usage on Solana - Smart Contract](https://solana.com/developers/guides/advanced/how-to-optimize-compute)
    - Jito tips
        - https://www.quicknode.com/docs/solana/transactions
        - https://docs.jito.wtf/lowlatencytxnsend/#tip-amount
- Reading list
    - [ ] https://documentation.axenai.com/axen-sniper-bot/settings-command
    - [ ] https://solana.stackexchange.com/questions/13356/how-to-add-my-own-fee-to-jupiter-swap
