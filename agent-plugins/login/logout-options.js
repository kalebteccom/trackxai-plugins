import { parseArgs } from "node:util";
import { LoginError } from "./login-error.js";
import { assertHarnessId } from "./profile.js";
export const LOGOUT_USAGE = "Usage: trackxai logout --harness <name> [--profile-dir <dir>] [--client-id <id>]";
const CLIENT_ID_SHAPE = /^[\x21-\x7e]{1,256}$/;
/** Reads `argv` after the `logout` word. Throws a one-line error for anything it does not know. */
export const parseLogoutOptions = (argv) => {
    let values;
    try {
        values = parseArgs({
            args: [...argv],
            allowPositionals: false,
            options: {
                harness: { type: "string" },
                "profile-dir": { type: "string" },
                "client-id": { type: "string" },
            },
        }).values;
    }
    catch {
        throw new LoginError(LOGOUT_USAGE);
    }
    if (values.harness === undefined)
        throw new LoginError(LOGOUT_USAGE);
    assertHarnessId(values.harness);
    const clientId = values["client-id"];
    if (clientId !== undefined && !CLIENT_ID_SHAPE.test(clientId))
        throw new LoginError("--client-id takes the printable client id the token was issued to.");
    return { harness: values.harness, profileDir: values["profile-dir"], clientId };
};
