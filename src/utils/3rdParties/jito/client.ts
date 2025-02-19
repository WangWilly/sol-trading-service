import {
  CONTENT_TYPE_KEY,
  CONTENT_TYPE_VAL_JSON,
  JITO_TOKEN_KEY,
} from "../../constants";
import { safe } from "../../exceptions";
import { HttpClient } from "../../httpClient";
import { Logger, ConsoleLogger } from "../../logging";
import { GetTipInfoV1ResultDto, GetTipInfoV1ResultDtoSchema, SendTransactionV1ResultDto, SendTransactionV1ResultDtoSchema } from "./dtos";

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
    private readonly logger: Logger = new ConsoleLogger("JitoClient")
  ) {
    this.blockEngineBaseClient = new HttpClient(
      {
        baseURL: blockEngineBaseUrl,
        headers: {
          [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
          [JITO_TOKEN_KEY]: uuid,
        },
      },
      logger
    );

    this.bundleBaseClient = new HttpClient(
      {
        baseURL: bundleBaseUrl,
        headers: {
          [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
          [JITO_TOKEN_KEY]: uuid,
        },
      },
      logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  async sendTransactionV1(serializedTxBase64: string): Promise<SendTransactionV1ResultDto | null> {
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
    const resultRes = await safe(this.bundleBaseClient.get(this.bundleGetTipInfoV1Path));
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
}
