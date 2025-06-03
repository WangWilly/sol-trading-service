import { i18n } from "../i18n";
import { ServiceComponents } from "../types/services";
import { LogHistoryHelper } from "../../helpers/logHistoryHelper/helper";
import { getWalletTokenAssets } from "../../utils/tokenAsset";

export class DisplayCommands {
  constructor(private services: ServiceComponents) {}

  async displayStatus(): Promise<void> {
    const wsStatus = this.services.solRpcWsHelper.getStatus();
    const activeStrategies = this.services.solRpcWsSubscribeManager.getAllCopyTradeRecords().length;

    console.log(i18n.t('serviceStatusTitle'));
    console.log(
      `${i18n.t('wsConnection')}: ${
        wsStatus.connected ? i18n.t('connected') : i18n.t('disconnected')
      }`,
    );
    console.log(`${i18n.t('activeStrategies')}: ${activeStrategies}`);
    console.log(`${i18n.t('lastActivity')}: ${wsStatus.lastActivity || "N/A"}`);
    console.log(`${i18n.t('uptime')}: ${wsStatus.uptime || "N/A"}`);
  }

  async displayLogHistory(): Promise<void> {
    const logs = LogHistoryHelper.listLogHistory();

    if (logs.length === 0) {
      console.log(i18n.t('noLogsFound'));
      return;
    }

    console.log(`\n${i18n.t('logHistoryTitle')}`);

    logs.forEach((log: any) => {
      console.log(
        `\n${log.index}. ⏱️ ${new Date(log["_meta"].date).toLocaleString()}`,
      );
      console.log(`   📝 ${JSON.stringify(log["0"], null, 2)}`);
    });

    console.log(`\n${i18n.t('totalLogs')}: ${logs.length}`);
  }

  async displayWalletAssets(): Promise<void> {
    console.log(i18n.t('fetchingWalletAssets'));
    
    try {
      const assets = await getWalletTokenAssets(
        this.services.playerKeypair.publicKey,
        this.services.solWeb3Conn
      );

      if (assets.length === 0) {
        console.log(i18n.t('noTokenAssetsFound'));
        return;
      }

      console.log(`\n${i18n.t('walletAssetsTitle')}`);
      
      // First display the native SOL balance prominently
      const nativeSol = assets.find(asset => asset.mint === 'NATIVE-SOL');
      if (nativeSol) {
        console.log(`\n${i18n.t('nativeSolBalance')}: ${nativeSol.uiAmount} SOL (${nativeSol.amount} lamports)`);
      }
      
      // Then list all SPL tokens
      console.log(`\n${i18n.t('splTokens')}`);
      const splTokens = assets.filter(asset => asset.mint !== 'NATIVE-SOL');
      
      if (splTokens.length === 0) {
        console.log(`  ${i18n.t('noSplTokensFound')}`);
      } else {
        splTokens.forEach((asset, index) => {
          console.log(`\n${index + 1}. ${asset.name} (${asset.mint.slice(0, 6)}...${asset.mint.slice(-4)})`);
          console.log(`   ${i18n.t('amount')}: ${asset.uiAmount} (${asset.amount} raw)`);
          console.log(`   ${i18n.t('decimals')}: ${asset.decimals}`);
        });
      }
      
      console.log(`\n${i18n.t('totalSplTokens')}: ${splTokens.length}`);
    } catch (error) {
      console.error(`${i18n.t('errorFetchingAssets')}: ${error}`);
    }
  }
}
