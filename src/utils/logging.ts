import { Logger as TsLogger, ILogObj, ISettings } from "tslog";

/**
////////////////////////////////////////////////////////////////////////////////

export interface Logger {
  logInfo(message: string): void;
  logWarn(message: string): void;
  logError(message: string): void;
}

////////////////////////////////////////////////////////////////////////////////

export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}

  logInfo(message: string): void {
    console.log(`\x1b[34m[${this.name}]\x1b[0m ${message}`);
  }

  logWarn(message: string): void {
    console.log(`\x1b[33m[${this.name}]\x1b[0m ${message}`);
  }

  logError(message: string): void {
    console.log(`\x1b[31m[${this.name}]\x1b[0m ${message}`);
  }
}
*/

////////////////////////////////////////////////////////////////////////////////

export type Logger = TsLogger<ILogObj>;
export const TsLogLogger = TsLogger<ILogObj> as any as new (options?: {
  name?: string;
  type?: "pretty" | "json" | "hidden";
  minLevel?: number;
  prettyInspectOptions?: import("util").InspectOptions;
  maskValuesOfKeys?: string[];
  maskValuesOfKeysCaseInsensitive?: boolean;
  maskPlaceholder?: string;
  hideDate?: boolean;
  hideLevel?: boolean;
  hideName?: boolean;
  hideMeta?: boolean;
  showLogName?: boolean;
  showDateTime?: boolean;
  showInspectData?: boolean;
  showMeta?: boolean;
  showLineNumber?: boolean;
  dateTimePattern?: string;
  dateTimeTimezone?: string;
  attachTransport?: (transportLogger: ILogObj & { [key: string]: any }) => void;
  transportJSON?: (json: unknown) => void;
  overwrite?: {
    transportFormatted?: (
      logMetaMarkup: string,
      logArgs: unknown[],
      logErrors: string[],
      settings: ISettings<ILogObj>,
    ) => void;
    transportJSON?: (json: unknown) => void;
  };
}) => Logger;
