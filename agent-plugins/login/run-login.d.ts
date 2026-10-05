import { type Clock } from "./await-token.js";
import { type DeviceApi } from "./device-api.js";
import type { LoginOptions } from "./options.js";
export type LoginDeps = {
    readonly api: Omit<DeviceApi, "origin">;
    readonly clock: Clock;
    readonly signal: AbortSignal;
    /** A line for the person. Only ever the code, the page and the outcome. */
    readonly say: (line: string) => void;
    /** Resolves false when nothing could open the page. The page was printed first either way. */
    readonly openUrl: (url: string) => Promise<boolean>;
    readonly env: (name: string) => string | undefined;
    readonly home: string;
    readonly cwd: string;
};
/** The code as a person reads it off a terminal: upper case, split after the fourth character. */
export declare const displayCode: (userCode: string) => string;
/**
 * One RFC 8628 sign-in. Everything that can refuse the write is checked before a
 * code is requested, and nothing touches the disk until the token is in hand,
 * so a code that expires, is denied or is cancelled leaves the profile as it was.
 * Returns the path of the file the token went into.
 */
export declare const runLogin: (options: LoginOptions, deps: LoginDeps) => Promise<string>;
