import WebSocket from "ws";

import { Logs } from "@solana/web3.js";

import { LOGS_SUBSCRIBE_FIXED_ID, LOGS_UNSUBSCRIBE_FIXED_ID } from "./const";
import { logsSubscribe, logsUnsubscribe } from "./utils";

import { ConsoleLogger, Logger } from "../../utils/logging";
import { CopyTradeHelper } from "../copyTradeHelper";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsHelper {
  private ws: WebSocket | null = null;
  private publicKeySubIdMap: Map<string, number> = new Map();

  //////////////////////////////////////////////////////////////////////////////

  constructor(
    private readonly wsRpcUrl: string,
    private readonly copyTradeHelper: CopyTradeHelper,
    private readonly logger: Logger = new ConsoleLogger("SolRpcWsClient")
  ) {}

  //////////////////////////////////////////////////////////////////////////////

  public start(): void {
    if (this.ws) {
      return;
    }
    this.connect();
  }

  public updateLogsSubscription(): void {
    this.start(); // Ensure WebSocket connection is established
    if (!this.ws) {
      this.logger.warn("⚠️ WebSocket 未連接，無法更新訂閱...");
      return;
    }

    const currTargetPublicKeySet = new Set(this.copyTradeHelper.getCopyTradeTargetPublicKeys());
    const toBeRemovedPublicKeys: string[] = [];
    for (const [publicKey, subId] of this.publicKeySubIdMap) {
      if (currTargetPublicKeySet.has(publicKey)) {
        continue;
      }
      logsUnsubscribe(this.ws, publicKey, subId, toBeRemovedPublicKeys);
    }
    for (const publicKey of toBeRemovedPublicKeys) {
      this.publicKeySubIdMap.delete(publicKey);
    }

    for (const publicKey of this.copyTradeHelper.getCopyTradeTargetPublicKeys()) {
      if (this.publicKeySubIdMap.has(publicKey)) {
        continue;
      }
      logsSubscribe(this.ws, publicKey, this.publicKeySubIdMap);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

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

    this.publicKeySubIdMap.clear();
    for (const publicKey of this.copyTradeHelper.getCopyTradeTargetPublicKeys()) {
      logsSubscribe(this.ws, publicKey, this.publicKeySubIdMap);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async onMessage(data: any): Promise<void> {
    const message = JSON.parse(data.toString());

    if (message.id === LOGS_SUBSCRIBE_FIXED_ID) {
      this.logger.log(`✅ 訂閱成功! Subscription ID: ${message.result}`);
      this.publicKeySubIdMap.set(message.params.result.value, message.result);
    }

    if (message.id === LOGS_UNSUBSCRIBE_FIXED_ID) {
      this.logger.log(`Unsubscribe status: ${message.result}`);
    }

    if (message.method === "logsNotification") {
      if (!this.publicKeySubIdMap.get(message.params.subscription)) {
        this.logger.warn(`⚠️ 未知的訂閱 ID: ${message.params.subscription}`);
        logsUnsubscribe(this.ws!, "", message.params.subscription, []);
        return;
      }
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
