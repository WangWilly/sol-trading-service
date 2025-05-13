import { Logger, TsLogLogger } from "./logging";
import { LOG_TYPE, NOT_USE_CLI } from "../config";
import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import { transportFunc } from "../helpers/logHistoryHelper/helper";

////////////////////////////////////////////////////////////////////////////////

type FetchParams = Record<string, any>;

type FetchConfig = Pick<
  AxiosRequestConfig,
  "data" | "headers" | "responseType"
>;

////////////////////////////////////////////////////////////////////////////////
// unify the type of http options

export type HttpOptions = AxiosRequestConfig;

////////////////////////////////////////////////////////////////////////////////

export class HttpClient {
  public axios: AxiosInstance;

  //////////////////////////////////////////////////////////////////////////////
  // default headers will be set here

  constructor(
    private readonly config: HttpOptions,
    private readonly logger: Logger = new TsLogLogger({
      name: "UnknownHttpClient",
      type: LOG_TYPE,
      overwrite: {
        transportJSON: NOT_USE_CLI
          ? undefined
          : (json: unknown) => {
              transportFunc(json);
            },
      },
    }),
    private readonly retryTimes = 3,
    private retryBaseInterval = 1000,
    private retryIncrement = 1000,
  ) {
    this.axios = axios.create({
      paramsSerializer: { indexes: null },
      timeout: 10000,
      ...this.config,
    });
  }

  //////////////////////////////////////////////////////////////////////////////

  private mergeConfig(
    method: Method,
    url: string,
    config: FetchConfig,
    params?: FetchParams,
  ): AxiosRequestConfig {
    const headers = config.headers ?? {};

    // Pack
    return {
      method,
      url,
      params,
      headers,
      ...config,
    };
  }

  //////////////////////////////////////////////////////////////////////////////

  async call(
    method: Method,
    path: string,
    config0: FetchConfig,
    params?: FetchParams,
  ): Promise<unknown> {
    // Update config
    const config = this.mergeConfig(method, path, config0, params);

    // Start fetch
    const startTime = process.hrtime.bigint();
    try {
      const res = await this.axios.request(config);
      const { data } = res;

      // Log
      this.logger.debug(
        `succeed in issuing request: { method: ${method}, base: ${
          this.config.baseURL
        }, path: ${path}, params: ${params}, req: ${JSON.stringify(
          config.data,
        )}, res: ${JSON.stringify(data)}, startTime: ${startTime} }`,
      );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { code, message, response: res } = error;
        const data = res?.data ?? { code };
        this.logger.debug(
          `failed to issue request: { method: ${method}, base: ${
            this.config.baseURL
          }, path: ${path}, params: ${JSON.stringify(
            params,
          )}, req: ${JSON.stringify(
            config.data,
          )}, message: ${message}, res: ${JSON.stringify(
            data,
          )}, startTime: ${startTime} }`,
        );
        throw error;
      }
    }
  }

  async retryWrapper(call: () => Promise<unknown>): Promise<unknown> {
    let interval = this.retryBaseInterval;

    let error;
    for (let i = 0; i < this.retryTimes; i++) {
      try {
        return await call();
      } catch (e) {
        error = e;
        this.logger.error(`retrying ${i + 1} times due to error: ${e}`);
        await new Promise((resolve) => setTimeout(resolve, interval));
        interval += this.retryIncrement;
      }
    }

    throw error;
  }

  //////////////////////////////////////////////////////////////////////////////
  // better use Zod to validate the response

  get(
    url: string,
    params?: FetchParams,
    retry: boolean = false,
  ): Promise<unknown> {
    const call = () => this.call("GET", url, {}, params);
    return retry ? this.retryWrapper(call) : call();
  }

  delete(
    url: string,
    params?: FetchParams,
    retry: boolean = false,
  ): Promise<unknown> {
    const call = () => this.call("DELETE", url, {}, params);
    return retry ? this.retryWrapper(call) : call();
  }

  post(
    url: string,
    data: Record<string, any>,
    params?: FetchParams,
    retry: boolean = false,
  ): Promise<unknown> {
    const call = () => this.call("POST", url, { data }, params);
    return retry ? this.retryWrapper(call) : call();
  }

  put(
    url: string,
    data: Record<string, any>,
    params?: FetchParams,
    retry: boolean = false,
  ): Promise<unknown> {
    const call = () => this.call("PUT", url, { data }, params);
    return retry ? this.retryWrapper(call) : call();
  }

  patch(
    url: string,
    data: Record<string, any>,
    params?: FetchParams,
    retry: boolean = false,
  ): Promise<unknown> {
    const call = () => this.call("PATCH", url, { data }, params);
    return retry ? this.retryWrapper(call) : call();
  }
}
