/** The slice of `fetch` the login uses. The command file hands in the real one, tests hand in a fake. */
export type HttpFetch = (url: string, init: {
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly redirect: "error";
    readonly signal: AbortSignal;
}) => Promise<Response>;
export type DeviceApi = {
    readonly origin: URL;
    readonly http: HttpFetch;
    readonly userAgent: string;
};
export type CodeGrant = {
    /** The polling credential. Never printed. */
    readonly deviceCode: string;
    readonly userCode: string;
    readonly verificationUrl: URL;
    readonly intervalSeconds: number;
    readonly expiresInSeconds: number;
};
export type PollResult = {
    readonly kind: "token";
    readonly token: string;
} | {
    readonly kind: "pending";
} | {
    readonly kind: "slow-down";
} | {
    readonly kind: "expired";
} | {
    readonly kind: "denied";
}
/** The network or the server hiccuped. Ask again, after `afterSeconds` when the server said how long. */
 | {
    readonly kind: "transient";
    readonly afterSeconds: number | null;
};
export declare const requestCodeGrant: (api: DeviceApi, client: string, hostName: string) => Promise<CodeGrant>;
export declare const pollForToken: (api: DeviceApi, deviceCode: string) => Promise<PollResult>;
