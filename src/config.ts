import * as dotenv from "dotenv";

////////////////////////////////////////////////////////////////////////////////

dotenv.config();

export const PRIVATE_KEY_BASE58 = process.env.PRIVATE_KEY_BASE58 || "";
