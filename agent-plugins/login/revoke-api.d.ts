import type { DeviceApi } from "./device-api.js";
/**
 * `revoked`: the server ended the token. `already-ended`: the server no longer
 * accepted it, so there was nothing to end. `unavailable`: the network or the
 * server failed, and the token may still be live.
 */
export type RevokeOutcome = "revoked" | "already-ended" | "unavailable";
/**
 * Withdraws a device token by presenting it. The server answers 204 once and
 * 401 for a token it no longer accepts, whether revoked, expired or unknown.
 * The token travels in the `Authorization` header and nowhere else, and no
 * message here carries it.
 */
export declare const revokeDeviceToken: (api: DeviceApi, token: string) => Promise<RevokeOutcome>;
/**
 * RFC 7009 revocation for a token minted through MCP sign-in. The endpoint
 * answers 200 whatever became of the token, so the outcome is always `revoked`
 * on success. A 400 means the request itself was malformed.
 */
export declare const revokeMcpToken: (api: DeviceApi, token: string, clientId: string) => Promise<RevokeOutcome>;
