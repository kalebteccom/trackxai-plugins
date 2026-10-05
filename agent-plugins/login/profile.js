import { isAbsolute, join, resolve } from "node:path";
import { HARNESS_ID_PATTERN } from "../constants.js";
import { LoginError } from "./login-error.js";
/**
 * Where each harness keeps the profile a plugin installs into. A harness
 * whose ticket has not recorded its profile directory is absent, and its
 * person passes `--profile-dir` until it is added.
 */
const KNOWN_PROFILES = {
    pi: { envVar: "PI_CODING_AGENT_DIR", defaultDir: (home) => join(home, ".pi", "agent") },
    hermes: { envVar: "HERMES_HOME", defaultDir: (home) => join(home, ".hermes") },
};
export const assertHarnessId = (harness) => {
    if (!HARNESS_ID_PATTERN.test(harness) || harness.length > 32)
        throw new LoginError("--harness takes a lowercase name such as pi.");
};
/** The active profile's directory: the flag, else the harness's own variable, else its default. */
export const profileDirOf = (input) => {
    if (input.profileDirFlag !== undefined)
        return resolve(input.cwd, input.profileDirFlag);
    const known = KNOWN_PROFILES[input.harness];
    if (known === undefined)
        throw new LoginError(`No profile directory is defined for ${input.harness}. Pass --profile-dir with the directory it reads.`);
    const fromEnv = input.env(known.envVar);
    if (fromEnv === undefined || fromEnv === "")
        return known.defaultDir(input.home);
    if (!isAbsolute(fromEnv))
        throw new LoginError(`${known.envVar} must be an absolute path, because a relative one names a different profile per directory.`);
    return resolve(fromEnv);
};
