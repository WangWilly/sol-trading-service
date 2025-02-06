import { API_TOKEN_KEY, CONTENT_TYPE_KEY, CONTENT_TYPE_VAL_JSON } from "../../constants";
import { HttpClient } from "../../httpClient";
import { ConsoleLogger } from "../../logging";
import {
  GetQuoteParamDto,
  GetQuoteResultDto,
  GetQuoteResultDtoSchema,
} from "./dtos";

////////////////////////////////////////////////////////////////////////////////
// Reference: https://station.jup.ag/docs/api-setup

export class JupSwapClient {
  private readonly baseClient: HttpClient;

  private readonly quoteV1Path = "/swap/v1/quote";
  // private readonly buildSwapTxV1Path = "/swap/v1/swap";

  // TODO: maybe use env variable while building this binary
  constructor(
    jupSwapBaseEndpoint: string = "https://api.jup.ag",
    apiKey: string = ""
  ) {
    this.baseClient = new HttpClient(
      {
        baseURL: jupSwapBaseEndpoint,
        headers: {
          [CONTENT_TYPE_KEY]: CONTENT_TYPE_VAL_JSON,
          [API_TOKEN_KEY]: apiKey,
        },
      },
      new ConsoleLogger("JupBaseClient")
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  async getQuote(params: GetQuoteParamDto): Promise<GetQuoteResultDto> {
    const result = await this.baseClient.get(this.quoteV1Path, params);

    return GetQuoteResultDtoSchema.parse(result);
  }

  //////////////////////////////////////////////////////////////////////////////
}
