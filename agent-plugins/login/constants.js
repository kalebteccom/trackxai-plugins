/** The prefix of the `client` string the device page shows the approver. */
export const LOGIN_CLIENT_PREFIX = "trackxai-plugin";
export const DEVICE_CODE_PATH = "/api/v1/device/code";
export const DEVICE_TOKEN_PATH = "/api/v1/device/token";
/** The profile-scoped file the token lands in, beside the harness's own config. */
export const PROFILE_ENV_FILE = "trackxai.env";
/** First line of a file `trackxai login` wrote. Logout and a second login only touch files that carry it. */
export const ENV_FILE_MARKER = "# written by trackxai login";
/** RFC 8628 section 3.5: a `slow_down` adds five seconds to every later wait. */
export const SLOW_DOWN_STEP_SECONDS = 5;
export const MIN_INTERVAL_SECONDS = 1;
export const MAX_INTERVAL_SECONDS = 60;
/** Consecutive network or 5xx answers tolerated before the wait gives up. */
export const MAX_TRANSIENT_FAILURES = 5;
export const REQUEST_TIMEOUT_MS = 15_000;
/** No device endpoint answers with more than a few hundred bytes. */
export const MAX_BODY_BYTES = 16_384;
export const HOST_NAME_MAX_LENGTH = 64;
