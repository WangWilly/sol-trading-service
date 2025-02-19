/**
import { safe } from "../exceptions";
import { HttpClient } from "../httpClient";
import { ConsoleLogger, Logger } from "../logging";
import {
  GetTransactionV1ResultDto,
  GetTransactionV1ResultDtoSchema,
} from "./dtos";

////////////////////////////////////////////////////////////////////////////////
// TODO: deprecated

export class SolRpcClient {
  private readonly logger: Logger;
  private readonly baseClient: HttpClient;

  //////////////////////////////////////////////////////////////////////////////

  constructor(
    solRpcBaseEndpoint: string = "https://api.mainnet-beta.solana.com"
  ) {
    this.logger = new ConsoleLogger("SolRpcClient");
    this.baseClient = new HttpClient(
      {
        baseURL: solRpcBaseEndpoint,
      },
      this.logger
    );
  }

  //////////////////////////////////////////////////////////////////////////////

  async getTransaction(
    txSignature: string
  ): Promise<GetTransactionV1ResultDto | null> {
    const resultRes = await safe(
      this.baseClient.post("/", {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          txSignature,
          {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
            encoding: "json",
          },
        ],
      })
    );
    if (!resultRes.success) {
      this.logger.error(
        `[getTransaction] Failed to get response: ${resultRes.error}`
      );
      return null;
    }

    const parsedRes = GetTransactionV1ResultDtoSchema.safeParse(resultRes.data);
    if (!parsedRes.success) {
      this.logger.error(
        `[getTransaction] Failed to parse response: ${parsedRes.error}`
      );
      return null;
    }

    const { data } = parsedRes;
    if (!data.result || !data.result.meta || data.result.meta.err) {
      this.logger.error(
        `[getTransaction] Failed to get transaction: ${data.result?.meta?.err}`
      );
      return null;
    }

    return data;
  }
}
*/
