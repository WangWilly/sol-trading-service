////////////////////////////////////////////////////////////////////////////////

export interface Logger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

////////////////////////////////////////////////////////////////////////////////

export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}

  log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.name}] ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.name}] ${message}`);
  }
}

////////////////////////////////////////////////////////////////////////////////
