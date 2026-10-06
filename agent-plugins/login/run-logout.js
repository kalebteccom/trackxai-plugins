import { unlink } from "node:fs/promises";
import { DEFAULT_MCP_URL, MCP_URL_ENV_VAR, TOKEN_ENV_VAR } from "../constants.js";
import { isUsableToken } from "./device-api.js";
import { envFilePathOf, parseEnvFile, readIfPresent } from "./env-file.js";
import { commandsFor } from "./harness-commands.js";
import { LoginError } from "./login-error.js";
import { hasKnownProfile, profileDirOf } from "./profile.js";
import { revokeDeviceToken, revokeMcpToken } from "./revoke-api.js";
import { serverOriginOf } from "./server-url.js";
const codeOf = (error) => error.code ?? "unknown error";
/**
 * Ends the sign-in `trackxai login` made. The token in the profile's env file
 * is revoked on the server it was issued by, then the file is deleted. A
 * revoke that cannot reach the server keeps the file, so running logout again
 * finishes the job. With no stored token it says so in one line and touches
 * nothing. Returns what it did, and prints the harness's own plugin-removal
 * command, because removing a plugin is the person's to do.
 */
export const runLogout = async (options, deps) => {
    const commands = commandsFor(options.harness);
    if (options.profileDir === undefined &&
        !hasKnownProfile(options.harness) &&
        commands?.nativeSignOut !== undefined) {
        deps.say(`${options.harness} signs in through its own MCP OAuth, so trackxai holds no token here. Clear that sign-in with: ${commands.nativeSignOut}`);
        return "nothing-stored";
    }
    const path = envFilePathOf(profileDirOf({
        harness: options.harness,
        profileDirFlag: options.profileDir,
        env: deps.env,
        home: deps.home,
        cwd: deps.cwd,
    }));
    let text;
    try {
        text = await readIfPresent(path);
    }
    catch (error) {
        throw new LoginError(`Could not read ${path} (${codeOf(error)}). Nothing was changed.`);
    }
    const stored = text === undefined ? undefined : parseEnvFile(text);
    if (text !== undefined && stored?.writtenByLogin !== true)
        throw new LoginError(`${path} was not written by trackxai login, so logout leaves it alone.`);
    const token = stored?.values[TOKEN_ENV_VAR];
    if (token === undefined || token === "") {
        deps.say(`No stored trackxai token for ${options.harness} in ${path}. A static token is revoked on the Agent tokens page.`);
        return "nothing-stored";
    }
    if (!isUsableToken(token))
        throw new LoginError(`${path} holds a token this command cannot use. Nothing was changed.`);
    const origin = serverOriginOf(stored?.values[MCP_URL_ENV_VAR] ?? DEFAULT_MCP_URL);
    const api = { ...deps.api, origin };
    const outcome = options.clientId === undefined
        ? await revokeDeviceToken(api, token)
        : await revokeMcpToken(api, token, options.clientId);
    if (outcome === "unavailable")
        throw new LoginError(`Could not revoke the token on ${origin.host}. ${path} is kept, so run logout again.`);
    try {
        await unlink(path);
    }
    catch (error) {
        if (codeOf(error) !== "ENOENT")
            throw new LoginError(`The token is revoked, but ${path} could not be deleted (${codeOf(error)}). Delete it by hand.`);
    }
    deps.say(outcome === "revoked"
        ? `Revoked the token on ${origin.host}.`
        : "The server no longer accepted the token, so there was nothing to revoke.");
    deps.say(`Deleted ${path}.`);
    if (commands !== undefined) {
        deps.say(`Remove the plugin: ${commands.removePlugin}`);
        if (commands.nativeSignOut !== undefined)
            deps.say(`If ${options.harness} also signed in through its own MCP OAuth, clear that with: ${commands.nativeSignOut}`);
    }
    return "signed-out";
};
