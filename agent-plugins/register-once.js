import { SERVER_NAME } from "./constants.js";
/**
 * What a code-bearing plugin does with the server map it is handed at load time.
 * A `trackxai` entry already there (from the user, from remotxai's injector) is
 * left exactly as it is, and the plugin registers nothing.
 */
export const registerOnce = (existing, entry) => {
    const servers = existing ?? {};
    if (Object.hasOwn(servers, SERVER_NAME))
        return { servers, registered: false };
    return { servers: { ...servers, [SERVER_NAME]: entry }, registered: true };
};
