import { DEVICE_REVOKE_PATH, MCP_REVOKE_PATH, REQUEST_TIMEOUT_MS } from "./constants.js";
import { LoginError } from "./login-error.js";
const send = async (api, path, headers, body) => {
    try {
        return await api.http(new URL(path, api.origin).toString(), {
            method: "POST",
            headers: { accept: "application/json", "user-agent": api.userAgent, ...headers },
            body,
            redirect: "error",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    }
    catch {
        return undefined;
    }
};
const failed = (response) => response === undefined || response.status === 429 || response.status >= 500;
/**
 * Withdraws a device token by presenting it. The server answers 204 once and
 * 401 for a token it no longer accepts, whether revoked, expired or unknown.
 * The token travels in the `Authorization` header and nowhere else, and no
 * message here carries it.
 */
export const revokeDeviceToken = async (api, token) => {
    const response = await send(api, DEVICE_REVOKE_PATH, { authorization: `Bearer ${token}` }, "");
    if (failed(response))
        return "unavailable";
    if (response?.status === 204)
        return "revoked";
    if (response?.status === 401)
        return "already-ended";
    throw new LoginError(`The server answered the revoke request unexpectedly (HTTP ${response?.status}).`);
};
/**
 * RFC 7009 revocation for a token minted through MCP sign-in. The endpoint
 * answers 200 whatever became of the token, so the outcome is always `revoked`
 * on success. A 400 means the request itself was malformed.
 */
export const revokeMcpToken = async (api, token, clientId) => {
    const response = await send(api, MCP_REVOKE_PATH, { "content-type": "application/x-www-form-urlencoded" }, new URLSearchParams({ token, client_id: clientId, token_type_hint: "access_token" }).toString());
    if (failed(response))
        return "unavailable";
    if (response?.status === 200)
        return "revoked";
    if (response?.status === 400)
        throw new LoginError("The server refused the revoke request. Check --client-id.");
    throw new LoginError(`The server answered the revoke request unexpectedly (HTTP ${response?.status}).`);
};
