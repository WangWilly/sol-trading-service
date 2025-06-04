import { v4 as uuidv4 } from "uuid";

export class UUID {
  /**
   * Generates a new UUID
   * @returns {string} A new UUID
   */
  static generate(): string {
    return uuidv4();
  }
}
