import { z } from "zod";
import { DEVICE_CODE_PATH, DEVICE_TOKEN_PATH, MAX_BODY_BYTES, MAX_INTERVAL_SECONDS, MIN_INTERVAL_SECONDS, REQUEST_TIMEOUT_MS, } from "./constants.js";
import { LoginError } from "./login-error.js";
import { verificationUrlOf } from "./server-url.js";
/** A bearer in the `b64token` alphabet, so it is safe to write unquoted on one line of an env file. */
const TOKEN_SHAPE = /^[A-Za-z0-9._~+/=-]{16,512}$/;
const codeBody = z.object({
    device_code: z.string().regex(/^[\x21-\x7e]{1,128}$/),
    user_code: z.string().regex(/^[0-9A-Za-z]{8}$/),
    verification_uri: z.string().max(2048),
    interval: z.number().int().optional(),
    expires_in: z.number().int().positive().max(86_400),
});
const tokenBody = z.object({
    access_token: z.string().regex(TOKEN_SHAPE),
    token_type: z.string().refine((value) => value.toLowerCase() === "bearer"),
});
const errorBody = z.object({
    error: z.enum(["authorization_pending", "slow_down", "expired_token", "access_denied"]),
});
const clampInterval = (seconds) => Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, seconds ?? MIN_INTERVAL_SECONDS));
const retryAfterOf = (response) => {
    const seconds = Number(response.headers.get("retry-after"));
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_INTERVAL_SECONDS) : null;
};
const readJson = async (response) => {
    const text = await response.text();
    if (text.length > MAX_BODY_BYTES)
        return undefined;
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
};
const post = (api, path, payload) => api.http(new URL(path, api.origin).toString(), {
    method: "POST",
    headers: {
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": api.userAgent,
    },
    body: JSON.stringify(payload),
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
});
export const requestCodeGrant = async (api, client, hostName) => {
    let response;
    try {
        response = await post(api, DEVICE_CODE_PATH, { client, host_name: hostName });
    }
    catch {
        throw new LoginError(`Could not reach ${api.origin.host}. Check the address and your connection.`);
    }
    if (response.status === 429) {
        const wait = retryAfterOf(response);
        throw new LoginError(wait === null
            ? "Too many sign-in requests. Try again shortly."
            : `Too many sign-in requests. Try again in ${wait} seconds.`);
    }
    if (response.status !== 200)
        throw new LoginError(`The server refused the sign-in request (HTTP ${response.status}).`);
    const parsed = codeBody.safeParse(await readJson(response));
    if (!parsed.success)
        throw new LoginError("The server answered the sign-in request with an unusable reply.");
    return {
        deviceCode: parsed.data.device_code,
        userCode: parsed.data.user_code,
        verificationUrl: verificationUrlOf(parsed.data.verification_uri, api.origin),
        intervalSeconds: clampInterval(parsed.data.interval),
        expiresInSeconds: parsed.data.expires_in,
    };
};
export const pollForToken = async (api, deviceCode) => {
    let response;
    try {
        response = await post(api, DEVICE_TOKEN_PATH, { device_code: deviceCode });
    }
    catch {
        return { kind: "transient", afterSeconds: null };
    }
    if (response.status === 429 || response.status >= 500)
        return { kind: "transient", afterSeconds: retryAfterOf(response) };
    const body = await readJson(response);
    if (response.status === 200) {
        const token = tokenBody.safeParse(body);
        if (!token.success)
            throw new LoginError("The server issued a token this command cannot use. Nothing was stored.");
        return { kind: "token", token: token.data.access_token };
    }
    const refusal = errorBody.safeParse(body);
    if (response.status !== 400 || !refusal.success)
        throw new LoginError(`The server answered the sign-in check unexpectedly (HTTP ${response.status}).`);
    switch (refusal.data.error) {
        case "authorization_pending":
            return { kind: "pending" };
        case "slow_down":
            return { kind: "slow-down" };
        case "expired_token":
            return { kind: "expired" };
        case "access_denied":
            return { kind: "denied" };
    }
};
