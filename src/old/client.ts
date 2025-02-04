import minimist from 'minimist';

////////////////////////////////////////////////////////////////////////////////

type BaseInfo = {
    httpRpcUrl: string;
    wssRpcUrl: string;
    privateKey: string;
    targetAddress: string;
}

function userBaseInfo(): BaseInfo {
    const args = minimist(process.argv.slice(2));
    if (args['h'] || args['help']) {
        console.log('Usage: ts-node src/client.ts --http-rpc-url <URL> --wss-rpc-url <URL> --private-key <KEY> --target-address <ADDRESS>');
        process.exit(0);
    }

    const httpRpcUrl = args['http-rpc-url'] || 'https://api.mainnet-beta.solana.com';
    const wssRpcUrl = args['wss-rpc-url'] || 'wss://api.mainnet-beta.solana.com';
    const privateKey = args['private-key'] || '';
    if (!privateKey) {
        throw new Error('Private key is required');
    }
    const targetAddress = args['target-address'] || '';
    if (!targetAddress) {
        throw new Error('Target address is required');
    }

    return { httpRpcUrl, wssRpcUrl, privateKey, targetAddress };
}

////////////////////////////////////////////////////////////////////////////////

function main() {
    const baseInfo = userBaseInfo();
    console.log(baseInfo);

    // use them in the copyTrade function
}

main();
