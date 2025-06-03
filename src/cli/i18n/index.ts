import { Language, Messages } from './types';
import { englishMessages } from './en';
import { chineseMessages } from './zh';

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
}

export const i18n = new I18n();
export { Language } from './types';
