import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { ChallengeError } from "./challenge.js";
import { guardedFetch, type FetchLike, type GuardedFetchOptions } from "./guarded-fetch.js";
import { MAX_TOOLS, MAX_TOOL_PAGES, USER_AGENT_PRODUCT } from "./limits.js";

export type McpTool = {
  readonly name: string;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly inputSchema: Readonly<Record<string, unknown>>;
};

export type McpContentBlock = { readonly type: string; readonly text?: string | undefined };

export type McpCallResult = {
  readonly content: readonly McpContentBlock[];
  readonly isError: boolean;
};

export type TrackxaiClient = {
  /** The server's brief, from `initialize`. */
  readonly instructions: string | undefined;
  readonly listTools: () => Promise<readonly McpTool[]>;
  readonly callTool: (
    name: string,
    args: Readonly<Record<string, unknown>>,
    signal?: AbortSignal,
  ) => Promise<McpCallResult>;
  readonly close: () => Promise<void>;
};

export type ConnectOptions = Pick<
  GuardedFetchOptions,
  "sleep" | "backoffMs" | "timeoutMs" | "maxRequestBytes" | "maxResponseBytes"
> & {
  readonly url: string;
  readonly token: string;
  /** The plugin version, sent in every `User-Agent`. */
  readonly version: string;
  readonly fetch: FetchLike;
};

/** The product and version a request names itself with. */
export const userAgentOf = (version: string): string => `${USER_AGENT_PRODUCT}/${version}`;

/** The token cannot reach a message: whatever an SDK error quotes, the secret is cut out of it. */
const scrubbed = (error: unknown, token: string): Error => {
  if (error instanceof ChallengeError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const clean = new Error(token === "" ? message : message.split(token).join("[token]"));
  clean.name = error instanceof Error ? error.name : "Error";
  return clean;
};

/**
 * Connects to the trackxai `/mcp` endpoint over streamable HTTP and runs
 * `initialize`. The SDK owns the protocol and the Pi glue owns the transport
 * rules in `guardedFetch`. Every method rejects with an error that holds no
 * token.
 */
export const connectTrackxai = async (options: ConnectOptions): Promise<TrackxaiClient> => {
  const url = new URL(options.url);
  const transport = new StreamableHTTPClientTransport(url, {
    fetch: guardedFetch({
      fetch: options.fetch,
      token: options.token,
      userAgent: userAgentOf(options.version),
      origin: url.origin,
      ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
      ...(options.backoffMs === undefined ? {} : { backoffMs: options.backoffMs }),
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
      ...(options.maxRequestBytes === undefined ? {} : { maxRequestBytes: options.maxRequestBytes }),
      ...(options.maxResponseBytes === undefined ? {} : { maxResponseBytes: options.maxResponseBytes }),
    }),
    reconnectionOptions: {
      maxRetries: 0,
      initialReconnectionDelay: 1000,
      maxReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1,
    },
  });
  const client = new Client({ name: USER_AGENT_PRODUCT, version: options.version }, { capabilities: {} });
  const guard = async <T>(work: () => Promise<T>): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      throw scrubbed(error, options.token);
    }
  };

  // The SDK declares `sessionId?: string` on its transport class and `sessionId: string | undefined` is
  // what `exactOptionalPropertyTypes` reads on its interface. The two are the same shape.
  await guard(() => client.connect(transport as Transport));

  return {
    instructions: client.getInstructions(),
    listTools: () =>
      guard(async () => {
        const tools: McpTool[] = [];
        let cursor: string | undefined;
        for (let page = 0; page < MAX_TOOL_PAGES && tools.length < MAX_TOOLS; page += 1) {
          const result = await client.listTools(cursor === undefined ? {} : { cursor });
          tools.push(...result.tools);
          cursor = result.nextCursor;
          if (cursor === undefined) break;
        }
        return tools.slice(0, MAX_TOOLS);
      }),
    callTool: (name, args, signal) =>
      guard(async () => {
        const result = await client.callTool(
          { name, arguments: { ...args } },
          undefined,
          signal === undefined ? {} : { signal },
        );
        return {
          content: Array.isArray(result.content) ? (result.content as McpContentBlock[]) : [],
          isError: result.isError === true,
        };
      }),
    close: () => guard(() => client.close()),
  };
};
