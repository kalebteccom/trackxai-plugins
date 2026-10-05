import { LoginError } from "./login-error.js";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
/**
 * The origin every device request goes to. A token travels in a response from
 * this origin, so a plaintext scheme is refused unless the host is this
 * machine. A URL carrying credentials or a fragment is refused as a typo.
 */
export const serverOriginOf = (raw) => {
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        throw new LoginError("The server address is not a valid URL.");
    }
    const loopback = LOOPBACK_HOSTS.has(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
        throw new LoginError("The server address must use https, or http on localhost.");
    if (url.username !== "" || url.password !== "")
        throw new LoginError("The server address must not carry a user name or password.");
    return new URL(url.origin);
};
/**
 * The page the person opens. It has to sit on the origin that issued the code,
 * so a hostile or misconfigured server cannot send a signed-in person elsewhere.
 */
export const verificationUrlOf = (raw, origin) => {
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        throw new LoginError("The server sent a verification address that is not a URL.");
    }
    if (url.origin !== origin.origin || url.username !== "" || url.password !== "")
        throw new LoginError("The server sent a verification address on a different origin.");
    return url;
};
