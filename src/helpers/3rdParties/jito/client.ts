import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  CONTENT_TYPE_KEY,
  CONTENT_TYPE_VAL_JSON,
  JITO_TOKEN_KEY,
} from "../../../utils/constants";
import { safe } from "../../../utils/exceptions";
import { HttpClient } from "../../../utils/httpClient";
import { Logger, TsLogLogger } from "../../../utils/logging";

import {
  GetPercentileTip,
  GetTipInfoV1ResultDto,
  GetTipInfoV1ResultDtoSchema,
  SendTransactionV1ResultDto,
  SendTransactionV1ResultDtoSchema,
} from "./dtos";

////////////////////////////////////////////////////////////////////////////////

// https://github.com/jito-labs/jito-js-rpc
// https://docs.jito.wtf/
// https://www.quicknode.com/guides/solana-development/transactions/jito-bundles

export class JitoClient {
  private readonly blockEngineBaseClient: HttpClient;
  private readonly bundleBaseClient: HttpClient;

  private readonly blockEngineSendTxV1Path = "/api/v1/transactions"; // https://docs.jito.wtf/lowlatencytxnsend/#transactions-api-v1-transactions
  private readonly bundleGetTipInfoV1Path = "/api/v1/bundles/tip_floor"; // https://docs.jito.wtf/lowlatencytxnsend/#get-tip-information

  constructor(
    blockEngineBaseUrl: string = "https://mainnet.block-engine.jito.wtf",
    bundleBaseUrl: string = "https://bundles.jito.wtf",
    uuid: string = "",
    private readonly logger: Logger = new TsLogLogger({ name: "JitoClient" })
  ) {
    const blockEngineHeaders: Record<string, string> = {
      [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
    };
    if (uuid) {
      blockEngineHeaders[JITO_TOKEN_KEY] = uuid;
    }
    this.blockEngineBaseClient = new HttpClient(
      {
        baseURL: blockEngineBaseUrl,
        headers: blockEngineHeaders,
      },
      logger
    );

    const bundleHeaders: Record<string, string> = {
      [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
    };
    if (uuid) {
      bundleHeaders[JITO_TOKEN_KEY] = uuid;
    }
    this.bundleBaseClient = new HttpClient(
      {
        baseURL: bundleBaseUrl,
        headers: bundleHeaders,
      },
      logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  async sendTransactionV1(
    serializedTxBase64: string
  ): Promise<SendTransactionV1ResultDto | null> {
    const resultRes = await safe(
      this.blockEngineBaseClient.post(this.blockEngineSendTxV1Path, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [
          serializedTxBase64,
          {
            encoding: "base64",
          },
        ],
      })
    );
    if (!resultRes.success) {
      this.logger.error(
        `[sendTransactionV1] Failed to get response: ${resultRes.error}`
      );
      return null;
    }
    const parseRes = SendTransactionV1ResultDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      this.logger.error(
        `[sendTransactionV1] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    return parseRes.data;
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * The tip floor is the minimum tip that will be accepted by the network. The applied unit is Sol.
   */
  async getTipInfoV1(): Promise<GetTipInfoV1ResultDto | null> {
    const resultRes = await safe(
      this.bundleBaseClient.get(this.bundleGetTipInfoV1Path)
    );
    if (!resultRes.success) {
      this.logger.error(
        `[getBundleTipInfoV1] Failed to get response: ${resultRes.error}`
      );
      return null;
    }
    const parseRes = GetTipInfoV1ResultDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      this.logger.error(
        `[getBundleTipInfoV1] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    return parseRes.data;
  }

  async getLatestXpercentileTipInLamportsV1(
    jitoTipPercentile: string
  ): Promise<number | null> {
    const tipInfo = await this.getTipInfoV1();
    if (!tipInfo) {
      this.logger.error(
        `[getLatestXpercentileTipInfoV1] Failed to get tip info`
      );
      return null;
    }

    if (
      !tipInfo ||
      tipInfo.length === 0 ||
      !GetPercentileTip(tipInfo, jitoTipPercentile)
    ) {
      this.logger.error(
        `[getLatestXpercentileTipInfoV1] Failed to get tip info for percentile: ${jitoTipPercentile}`
      );
      return null;
    }
    const tipInSol = GetPercentileTip(tipInfo, jitoTipPercentile);
    // https://docs.jito.wtf/lowlatencytxnsend/#sendtransaction
    return Math.ceil(tipInSol * LAMPORTS_PER_SOL);
  }
}
