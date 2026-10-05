/** Names and ceilings the Pi extension shares between its modules. It ships inside the package, so it imports nothing. */

/** The product token in every request's `User-Agent`, followed by `/<version>`. */
export const USER_AGENT_PRODUCT = "trackxai-pi";

/** Pi's own variable for the profile directory. */
export const AGENT_DIR_ENV_VAR = "PI_CODING_AGENT_DIR";

/** The file `trackxai login` writes into the profile directory. */
export const PROFILE_ENV_FILE = "trackxai.env";

/** A Pi tool is the server's tool with its dots turned to underscores, behind this prefix. */
export const TOOL_NAME_PREFIX = "trackxai_";

/** A challenge page is retried this many times after the first answer, so three requests in all. */
export const CHALLENGE_RETRIES = 2;

/** The wait before each retry, in milliseconds. */
export const CHALLENGE_BACKOFF_MS: readonly number[] = [500, 1500];

export const REQUEST_TIMEOUT_MS = 60_000;

/** The largest JSON-RPC request body the client sends. Tool arguments are text, so this is generous. */
export const MAX_REQUEST_BYTES = 1_048_576;

/** The largest response body the client reads, `initialize`, `tools/list` and `tools/call` alike. */
export const MAX_RESPONSE_BYTES = 4_194_304;

/** The most characters of one tool result handed to the model. */
export const MAX_RESULT_CHARS = 100_000;

/** The most pages of `tools/list` followed, and the most tools registered. */
export const MAX_TOOL_PAGES = 20;
export const MAX_TOOLS = 500;

/** The most bytes read to decide whether an error body is a challenge page. */
export const CHALLENGE_PEEK_BYTES = 4096;
