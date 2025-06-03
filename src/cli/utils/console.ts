import { i18n } from "../i18n";

export class ConsoleUtils {
  static refreshConsole(): void {
    // Clear the console using the cross-platform method
    console.clear();

    // Re-display the header for visual consistency
    console.log(`       ${i18n.t('mainMenuTitle')}       \n`);
  }

  static displayHeader(): void {
    console.log(`\n==============================================`);
    console.log(`       ${i18n.t('mainMenuTitle')}       `);
    console.log(`==============================================\n`);
  }

  static logError(message: string): void {
    console.log(`${i18n.t('error')}: ${message}`);
  }

  static logSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  static logWarning(message: string): void {
    console.log(`⚠️ ${message}`);
  }

  static logInfo(message: string): void {
    console.log(`ℹ️ ${message}`);
  }
}
