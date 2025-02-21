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

import { TsLogLogger } from "../../utils/logging";
import type { Logger } from "../../utils/logging";
import { CopyTradeHelperV2 } from "../copyTradeHelperV2";

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
    private readonly copyTradeHelper: CopyTradeHelperV2,
    private readonly logger: Logger = new TsLogLogger({
      name: "SolRpcWsHelper",
    })
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
      // this.logger.debug("[updateLogsSubscription] WebSocket not ready yet, waiting for 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    // this.logger.debug("[updateLogsSubscription] WebSocket is ready for logs subscription");

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

  public async getSubId(pubkey: string): Promise<number> {
    while (!this.publicKeySubIdMap.has(pubkey)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return this.publicKeySubIdMap.get(pubkey)!;
  }

  async stop(): Promise<void> {
    if (!this.ws) {
      return;
    }
    this.logger.info("Stopping WebSocket connection...");
    this.ws.close();
    while (this.ws.readyState !== WebSocket.CLOSED) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.ws = null;
    this.logger.info("WebSocket connection stopped.");
  }

  //////////////////////////////////////////////////////////////////////////////

  private connect(): void {
    if (this.ws) {
      this.logger.info("Closing existing WebSocket connection and reconnecting...");
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsRpcUrl);
    this.ws.on("open", () => this.onOpen());
    this.ws.on("message", (data) => this.onMessage(data));
    this.ws.on("close", () => {});
    this.ws.on("error", (error) => {
      this.logger.error(`WebSocket error: ${error}`);
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
        // TODO: Reconnect and refresh subscriptions in tradeHelper
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
    this.logger.info(`WebSocket connected to ${this.wsRpcUrl}`);

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
        this.logger.error(`Not recognnized public key ${publicKey}`);
        return;
      }
      const subId = message.result;
      this.logger.info(
        `Subscription success for ${publicKey} w/ msgId ${message.id}, subId: ${subId}`
      );
      this.publicKeySubIdMap.set(publicKey, subId);
      this.rpcIdpubKeyMap4Sub.delete(message.id);
      return;
    }

    if (this.rpcIdpubKeyMap4Unsub.has(message.id)) {
      const publicKey = this.rpcIdpubKeyMap4Unsub.get(message.id);
      if (!publicKey) {
        this.logger.error(`Not recognnized public key ${publicKey}`);
        return;
      }
      this.logger.info(
        `Unsubscription success for ${publicKey} w/ msgId: ${message.id}`
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
        this.logger.warn(`Unknown subscriptionId ${message.params.subscription}`);
        logsUnsubscribe(
          this.ws!,
          this.rpcIdGen4Unsub,
          message.params.subscription
        );
        return;
      }
      this.onLogs(message.params.subscription, message.params.result.value as Logs);
      return;
    }
  }

  private async onLogs(subId: number, logs: Logs): Promise<void> {
    // this.logger.debug("[onLogs] Processing incoming logs...");

    try {
      await this.copyTradeHelper.copyTradeHandler(subId, logs);
    } catch (error) {
      this.logger.error(
        `[onLogs] Copy trade error occurred: ${error} when handling tx: ${logs.signature}`
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////
}
