import { type DeviceApi } from "./device-api.js";
import type { LogoutOptions } from "./logout-options.js";
export type LogoutDeps = {
    readonly api: Omit<DeviceApi, "origin">;
    /** A line for the person. Only ever a path, a host, a command and the outcome. */
    readonly say: (line: string) => void;
    readonly env: (name: string) => string | undefined;
    readonly home: string;
    readonly cwd: string;
};
export type LogoutResult = "signed-out" | "nothing-stored";
/**
 * Ends the sign-in `trackxai login` made. The token in the profile's env file
 * is revoked on the server it was issued by, then the file is deleted. A
 * revoke that cannot reach the server keeps the file, so running logout again
 * finishes the job. With no stored token it says so in one line and touches
 * nothing. Returns what it did, and prints the harness's own plugin-removal
 * command, because removing a plugin is the person's to do.
 */
export declare const runLogout: (options: LogoutOptions, deps: LogoutDeps) => Promise<LogoutResult>;
