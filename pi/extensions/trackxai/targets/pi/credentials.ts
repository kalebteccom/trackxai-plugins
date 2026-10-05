import { join, isAbsolute } from "node:path";
import { DEFAULT_MCP_URL, MCP_URL_ENV_VAR, TOKEN_ENV_VAR } from "../../constants.js";
import { AGENT_DIR_ENV_VAR, PROFILE_ENV_FILE } from "./limits.js";

export type EnvMap = Readonly<Record<string, string | undefined>>;

export type CredentialInput = {
  readonly env: EnvMap;
  /** The text of a file, or undefined when it does not exist. Any other failure throws with an `errno` code. */
  readonly readFile: (path: string) => string | undefined;
  readonly homeDir: string;
  /** Used when `TRACKXAI_MCP_URL` is set nowhere. */
  readonly defaultUrl?: string;
};

export type ResolvedConnection = {
  readonly url: string;
  readonly token: string;
  /** The profile directory Pi runs under. */
  readonly profileDir: string;
};

export type Resolution =
  | { readonly ok: true; readonly connection: ResolvedConnection }
  | { readonly ok: false; readonly reason: string };

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** `KEY=value` lines, comments and blanks skipped: the shape `trackxai login` writes. */
export const parseEnvFile = (text: string): Readonly<Record<string, string>> => {
  const values: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match !== null) values[match[1] ?? ""] = match[2] ?? "";
  }
  return values;
};

/** The profile Pi runs under: its own variable when set, else its default directory under the home. */
export const profileDirOf = (env: EnvMap, homeDir: string): string | undefined => {
  const fromEnv = env[AGENT_DIR_ENV_VAR];
  if (fromEnv === undefined || fromEnv === "") return join(homeDir, ".pi", "agent");
  return isAbsolute(fromEnv) ? fromEnv : undefined;
};

const urlRefusal = (raw: string): string | undefined => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return `${MCP_URL_ENV_VAR} is not a valid URL.`;
  }
  const loopback = LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
    return `${MCP_URL_ENV_VAR} must use https, or http on localhost, because the token travels in every request.`;
  if (url.username !== "" || url.password !== "")
    return `${MCP_URL_ENV_VAR} must not carry a user name or password.`;
  return undefined;
};

const readEnvFile = (
  path: string,
  readFile: CredentialInput["readFile"],
): Record<string, string> | string => {
  try {
    const text = readFile(path);
    return text === undefined ? {} : { ...parseEnvFile(text) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown error";
    return `Could not read ${PROFILE_ENV_FILE} in the Pi profile (${code}).`;
  }
};

const present = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;

/**
 * The server URL and token for this session. A variable in the process
 * environment wins over the profile's `trackxai.env`, which wins over the
 * default URL. A plaintext non-local URL, a token that cannot be a header
 * value, and a process that turned TLS verification off are all refused, so
 * nothing is sent. A refusal names the variable or the file and never a value.
 */
export const resolveConnection = (input: CredentialInput): Resolution => {
  if (input.env["NODE_TLS_REJECT_UNAUTHORIZED"] === "0")
    return {
      ok: false,
      reason: "TLS verification is switched off in this process, so the token is not sent.",
    };
  const profileDir = profileDirOf(input.env, input.homeDir);
  if (profileDir === undefined)
    return { ok: false, reason: `${AGENT_DIR_ENV_VAR} must be an absolute path.` };
  const fromFile = readEnvFile(join(profileDir, PROFILE_ENV_FILE), input.readFile);
  if (typeof fromFile === "string") return { ok: false, reason: fromFile };

  const token = present(input.env[TOKEN_ENV_VAR]) ?? present(fromFile[TOKEN_ENV_VAR]);
  if (token === undefined)
    return {
      ok: false,
      reason: `No trackxai token. Run "trackxai login --harness pi", or set ${TOKEN_ENV_VAR}.`,
    };
  if (!/^[\x21-\x7e]+$/.test(token)) return { ok: false, reason: `${TOKEN_ENV_VAR} is not a valid token.` };

  const url =
    present(input.env[MCP_URL_ENV_VAR]) ??
    present(fromFile[MCP_URL_ENV_VAR]) ??
    input.defaultUrl ??
    DEFAULT_MCP_URL;
  const refusal = urlRefusal(url);
  if (refusal !== undefined) return { ok: false, reason: refusal };
  return { ok: true, connection: { url, token, profileDir } };
};
