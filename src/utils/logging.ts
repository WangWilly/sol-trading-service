import { Logger as TsLoggerType, ILogObj, ISettings } from "tslog";

////////////////////////////////////////////////////////////////////////////////

export interface Logger {
  info(...args: unknown[]): unknown;
  warn(...args: unknown[]): unknown;
  error(...args: unknown[]): unknown;
  debug(...args: unknown[]): unknown;
}

////////////////////////////////////////////////////////////////////////////////

export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}

  info(message: string): void {
    console.log(`\x1b[34m[${this.name}]\x1b[0m ${message}`);
  }

  warn(message: string): void {
    console.log(`\x1b[33m[${this.name}]\x1b[0m ${message}`);
  }

  error(message: string): void {
    console.log(`\x1b[31m[${this.name}]\x1b[0m ${message}`);
  }

  debug(message: string): void {
    console.log(`\x1b[90m[${this.name}]\x1b[0m ${message}`);
  }
}

////////////////////////////////////////////////////////////////////////////////

export type TsLogger = TsLoggerType<ILogObj>;
export const TsLogLogger = TsLoggerType<ILogObj> as any as new (options?: {
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
}) => TsLogger;
