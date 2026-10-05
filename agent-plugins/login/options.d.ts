export type LoginOptions = {
    readonly harness: string;
    readonly origin: URL;
    /** The MCP URL stored beside the token, or undefined for the default server. */
    readonly mcpUrl: string | undefined;
    readonly hostName: string;
    readonly profileDir: string | undefined;
    readonly openBrowser: boolean;
    readonly force: boolean;
};
export declare const USAGE = "Usage: trackxai login --harness <name> [--url <server>] [--host-name <name>] [--profile-dir <dir>] [--no-browser] [--force]";
export type OptionContext = {
    readonly env: (name: string) => string | undefined;
    readonly defaultHostName: string;
    /** False when the environment has no browser to open: no display, or an SSH session. */
    readonly browserAvailable: boolean;
};
/** Reads `argv` after the `login` word. Throws a one-line error for anything it does not know. */
export declare const parseLoginOptions: (argv: readonly string[], context: OptionContext) => LoginOptions;
/** No display and no way to reach one: a bare Linux console or a session over SSH. */
export declare const browserAvailableIn: (env: (name: string) => string | undefined, platform: string) => boolean;
