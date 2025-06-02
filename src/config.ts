import * as dotenv from "dotenv";

////////////////////////////////////////////////////////////////////////////////

dotenv.config();

export const PRIVATE_KEY_BASE58 = process.env.PRIVATE_KEY_BASE58 || "";
export const NOT_USE_CLI = process.env.NOT_USE_CLI === "true";
export const LOG_TYPE = NOT_USE_CLI ? "pretty" : "json";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const LOG_FILE_PATH = process.env.LOG_FILE_PATH || "data/logHistory.json";

// Persistence configuration
export const ENABLE_PERSISTENCE = process.env.ENABLE_PERSISTENCE !== "false"; // Default to true
export const PERSISTENCE_DATA_PATH = process.env.PERSISTENCE_DATA_PATH || "data/strategies.json";
