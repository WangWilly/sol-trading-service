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
    console.log(`\x1b[34m[${this.name}]\x1b[0m ${message}`);
  }

  warn(message: string): void {
    console.log(`\x1b[33m[${this.name}]\x1b[0m ${message}`);
  }

  error(message: string): void {
    console.log(`\x1b[31m[${this.name}]\x1b[0m ${message}`);
  }
}

////////////////////////////////////////////////////////////////////////////////
