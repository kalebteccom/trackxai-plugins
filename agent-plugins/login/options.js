import { parseArgs } from "node:util";
import { DEFAULT_MCP_URL, MCP_URL_ENV_VAR } from "../constants.js";
import { cleanHostName } from "./host-name.js";
import { LoginError } from "./login-error.js";
import { assertHarnessId } from "./profile.js";
import { serverOriginOf } from "./server-url.js";
export const USAGE = "Usage: trackxai login --harness <name> [--url <server>] [--host-name <name>] [--profile-dir <dir>] [--no-browser] [--force]";
/** Reads `argv` after the `login` word. Throws a one-line error for anything it does not know. */
export const parseLoginOptions = (argv, context) => {
    let values;
    try {
        values = parseArgs({
            args: [...argv],
            allowPositionals: false,
            options: {
                harness: { type: "string" },
                url: { type: "string" },
                "host-name": { type: "string" },
                "profile-dir": { type: "string" },
                "no-browser": { type: "boolean" },
                force: { type: "boolean" },
            },
        }).values;
    }
    catch {
        throw new LoginError(USAGE);
    }
    if (values.harness === undefined)
        throw new LoginError(USAGE);
    assertHarnessId(values.harness);
    const rawUrl = values.url ?? context.env(MCP_URL_ENV_VAR) ?? DEFAULT_MCP_URL;
    const origin = serverOriginOf(rawUrl);
    const hostName = cleanHostName(values["host-name"] ?? context.defaultHostName);
    if (hostName === "")
        throw new LoginError("The host name is empty. Pass --host-name.");
    const mcpUrl = new URL("/mcp", origin).toString();
    return {
        harness: values.harness,
        origin,
        mcpUrl: mcpUrl === DEFAULT_MCP_URL ? undefined : mcpUrl,
        hostName,
        profileDir: values["profile-dir"],
        openBrowser: values["no-browser"] !== true && context.browserAvailable,
        force: values.force === true,
    };
};
/** No display and no way to reach one: a bare Linux console or a session over SSH. */
export const browserAvailableIn = (env, platform) => {
    if (env("SSH_CONNECTION") !== undefined || env("SSH_TTY") !== undefined)
        return false;
    if (platform === "linux")
        return env("DISPLAY") !== undefined || env("WAYLAND_DISPLAY") !== undefined;
    return true;
};
