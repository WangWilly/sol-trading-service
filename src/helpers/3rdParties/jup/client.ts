import {
  API_TOKEN_KEY,
  CONTENT_TYPE_KEY,
  CONTENT_TYPE_VAL_JSON,
} from "../../../utils/constants";
import { safe } from "../../../utils/exceptions";
import { HttpClient } from "../../../utils/httpClient";
import { TsLogLogger } from "../../../utils/logging";
import type { Logger } from "../../../utils/logging";
import {
  GetQuoteV1ParamDto,
  GetQuoteV1ResultDto,
  GetQuoteV1ResultDtoSchema,
  BuildSwapV1BodyDto,
  BuildSwapV1ResultDto,
  BuildSwapV1ResultDtoSchema,
  BuildSwapWithIxsV1BodyDto,
  BuildSwapWithIxsV1ResultDto,
  BuildSwapWithIxsV1ResultDtoSchema,
} from "./dtos";

////////////////////////////////////////////////////////////////////////////////
// Reference: https://station.jup.ag/docs/api-setup

export class JupSwapClient {
  private readonly baseClient: HttpClient;

  private readonly quoteV1Path = "/swap/v1/quote";
  private readonly buildSwapTxV1Path = "/swap/v1/swap";
  private readonly buildSwapWithIxsPath = "/swap/v1/swap-instructions";

  // TODO: maybe use env variable while building this binary
  constructor(
    jupSwapBaseEndpoint: string = "https://api.jup.ag",
    apiKey: string = "",
    private readonly logger: Logger = new TsLogLogger({ name: "JupSwapClient" })
  ) {
    this.baseClient = new HttpClient(
      {
        baseURL: jupSwapBaseEndpoint,
        headers: {
          [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
          [API_TOKEN_KEY]: apiKey,
        },
      },
      this.logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  async getQuote(
    params: GetQuoteV1ParamDto
  ): Promise<GetQuoteV1ResultDto | null> {
    const resultRes = await safe(
      this.baseClient.get(this.quoteV1Path, params, true)
    );
    if (!resultRes.success) {
      this.logger.error(
        `[getQuote] Failed to get response: ${resultRes.error}`
      );
      return null;
    }

    const parseRes = GetQuoteV1ResultDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      this.logger.error(
        `[getQuote] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    return parseRes.data;
  }

  //////////////////////////////////////////////////////////////////////////////

  async buildSwapTx(
    body: BuildSwapV1BodyDto
  ): Promise<BuildSwapV1ResultDto | null> {
    const resultRes = await safe(
      this.baseClient.post(this.buildSwapTxV1Path, body, undefined, true)
    );
    if (!resultRes.success) {
      this.logger.error(
        `[buildSwapTx] Failed to get response: ${resultRes.error}`
      );
      return null;
    }

    const parseRes = BuildSwapV1ResultDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      this.logger.error(
        `[buildSwapTx] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    const { data } = parseRes;
    if (data.simulationError !== null) {
      this.logger.error(
        `[buildSwapTx] Error response: ${data.simulationError.errorCode} - ${data.simulationError.error}`
      );
      return null;
    }

    return data;
  }

  async buildSwapWithIxs(
    body: BuildSwapWithIxsV1BodyDto
  ): Promise<BuildSwapWithIxsV1ResultDto | null> {
    const resultRes = await safe(
      this.baseClient.post(this.buildSwapWithIxsPath, body, undefined, true)
    );
    if (!resultRes.success) {
      this.logger.error(
        `[buildSwapWithIxs] Failed to get response: ${resultRes.error}`
      );
      return null;
    }

    const parseRes = BuildSwapWithIxsV1ResultDtoSchema.safeParse(
      resultRes.data
    );
    if (!parseRes.success) {
      this.logger.error(
        `[buildSwapWithIxs] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    const { data } = parseRes;

    return data;
  }
}
