import { CliApplication } from "./app";
import { i18n } from "./i18n";

async function main(): Promise<void> {
  const app = new CliApplication();
  
  // Setup signal handlers for graceful shutdown
  app.setupSignalHandlers();
  
  // Start the application
  await app.run();
}

// Start the CLI
main().catch((error) => {
  console.error(`${i18n.t('errorInCli')}: ${error}`);
  process.exit(1);
});
