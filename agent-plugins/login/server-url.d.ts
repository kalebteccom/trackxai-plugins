/**
 * The origin every device request goes to. A token travels in a response from
 * this origin, so a plaintext scheme is refused unless the host is this
 * machine. A URL carrying credentials or a fragment is refused as a typo.
 */
export declare const serverOriginOf: (raw: string) => URL;
/**
 * The page the person opens. It has to sit on the origin that issued the code,
 * so a hostile or misconfigured server cannot send a signed-in person elsewhere.
 */
export declare const verificationUrlOf: (raw: string, origin: URL) => URL;
