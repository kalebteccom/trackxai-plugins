import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isOlderVersion, minimumVersionIn, outdatedNotice } from "@trackxai/agent-plugins/plugin-version";
import { registerOnce } from "@trackxai/agent-plugins/register-once";

const VERSION = "0.1.1";
const DEFAULT_URL = "https://trackxai.kalebtec.com/mcp";
const URL_ENV_VAR = "TRACKXAI_MCP_URL";
const TOKEN_ENV_VAR = "TRACKXAI_TOKEN";
const INSTRUCTIONS = join(dirname(fileURLToPath(import.meta.url)), "instructions.md");
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);
const CHECK_TIMEOUT_MS = 5000;
const MAX_REPLY_CHARACTERS = 1048576;

// An override must be https, or plain http to this machine, so a token never travels in the clear.
const serverUrl = (override) => {
  if (override === undefined || override === "") return DEFAULT_URL;
  try {
    const url = new URL(override);
    if (url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK.has(url.hostname))) return override;
  } catch {
    return undefined;
  }
  return undefined;
};

// OpenCode substitutes {env:VAR} in config files only, so the plugin reads the variable itself.
// With no token set, the default, the entry carries no header and OpenCode signs in through MCP OAuth.
const serverEntry = (url, token) => ({
  type: "remote",
  url,
  enabled: true,
  ...(token === undefined || token === "" ? {} : { headers: { Authorization: "Bearer " + token } }),
});

// The reply is JSON, or one server-sent event that carries it.
const instructionsOf = (text) => {
  for (const candidate of [text, ...text.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5))]) {
    try {
      const instructions = JSON.parse(candidate)?.result?.instructions;
      if (typeof instructions === "string") return instructions;
    } catch {
      // not JSON, try the next candidate
    }
  }
  return undefined;
};

// Any failure leaves OpenCode as it was: the check only ever adds one warning.
const warnWhenOutdated = async (client, url, token) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "user-agent": "trackxai-opencode/" + VERSION,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "trackxai-opencode", version: VERSION } },
      }),
    });
    if (!response.ok) return;
    const text = await response.text();
    if (text.length > MAX_REPLY_CHARACTERS) return;
    const minimum = minimumVersionIn(instructionsOf(text) ?? "");
    if (minimum === undefined || !isOlderVersion(VERSION, minimum)) return;
    await client?.app?.log?.({ body: { service: "trackxai", level: "warn", message: outdatedNotice("OpenCode", VERSION, minimum) } });
  } catch {
    // unreachable, refused or malformed: say nothing
  }
};

export const TrackxaiPlugin = async ({ client } = {}) => {
  let checked = false;
  return {
    config: async (config) => {
      const url = serverUrl(process.env[URL_ENV_VAR]);
      if (url === undefined) return;
      const token = process.env[TOKEN_ENV_VAR]?.trim();
      const result = registerOnce(config.mcp, serverEntry(url, token));
      if (!result.registered) return;
      config.mcp = result.servers;
      const instructions = config.instructions ?? [];
      if (!instructions.includes(INSTRUCTIONS)) config.instructions = [...instructions, INSTRUCTIONS];
      if (checked || token === undefined || token === "") return;
      checked = true;
      void warnWhenOutdated(client, url, token);
    },
  };
};
