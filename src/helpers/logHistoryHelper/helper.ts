import * as fs from "fs";
import * as path from "path";

export class LogHistoryHelper {
  static logFilePath = path.join(process.cwd(), "logs", "logHistory.json");
  static inMemoryLogs: any[] = [];

  static ensureLogDirectory() {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static getLogHistory() {
    // If in-memory logs are empty, try to load from file
    if (this.inMemoryLogs.length === 0) {
      this.ensureLogDirectory();
      try {
        if (fs.existsSync(this.logFilePath)) {
          const logData = fs.readFileSync(this.logFilePath, "utf8");
          this.inMemoryLogs = JSON.parse(logData);
        }
      } catch (error) {
        console.error("Error reading log history:", error);
      }
    }
    return this.inMemoryLogs;
  }

  static addLogEntry(entry: any) {
    // Just add to in-memory logs without writing to file
    this.inMemoryLogs.push(entry);
  }

  static saveLogsToFile() {
    this.ensureLogDirectory();
    try {
      fs.writeFileSync(
        this.logFilePath,
        JSON.stringify(this.inMemoryLogs, null, 2),
        "utf8",
      );
      console.log("Log history saved to file");
    } catch (error) {
      console.error("Error saving log history to file:", error);
    }
  }

  static listLogHistory(): any[] {
    const logHistory = this.getLogHistory();
    return logHistory.map((entry: any, index: number) => ({
      ...entry,
      index: index + 1,
    }));
  }

  static clearLogHistory() {
    this.inMemoryLogs = [];
    this.ensureLogDirectory();
    fs.writeFileSync(this.logFilePath, JSON.stringify([]), "utf8");
  }
}

export const transportFunc = (logObj: any): void => {
  LogHistoryHelper.addLogEntry(logObj);
};
