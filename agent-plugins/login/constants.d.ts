/** The prefix of the `client` string the device page shows the approver. */
export declare const LOGIN_CLIENT_PREFIX = "trackxai-plugin";
export declare const DEVICE_CODE_PATH = "/api/v1/device/code";
export declare const DEVICE_TOKEN_PATH = "/api/v1/device/token";
/** The profile-scoped file the token lands in, beside the harness's own config. */
export declare const PROFILE_ENV_FILE = "trackxai.env";
/** First line of a file `trackxai login` wrote. Logout and a second login only touch files that carry it. */
export declare const ENV_FILE_MARKER = "# written by trackxai login";
/** RFC 8628 section 3.5: a `slow_down` adds five seconds to every later wait. */
export declare const SLOW_DOWN_STEP_SECONDS = 5;
export declare const MIN_INTERVAL_SECONDS = 1;
export declare const MAX_INTERVAL_SECONDS = 60;
/** Consecutive network or 5xx answers tolerated before the wait gives up. */
export declare const MAX_TRANSIENT_FAILURES = 5;
export declare const REQUEST_TIMEOUT_MS = 15000;
/** No device endpoint answers with more than a few hundred bytes. */
export declare const MAX_BODY_BYTES = 16384;
export declare const HOST_NAME_MAX_LENGTH = 64;
