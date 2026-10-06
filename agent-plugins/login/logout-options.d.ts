export type LogoutOptions = {
    readonly harness: string;
    readonly profileDir: string | undefined;
    /** The OAuth client the stored token was issued to. Present only for a token minted through MCP sign-in. */
    readonly clientId: string | undefined;
};
export declare const LOGOUT_USAGE = "Usage: trackxai logout --harness <name> [--profile-dir <dir>] [--client-id <id>]";
/** Reads `argv` after the `logout` word. Throws a one-line error for anything it does not know. */
export declare const parseLogoutOptions: (argv: readonly string[]) => LogoutOptions;
