import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerOnce } from "@trackxai/agent-plugins/register-once";

const DEFAULT_URL = "https://trackxai.kalebtec.com/mcp";
const URL_ENV_VAR = "TRACKXAI_MCP_URL";
const TOKEN_ENV_VAR = "TRACKXAI_TOKEN";
const INSTRUCTIONS = join(dirname(fileURLToPath(import.meta.url)), "instructions.md");
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

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

export const TrackxaiPlugin = async () => ({
  config: async (config) => {
    const url = serverUrl(process.env[URL_ENV_VAR]);
    if (url === undefined) return;
    const result = registerOnce(config.mcp, serverEntry(url, process.env[TOKEN_ENV_VAR]?.trim()));
    if (!result.registered) return;
    config.mcp = result.servers;
    const instructions = config.instructions ?? [];
    if (!instructions.includes(INSTRUCTIONS)) config.instructions = [...instructions, INSTRUCTIONS];
  },
});
