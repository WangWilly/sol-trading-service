import WebSocket from "ws";

import { Logs } from "@solana/web3.js";

import {
  buildRpcIdGenerator,
  logsSubscribe,
  logsUnsubscribe,
  PublicKeySubIdMap,
  RpcId,
  RpcIdGenerator,
  RpcIdpubKeyMap4SubUnsub,
  RpcIdRange,
} from "./utils";

import { ConsoleLogger, Logger } from "../../utils/logging";
import { CopyTradeHelper } from "../copyTradeHelper";

////////////////////////////////////////////////////////////////////////////////

export class SolRpcWsHelper {
  private ws: WebSocket | null = null;

  //////////////////////////////////////////////////////////////////////////////

  private publicKeySubIdMap: PublicKeySubIdMap = new Map();

  private rpcIdpubKeyMap4Sub: RpcIdpubKeyMap4SubUnsub = new Map();
  private rpcIdRange4Sub: RpcIdRange = { start: 1001, end: 1500 };
  private currRpcId4SubUnsub: RpcId = { curr: 1001 };
  private rpcIdGen4Sub: RpcIdGenerator = buildRpcIdGenerator(
    this.rpcIdRange4Sub,
    this.rpcIdpubKeyMap4Sub,
    this.currRpcId4SubUnsub
  );

  private rpcIdpubKeyMap4Unsub: RpcIdpubKeyMap4SubUnsub = new Map();
  private rpcIdRange4Unsub: RpcIdRange = { start: 1501, end: 2000 };
  private currRpcId4Unsub: RpcId = { curr: 1501 };
  private rpcIdGen4Unsub: RpcIdGenerator = buildRpcIdGenerator(
    this.rpcIdRange4Unsub,
    this.rpcIdpubKeyMap4Unsub,
    this.currRpcId4Unsub
  );

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

  // https://stackoverflow.com/questions/37764665/how-to-implement-sleep-function-in-typescript
  async updateLogsSubscription(): Promise<void> {
    this.start(); // Ensure WebSocket connection is established
    if (!this.ws) {
      this.logger.warn("No WebSocket connection available");
      return;
    }
    while (this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn("WebSocket not ready yet, waiting for 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const currTargetPublicKeySet = new Set(
      this.copyTradeHelper.getCopyTradeTargetPublicKeys()
    );
    const prevPublicKeySubIdEntries = Array.from(
      this.publicKeySubIdMap.entries()
    );
    for (const [publicKey, subId] of prevPublicKeySubIdEntries) {
      if (currTargetPublicKeySet.has(publicKey)) {
        continue;
      }
      logsUnsubscribe(
        this.ws,
        this.rpcIdGen4Unsub,
        subId,
        publicKey,
        this.publicKeySubIdMap
      );
    }
    for (const publicKey of this.copyTradeHelper.getCopyTradeTargetPublicKeys()) {
      if (this.publicKeySubIdMap.has(publicKey)) {
        continue;
      }
      logsSubscribe(
        this.ws,
        this.rpcIdGen4Sub,
        publicKey,
        this.publicKeySubIdMap
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.ws) {
      return;
    }
    this.logger.log("Stopping WebSocket connection...");
    this.ws.close();
    while (this.ws.readyState !== WebSocket.CLOSED) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.ws = null;
    this.logger.log("WebSocket connection stopped.");
  }

  //////////////////////////////////////////////////////////////////////////////

  private connect(): void {
    if (this.ws) {
      this.logger.log("🔄 重新連接 WebSocket...");
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsRpcUrl);
    this.ws.on("open", () => this.onOpen());
    this.ws.on("message", (data) => this.onMessage(data));
    this.ws.on("close", () => {});
    this.ws.on("error", (error) => {
      this.logger.warn(`❌ WebSocket 錯誤: ${error}`);
    });

    setInterval(() => {
      if (this.ws === null) {
        this.logger.warn("Heartbeat: WebSocket is null, stopping...");
        this.stop();
        return;
      }
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      } else {
        this.logger.warn("Heartbeat: lost connection, reconnecting...");
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
      logsSubscribe(
        this.ws,
        this.rpcIdGen4Sub,
        publicKey,
        this.publicKeySubIdMap
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async onMessage(data: WebSocket.Data): Promise<void> {
    const message = JSON.parse(data.toString());

    if (this.rpcIdpubKeyMap4Sub.has(message.id)) {
      const publicKey = this.rpcIdpubKeyMap4Sub.get(message.id);
      if (!publicKey) {
        this.logger.error(`❌ 未知的公鑰: ${publicKey}`);
        return;
      }
      const subId = message.result;
      this.logger.log(
        `✅ Subscription success for ${publicKey} w/ msgId ${message.id}, subId: ${subId}`
      );
      this.publicKeySubIdMap.set(publicKey, subId);
      this.rpcIdpubKeyMap4Sub.delete(message.id);
      return;
    }

    if (this.rpcIdpubKeyMap4Unsub.has(message.id)) {
      const publicKey = this.rpcIdpubKeyMap4Unsub.get(message.id);
      if (!publicKey) {
        this.logger.error(`❌ 未知的公鑰: ${publicKey}`);
        return;
      }
      this.logger.log(
        `✅ Unsubscription success for ${publicKey} w/ msgId: ${message.id}`
      );
      this.publicKeySubIdMap.delete(publicKey);
      this.rpcIdpubKeyMap4Unsub.delete(message.id);
      return;
    }

    if (message.method === "logsNotification") {
      if (
        !new Set(this.publicKeySubIdMap.values()).has(
          message.params.subscription
        )
      ) {
        this.logger.warn(`⚠️ 未知的訂閱 ID: ${message.params.subscription}`);
        logsUnsubscribe(
          this.ws!,
          this.rpcIdGen4Unsub,
          message.params.subscription
        );
        return;
      }
      this.onLogs(message.params.result.value as Logs);
      return;
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
