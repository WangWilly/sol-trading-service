import * as dotenv from "dotenv";

////////////////////////////////////////////////////////////////////////////////

dotenv.config();

export const PRIVATE_KEY_BASE58 = process.env.PRIVATE_KEY_BASE58 || "";
export const NOT_USE_CLI = process.env.NOT_USE_CLI === "true";
export const LOG_TYPE = NOT_USE_CLI ? "pretty" : "json";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
// export const LOG_FILE = process.env.LOG_FILE || "copy-trade-service.log";
