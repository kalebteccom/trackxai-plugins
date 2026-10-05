import { HOST_NAME_MAX_LENGTH } from "./constants.js";
/** Control characters, and the bidirectional marks and isolates that reorder text on the approval page. */
const UNSAFE = /[\p{C}؜‎‏‪-‮⁦-⁩]/gu;
/**
 * The name the device page shows the approver and the token carries. It is
 * cleaned here because the page prints it, and a machine's name is whatever
 * its owner typed.
 */
export const cleanHostName = (raw) => {
    const cleaned = raw.replace(UNSAFE, "").trim();
    return Array.from(cleaned).slice(0, HOST_NAME_MAX_LENGTH).join("").trim();
};
