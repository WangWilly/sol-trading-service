#!/usr/bin/env bun

import { Command } from "commander";

const program = new Command();

program
  .version("1.0.0")
  .description("Solana Copy Trading Service CLI")
  .option("-k, --private-key <string>", "Private key (base58 encoded) for the wallet")
  .option("-l, --language <string>", "Language for new CLI (en|zh)", "en");

program.parse(process.argv);
const options = program.opts();

if (!options.privateKey) {
  console.error("❌ Error: Private key is required. Use -k or --private-key option.");
  process.exit(1);
}

// Import and run the new modular CLI
process.argv = [
  process.argv[0], 
  process.argv[1], 
  '-k', options.privateKey,
  '-l', options.language
];

import("./cli/index").catch((error) => {
  console.error("❌ Error loading modular CLI:", error);
  process.exit(1);
});
