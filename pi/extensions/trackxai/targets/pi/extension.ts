import { SERVER_NAME } from "../../constants.js";
import { isOlderVersion, minimumVersionIn, outdatedNotice } from "../../plugin-version.js";
import { resolveConnection, type EnvMap } from "./credentials.js";
import { hasConfiguredServer, mcpConfigPaths } from "./existing-server.js";
import type { FetchLike } from "./guarded-fetch.js";
import { connectTrackxai, type ConnectOptions, type TrackxaiClient } from "./mcp-client.js";
import type { PiApi, PiContext, PiLevel } from "./pi-types.js";
import { toPiTool } from "./tools.js";

export type ExtensionDeps = {
  /** The plugin version, from the package manifest. */
  readonly version: string;
  /** The tracking playbook, appended to the system prompt after the server's own brief. */
  readonly playbook: string;
  /** The URL used when no variable or profile file names one. */
  readonly defaultUrl?: string;
  readonly fetch: FetchLike;
  readonly env: EnvMap;
  readonly readFile: (path: string) => string | undefined;
  readonly homeDir: string;
  readonly sleep?: ConnectOptions["sleep"];
  readonly backoffMs?: ConnectOptions["backoffMs"];
};

const say = (ctx: PiContext, message: string, level: PiLevel): void => {
  if (ctx.hasUI) ctx.ui.notify(message, level);
  else console.error(message);
};

/**
 * The extension Pi loads. At `session_start` it registers each trackxai tool
 * through the client and keeps the server's brief. At `before_agent_start` it
 * appends the brief and the playbook to the system prompt. A profile that
 * already configures a server named `trackxai` gets one log line and no tools
 * and no network call. Any failure leaves Pi running with no trackxai tools
 * and one line that says why. A server brief that names a minimum plugin
 * version above this one gets one warning per session.
 */
export const createTrackxaiExtension =
  (deps: ExtensionDeps) =>
  (pi: PiApi): void => {
    let client: TrackxaiClient | undefined;
    let registered = false;
    let promptFragment = "";
    let warnedOutdated = false;

    const warnWhenOutdated = (ctx: PiContext, instructions: string | undefined): void => {
      const minimum = minimumVersionIn(instructions ?? "");
      if (warnedOutdated || minimum === undefined || !isOlderVersion(deps.version, minimum)) return;
      warnedOutdated = true;
      say(ctx, outdatedNotice("Pi", deps.version, minimum), "warning");
    };

    const start = async (ctx: PiContext): Promise<void> => {
      const resolution = resolveConnection({
        env: deps.env,
        readFile: deps.readFile,
        homeDir: deps.homeDir,
        ...(deps.defaultUrl === undefined ? {} : { defaultUrl: deps.defaultUrl }),
      });
      if (!resolution.ok) {
        say(ctx, `trackxai: ${resolution.reason}`, "warning");
        return;
      }
      const { connection } = resolution;
      if (hasConfiguredServer(mcpConfigPaths(connection.profileDir, ctx.cwd), deps.readFile)) {
        say(
          ctx,
          `trackxai: a server named "${SERVER_NAME}" is already configured, so the plugin adds no tools.`,
          "info",
        );
        registered = true;
        return;
      }
      try {
        const connected = await connectTrackxai({
          url: connection.url,
          token: connection.token,
          version: deps.version,
          fetch: deps.fetch,
          ...(deps.sleep === undefined ? {} : { sleep: deps.sleep }),
          ...(deps.backoffMs === undefined ? {} : { backoffMs: deps.backoffMs }),
        });
        client = connected;
        const names = new Set<string>();
        for (const tool of await connected.listTools()) {
          const piTool = toPiTool(tool, connected.callTool);
          if (names.has(piTool.name)) continue;
          names.add(piTool.name);
          pi.registerTool(piTool);
        }
        promptFragment = [connected.instructions, deps.playbook]
          .filter((part): part is string => part !== undefined && part.trim() !== "")
          .join("\n\n");
        registered = true;
        warnWhenOutdated(ctx, connected.instructions);
      } catch (error) {
        await client?.close().catch(() => undefined);
        client = undefined;
        say(ctx, `trackxai: ${error instanceof Error ? error.message : "could not connect."}`, "error");
      }
    };

    pi.on("session_start", async (_event, ctx) => {
      if (!registered) await start(ctx);
    });

    pi.on("before_agent_start", (event) => {
      if (promptFragment === "" || event.systemPrompt.includes(promptFragment)) return undefined;
      return { systemPrompt: `${event.systemPrompt}\n\n${promptFragment}` };
    });

    pi.on("session_shutdown", async () => {
      await client?.close().catch(() => undefined);
      client = undefined;
      registered = false;
      promptFragment = "";
      warnedOutdated = false;
    });
  };
