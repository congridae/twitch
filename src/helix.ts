import type { TwitchAuth } from "./auth.ts";
import { makeDefaultLogger, TwitchError, type TwitchLogger } from "./utils.ts";

export class Helix {
  auth: TwitchAuth;
  mockServer: number | undefined;
  logger: TwitchLogger;

  constructor(
    auth: TwitchAuth,
    opts?: { mockServer?: number; logger?: TwitchLogger },
  ) {
    this.auth = auth;
    if (opts?.mockServer) this.mockServer = opts.mockServer;
    if (opts?.logger) this.logger = opts?.logger;
    else this.logger = makeDefaultLogger();
  }

  async call<Query extends QueryShape, Body, Response>(
    ep: Endpoint<Query, Body, Response>,
    query: Query,
    body: Body,
  ): Promise<Response> {
    let url = this.mockServer
      ? `http://127.0.0.1:${this.mockServer}/${ep.path}`
      : `https://api.twitch.tv/helix/${ep.path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const name in query) {
        if (Array.isArray(query[name])) {
          for (const value of query[name]) {
            params.append(name, value.toString());
          }
        } else {
          params.append(name, query[name].toString());
        }
      }
      url += "?" + params.toString();
    }

    const headers: Record<string, string> = {};
    await this.auth.authorize(headers);

    let serializedBody: string | null = null;
    if (ep.method !== "GET" && body !== undefined) {
      serializedBody = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    let response;
    while (true) {
      response = await fetch(
        url,
        {
          method: ep.method,
          headers,
          body: serializedBody,
        },
      );

      if (response.status !== 429) break;

      const reset = parseInt(response.headers.get("Ratelimit-Reset")!);
      const wait = reset * 1000 - Date.now();
      this.logger.debug(`waiting ${wait}ms for ratelimit`);
      if (wait <= 0) continue;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    if (response.status >= 400) {
      const error = await response.json() as {
        error: string;
        status: number;
        message: string;
      };
      throw new TwitchError(`${error.status} ${error.error}: ${error.message}`);
    }

    if (response.status === 204) return undefined as Response;
    else return await response.json();
  }
}

export type Endpoint<Query extends QueryShape, Body, Response> = {
  method: string;
  path: string;
};

export type QueryShape = {
  [s: string]: string | string[] | number | number[] | boolean | boolean[];
} | undefined;
