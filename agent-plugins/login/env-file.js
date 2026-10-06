import { randomBytes } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { access, chmod, constants, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { DEFAULT_MCP_URL, MCP_URL_ENV_VAR, TOKEN_ENV_VAR } from "../constants.js";
import { ENV_FILE_MARKER, PROFILE_ENV_FILE } from "./constants.js";
import { LoginError } from "./login-error.js";
export const renderEnvFile = (content) => [
    ENV_FILE_MARKER,
    `# harness: ${content.harness}`,
    `${TOKEN_ENV_VAR}=${content.token}`,
    ...(content.mcpUrl === undefined || content.mcpUrl === DEFAULT_MCP_URL
        ? []
        : [`${MCP_URL_ENV_VAR}=${content.mcpUrl}`]),
    "",
].join("\n");
/** `KEY=value` lines, comments and blanks skipped. The reader a harness extension uses for the file. */
export const parseEnvFile = (text) => {
    const lines = text.split(/\r?\n/);
    const values = {};
    for (const line of lines) {
        const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
        if (match !== null)
            values[match[1] ?? ""] = match[2] ?? "";
    }
    return { writtenByLogin: lines[0] === ENV_FILE_MARKER, values };
};
export const envFilePathOf = (profileDir) => join(profileDir, PROFILE_ENV_FILE);
/**
 * True when `dir` sits inside a repository checkout below `home`. A token in a
 * repository's tree is one `git add` from a public history. The home directory
 * itself is not tested, because a dotfiles repository there is a person's own.
 */
export const insideRepository = (dir, home) => {
    for (let current = dir;; current = dirname(current)) {
        if (current === home)
            return false;
        if (existsSync(join(current, ".git")))
            return true;
        if (dirname(current) === current)
            return false;
    }
};
export const readIfPresent = async (path) => {
    try {
        return await readFile(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    }
};
const writeFailure = (path, error) => {
    const code = error.code ?? "unknown error";
    return new LoginError(`Could not write ${path} (${code}). The token was not stored.`);
};
/** The nearest directory at or above `dir` that exists. */
const nearestExisting = (dir) => {
    let current = dir;
    while (!existsSync(current) && dirname(current) !== current)
        current = dirname(current);
    return current;
};
/**
 * `dir` with every symlink in its existing part resolved, so a profile
 * reached through a link into a repository is judged by where it lands.
 */
const canonical = (dir) => {
    const base = nearestExisting(dir);
    try {
        return join(realpathSync(base), relative(base, dir));
    }
    catch {
        return dir;
    }
};
/** Judged by where the directory lands today, so it runs again just before the write. */
const assertOutsideRepository = (input) => {
    const home = input.home === undefined ? undefined : canonical(input.home);
    if (insideRepository(canonical(input.profileDir), home))
        throw new LoginError(`${input.profileDir} is inside a git repository. Point the profile somewhere else, so a token cannot be committed.`);
};
/**
 * Every refusal that can be known before a person approves anything, with no
 * write: the directory sits in a repository, the target is a file this command
 * did not write, or nothing above the directory is writable. A refusal after
 * approval would leave a live token nobody holds.
 *
 * The returned `write` puts the file down readable by its owner only. The bytes
 * go to a temporary file created exclusively with mode 0600 in the same
 * directory, then rename over the target, so a reader sees the old file or the
 * whole new one and a symlink at the target is replaced and never followed.
 */
export const planProfileEnvFile = async (input) => {
    const path = envFilePathOf(input.profileDir);
    assertOutsideRepository(input);
    let existing;
    try {
        existing = await readIfPresent(path);
        await access(nearestExisting(input.profileDir), constants.W_OK);
    }
    catch (error) {
        throw writeFailure(path, error);
    }
    if (existing !== undefined && !parseEnvFile(existing).writtenByLogin && !input.force)
        throw new LoginError(`${path} exists and was not written by trackxai login. Move it, or pass --force.`);
    return {
        path,
        write: async (token) => {
            const temporary = join(input.profileDir, `.${PROFILE_ENV_FILE}.${randomBytes(6).toString("hex")}.tmp`);
            assertOutsideRepository(input);
            try {
                await mkdir(input.profileDir, { recursive: true, mode: 0o700 });
                const handle = await open(temporary, "wx", 0o600);
                try {
                    await handle.writeFile(renderEnvFile({ harness: input.harness, token, mcpUrl: input.mcpUrl }), "utf8");
                    await handle.sync();
                }
                finally {
                    await handle.close();
                }
                await chmod(temporary, 0o600);
                await rename(temporary, path);
            }
            catch (error) {
                await unlink(temporary).catch(() => undefined);
                throw writeFailure(path, error);
            }
        },
    };
};
