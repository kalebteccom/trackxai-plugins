import { LOGIN_CLIENT_PREFIX } from "./constants.js";
import { awaitToken } from "./await-token.js";
import { pollForToken, requestCodeGrant } from "./device-api.js";
import { planProfileEnvFile } from "./env-file.js";
import { profileDirOf } from "./profile.js";
/** The code as a person reads it off a terminal: upper case, split after the fourth character. */
export const displayCode = (userCode) => `${userCode.slice(0, 4)}-${userCode.slice(4)}`.toUpperCase();
/**
 * One RFC 8628 sign-in. Everything that can refuse the write is checked before a
 * code is requested, and nothing touches the disk until the token is in hand,
 * so a code that expires, is denied or is cancelled leaves the profile as it was.
 * Returns the path of the file the token went into.
 */
export const runLogin = async (options, deps) => {
    const api = { ...deps.api, origin: options.origin };
    const plan = await planProfileEnvFile({
        profileDir: profileDirOf({
            harness: options.harness,
            profileDirFlag: options.profileDir,
            env: deps.env,
            home: deps.home,
            cwd: deps.cwd,
        }),
        harness: options.harness,
        mcpUrl: options.mcpUrl,
        home: deps.home,
        force: options.force,
    });
    const grant = await requestCodeGrant(api, `${LOGIN_CLIENT_PREFIX}/${options.harness}`, options.hostName);
    deps.say(`Open ${grant.verificationUrl.toString()}`);
    deps.say(`and enter the code ${displayCode(grant.userCode)}`);
    deps.say(`The code is good for ${Math.max(1, Math.round(grant.expiresInSeconds / 60))} minutes.`);
    if (options.openBrowser)
        await deps.openUrl(grant.verificationUrl.toString());
    const token = await awaitToken({
        poll: () => pollForToken(api, grant.deviceCode),
        intervalSeconds: grant.intervalSeconds,
        expiresInSeconds: grant.expiresInSeconds,
        clock: deps.clock,
        signal: deps.signal,
    });
    await plan.write(token);
    deps.say(`Signed in. The token is stored in ${plan.path}, readable by you only.`);
    deps.say("Revoke it any time on the Agent tokens page.");
    return plan.path;
};
