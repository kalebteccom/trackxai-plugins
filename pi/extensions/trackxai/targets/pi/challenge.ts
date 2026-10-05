import { CHALLENGE_PEEK_BYTES } from "./limits.js";

/** The error a challenge page becomes once the retries run out. It carries no response body. */
export class ChallengeError extends Error {
  readonly status: number;
  readonly attempts: number;

  constructor(status: number, attempts: number) {
    super(
      `trackxai answered a bot-check page instead of JSON-RPC (HTTP ${status}, ${attempts} attempts), ` +
        `a Cloudflare managed challenge for automated clients. Check that the MCP URL ends in /mcp and names the ` +
        `trackxai server, that the token has not been revoked, and that no Cloudflare rule on /mcp ` +
        `blocks this machine's address.`,
    );
    this.name = "ChallengeError";
    this.status = status;
    this.attempts = attempts;
  }
}

const CHALLENGE_STATUSES: ReadonlySet<number> = new Set([403, 429, 503]);
const HTML_HEAD = /<\s*(?:!doctype|html|head|body)\b|just a moment|cf-chl|attention required/i;

const contentTypeOf = (response: Response): string =>
  (response.headers.get("content-type") ?? "").toLowerCase();

const isJsonOrStream = (contentType: string): boolean =>
  contentType.includes("json") || contentType.includes("text/event-stream");

const peek = async (response: Response): Promise<string> => {
  const reader = response.clone().body?.getReader();
  if (reader === undefined) return "";
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    while (bytes < CHALLENGE_PEEK_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text;
};

/**
 * Whether the answer is a bot-check page and no JSON-RPC at all: Cloudflare's
 * mitigation header, any HTML content type, or a 403, 429 or 503 from
 * Cloudflare (or with an HTML body) that names no JSON type. The body is read
 * from a clone, so the caller still holds an unread response.
 */
export const isChallenge = async (response: Response): Promise<boolean> => {
  if (response.headers.has("cf-mitigated")) return true;
  const contentType = contentTypeOf(response);
  if (contentType.includes("text/html") || contentType.includes("application/xhtml")) return true;
  if (!CHALLENGE_STATUSES.has(response.status) || isJsonOrStream(contentType)) return false;
  if ((response.headers.get("server") ?? "").toLowerCase().includes("cloudflare")) return true;
  return HTML_HEAD.test(await peek(response));
};
