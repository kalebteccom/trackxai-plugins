import { ChallengeError, isChallenge } from "./challenge.js";
import {
  CHALLENGE_BACKOFF_MS,
  CHALLENGE_RETRIES,
  MAX_REQUEST_BYTES,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
} from "./limits.js";

/** The slice of `fetch` the client uses. The entry file hands in the real one, tests hand in a fake. */
export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

export type Sleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>;

export type GuardedFetchOptions = {
  readonly fetch: FetchLike;
  readonly token: string;
  readonly userAgent: string;
  /** The one origin a request may go to. The token is never sent anywhere else. */
  readonly origin: string;
  readonly sleep?: Sleep;
  readonly backoffMs?: readonly number[];
  readonly timeoutMs?: number;
  readonly maxRequestBytes?: number;
  readonly maxResponseBytes?: number;
};

const NO_BODY_STATUSES: ReadonlySet<number> = new Set([101, 204, 205, 304]);

const defaultSleep: Sleep = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("The request was cancelled."));
      },
      { once: true },
    );
  });

const bodyBytes = (body: RequestInit["body"]): number => {
  if (body === undefined || body === null) return 0;
  if (typeof body !== "string") throw new Error("The client sends JSON text bodies only.");
  return new TextEncoder().encode(body).byteLength;
};

/** The response with its body counted: reading past `limit` bytes fails the read. */
const capped = (response: Response, limit: number): Response => {
  if (response.body === null || NO_BODY_STATUSES.has(response.status)) return response;
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    void response.body.cancel();
    throw new Error(`The response is ${declared} bytes, over the ${limit} byte limit.`);
  }
  let seen = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength;
      if (seen > limit) controller.error(new Error(`The response is over the ${limit} byte limit.`));
      else controller.enqueue(chunk);
    },
  });
  return new Response(response.body.pipeThrough(counter), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

/**
 * The `fetch` the MCP transport gets. Every request carries the user agent and
 * the bearer token, goes only to `origin`, follows no redirect, and times out.
 * A request body over the cap is refused before it leaves, a response body over
 * the cap fails its read, and a bot-check answer is retried twice with backoff
 * and then raised as one `ChallengeError`, so the SDK never parses it as JSON.
 *
 * The standing GET the transport opens for server notifications answers 405
 * with no network call: the client needs no notification, and a stream open for
 * the whole session would sit outside the response cap and the timeout.
 */
export const guardedFetch = (options: GuardedFetchOptions): FetchLike => {
  const sleep = options.sleep ?? defaultSleep;
  const backoff = options.backoffMs ?? CHALLENGE_BACKOFF_MS;
  const maxRequest = options.maxRequestBytes ?? MAX_REQUEST_BYTES;
  const maxResponse = options.maxResponseBytes ?? MAX_RESPONSE_BYTES;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  return async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.origin !== options.origin)
      throw new Error("The request is not for the configured trackxai server.");
    const method = (init.method ?? "GET").toUpperCase();
    if (method === "GET") return new Response(null, { status: 405 });
    const size = bodyBytes(init.body);
    if (size > maxRequest)
      throw new Error(`The request is ${size} bytes, over the ${maxRequest} byte limit.`);

    const headers = new Headers(init.headers);
    headers.set("user-agent", options.userAgent);
    headers.set("authorization", `Bearer ${options.token}`);
    const signal = AbortSignal.any([
      AbortSignal.timeout(timeoutMs),
      ...(init.signal === undefined || init.signal === null ? [] : [init.signal]),
    ]);

    for (let attempt = 1; ; attempt += 1) {
      const response = await options.fetch(url, { ...init, method, headers, redirect: "error", signal });
      if (!(await isChallenge(response))) return capped(response, maxResponse);
      void response.body?.cancel();
      if (attempt > CHALLENGE_RETRIES) throw new ChallengeError(response.status, attempt);
      await sleep(backoff[attempt - 1] ?? backoff.at(-1) ?? 0, signal);
    }
  };
};
