import { join } from "node:path";
import { registerOnce } from "../../register-once.js";

/** The MCP config files a Pi profile or project can hold, from the profile directory and the working directory. */
export const mcpConfigPaths = (profileDir: string, cwd: string): readonly string[] => [
  join(profileDir, "mcp.json"),
  join(cwd, ".pi", "mcp.json"),
];

const serversOf = (text: string): Readonly<Record<string, unknown>> | undefined => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const servers = (parsed as { mcpServers?: unknown }).mcpServers;
    return typeof servers === "object" && servers !== null && !Array.isArray(servers)
      ? (servers as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Whether some other adapter or an injector already configured a server named
 * `trackxai` for this profile. A file that is missing, unreadable or not JSON
 * counts as no server, and the check goes through `registerOnce`, the rule
 * every code-bearing plugin shares.
 */
export const hasConfiguredServer = (
  paths: readonly string[],
  readFile: (path: string) => string | undefined,
): boolean =>
  paths.some((path) => {
    let text: string | undefined;
    try {
      text = readFile(path);
    } catch {
      return false;
    }
    return text !== undefined && !registerOnce(serversOf(text), {}).registered;
  });
