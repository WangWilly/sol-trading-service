import WebSocket from "ws";

import { Logs } from "@solana/web3.js";

import { ConsoleLogger, Logger } from "./logging";
import { CopyTradeHelper } from "./copyTradeHelper";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsClient {
  private ws: WebSocket | null = null;

  //////////////////////////////////////////////////////////////////////////////

  constructor(
    private readonly wsRpcUrl: string,
    private readonly copyTradeHelper: CopyTradeHelper,
    private readonly logger: Logger = new ConsoleLogger("SolRpcWsClient"),
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  public start(): void {
    this.connect();
  }

  private connect(): void {
    if (this.ws) {
      this.logger.log("🔄 重新連接 WebSocket...");
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsRpcUrl);
    this.ws.on("open", this.onOpen);
    this.ws.on("message", this.onMessage);
    this.ws.on("close", () => {
      this.logger.warn("⚠️ WebSocket 連線斷開，5 秒後重新連線...");
      setTimeout(this.connect, 5000);
    });
    this.ws.on("error", (error) => {
      this.logger.warn(`❌ WebSocket 錯誤: ${error}`);
    });

    setInterval(() => {
      if (this.ws === null) {
        return;
      }
      if (this.ws.readyState === WebSocket.OPEN) {
        this.logger.log("💓 Heartbeat: WebSocket 仍然存活");
        this.ws.ping();
      } else {
        this.logger.warn("⚠️ WebSocket 可能已掉線，嘗試重連...");
        this.connect();
      }
    }, 30_000);
  }

  //////////////////////////////////////////////////////////////////////////////

  private onOpen(): void {
    if (!this.ws) {
      return;
    }
    this.logger.log(`🚀 WebSocket 連線成功: ${this.wsRpcUrl}`);

    const subscribeMsg = {
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",
      params: [
        { mentions: this.copyTradeHelper.getCopyTradeTargetPublicKeys() },
        { commitment: "confirmed" },
      ],
    };
    this.ws.send(JSON.stringify(subscribeMsg));
  }

  //////////////////////////////////////////////////////////////////////////////

  private async onMessage(data: any): Promise<void> {
    const message = JSON.parse(data.toString());

    if (message.result) {
      this.logger.log(`✅ 訂閱成功! Subscription ID: ${message.result}`);
    }

    if (message.method === "logsNotification") {
      this.onLogs(message.params.result.value as Logs);
    }
  }

  private async onLogs(logs: Logs): Promise<void> {
    this.logger.log("📜 收到新的交易日誌...");

    try {
      await this.copyTradeHelper.copyTradeHandler(logs);
    } catch (error) {
      this.logger.error(`❌ 跟單失敗: ${error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
}
