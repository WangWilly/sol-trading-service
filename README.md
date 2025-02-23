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

- [Jupyter](https://jup.ag/): handling the Tx
    - [Usage](https://station.jup.ag/docs/)
    - [Api brief](https://station.jup.ag/docs/swap-api/get-quote)
    - [Api full](https://station.jup.ag/docs/api/introduction)
    - [Supported dex](https://api.jup.ag/swap/v1/program-id-to-label)
- Fee/Tip optimizing
    - https://solana.com/docs/core/fees
        - 📌 https://solana.com/developers/guides/advanced/how-to-request-optimal-compute
        - https://github.com/solana-developers/helpers
        - 🍭 https://solana.com/developers/guides/advanced/how-to-optimize-compute
    - https://www.reddit.com/r/solana/comments/1hudi6t/how_do_you_only_get_a_transaction_fee_of_0000005/
    - 🍭 https://www.quicknode.com/docs/solana/transactions
    - 🍭 https://solana.stackexchange.com/questions/11860/how-to-optimize-transaction-speed
    - 🥵 https://solanacompass.com/statistics/fees
    - https://station.jup.ag/docs/old/apis/landing-transactions
    - 📌 https://station.jup.ag/docs/api/swap-instructions
        - 🥵 https://solana.stackexchange.com/questions/19136/how-to-get-a-swap-transaction-from-jupiter-api-which-uses-a-priority-fee-and-jit
    - https://solana.com/developers/guides/advanced/how-to-use-priority-fees
    - 🤔 https://docs.helius.dev/solana-apis/priority-fee-api
    - https://docs.jito.wtf/lowlatencytxnsend/#tip-amount
    - https://www.reddit.com/r/solana/comments/1bjh2g5/understanding_the_transaction_fees_on_a_jupiter/
