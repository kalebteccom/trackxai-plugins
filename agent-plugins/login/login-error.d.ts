/**
 * A failure the person can act on, in one line. The message is the whole
 * report: it never carries a response body, a device code or a token.
 */
export declare class LoginError extends Error {
    readonly name = "LoginError";
}
