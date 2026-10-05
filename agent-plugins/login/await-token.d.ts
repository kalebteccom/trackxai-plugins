import type { PollResult } from "./device-api.js";
export type Clock = {
    readonly now: () => number;
    /** Resolves after `millis`, or rejects when `signal` aborts first. */
    readonly sleep: (millis: number, signal: AbortSignal) => Promise<void>;
};
export type AwaitTokenInput = {
    readonly poll: () => Promise<PollResult>;
    readonly intervalSeconds: number;
    readonly expiresInSeconds: number;
    readonly clock: Clock;
    readonly signal: AbortSignal;
};
/**
 * Polls at the server's interval until it answers with a token, a refusal or
 * the code runs out. `slow_down` widens every later wait by five seconds. A
 * network error or 5xx backs off exponentially, from the current interval, and
 * gives up after five in a row.
 */
export declare const awaitToken: (input: AwaitTokenInput) => Promise<string>;
