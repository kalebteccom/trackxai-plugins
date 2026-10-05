import { MAX_INTERVAL_SECONDS, MAX_TRANSIENT_FAILURES, SLOW_DOWN_STEP_SECONDS } from "./constants.js";
import { LoginError } from "./login-error.js";
const EXPIRED = "The code expired before anyone approved it. Run the command again for a new one.";
const DENIED = "The request was denied. No token was issued.";
/**
 * Polls at the server's interval until it answers with a token, a refusal or
 * the code runs out. `slow_down` widens every later wait by five seconds. A
 * network error or 5xx backs off exponentially, from the current interval, and
 * gives up after five in a row.
 */
export const awaitToken = async (input) => {
    const { clock, signal } = input;
    const deadline = clock.now() + input.expiresInSeconds * 1000;
    let interval = input.intervalSeconds;
    let failures = 0;
    let wait = interval;
    for (;;) {
        try {
            await clock.sleep(wait * 1000, signal);
        }
        catch {
            throw new LoginError("Cancelled. Nothing was stored.");
        }
        if (clock.now() >= deadline)
            throw new LoginError(EXPIRED);
        const result = await input.poll();
        switch (result.kind) {
            case "token":
                return result.token;
            case "expired":
                throw new LoginError(EXPIRED);
            case "denied":
                throw new LoginError(DENIED);
            case "pending":
                failures = 0;
                wait = interval;
                break;
            case "slow-down":
                failures = 0;
                interval = Math.min(MAX_INTERVAL_SECONDS, interval + SLOW_DOWN_STEP_SECONDS);
                wait = interval;
                break;
            case "transient":
                failures += 1;
                if (failures >= MAX_TRANSIENT_FAILURES)
                    throw new LoginError("Lost contact with the server while waiting for approval. Run the command again.");
                wait = Math.min(MAX_INTERVAL_SECONDS, result.afterSeconds ?? interval * 2 ** failures);
                break;
        }
    }
};
