import { Language, Messages } from './types';
import { englishMessages } from './en';
import { chineseMessages } from './zh';
import { COIN_TYPE_USDC_MINT, COIN_TYPE_USDT_MINT, COIN_TYPE_WSOL_MINT } from '../../utils/constants';

////////////////////////////////////////////////////////////////////////////////

class I18n {
  private currentLanguage: Language = 'en';
  private messages: Record<Language, Messages> = {
    en: englishMessages,
    zh: chineseMessages,
  };

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: keyof Messages, ...args: string[]): string {
    let message = this.messages[this.currentLanguage][key];
    
    // Simple template replacement for arguments
    args.forEach((arg, index) => {
      message = message.replace(`{${index}}`, arg);
    });
    
    return message;
  }

  // Helper method for strategy success messages
  strategySellAmount(mintAddr: string): string {
    const mintAddrMessageMap: Record<string, keyof Messages> = {
      [COIN_TYPE_WSOL_MINT.toBase58()]: "enterSolAmount",
      [COIN_TYPE_USDC_MINT.toBase58()]: "enterUsdcAmount",
      [COIN_TYPE_USDT_MINT.toBase58()]: "enterUsdtAmount",
    };

    const messageKey = mintAddrMessageMap[mintAddr];
    if (!messageKey) {
      throw new Error(`Unsupported mint address: ${mintAddr}`);
    }
    return this.t(messageKey);
  }

  strategySuccess(strategyName: string, type: 'buy' | 'sell'): string {
    const typeText = type === 'buy' ? 
      (this.currentLanguage === 'zh' ? '买入' : 'Buy') :
      (this.currentLanguage === 'zh' ? '卖出' : 'Sell');
    
    return `✅ ${typeText}${this.t('strategyCreatedSuccessfully')}`;
  }

  // Helper method for strategy removal success
  strategyRemovalSuccess(strategyName: string): string {
    return `✅ ${this.currentLanguage === 'zh' ? '策略' : 'Strategy'} "${strategyName}" ${this.t('strategyRemovedSuccessfully')}`;
  }
  strategyRemovalFailed(strategyName: string): string {
    return `❌ ${this.currentLanguage === 'zh' ? '移除策略失败' : 'Failed to remove strategy'} "${strategyName}"`;
  }
}

////////////////////////////////////////////////////////////////////////////////

export const i18n = new I18n();
export { Language } from './types';
