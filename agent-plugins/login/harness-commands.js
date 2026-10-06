/** Keyed by the `--harness` value, the same id a build writes under `dist/`. */
export const HARNESS_COMMANDS = {
    "claude-code": {
        removePlugin: "claude plugin uninstall trackxai@trackxai",
        nativeSignOut: "claude mcp logout trackxai",
    },
    codex: {
        removePlugin: "codex plugin remove trackxai@trackxai",
        nativeSignOut: "codex mcp logout trackxai",
    },
    opencode: {
        removePlugin: "take the trackxai entry out of the plugin list in opencode.json",
        nativeSignOut: "opencode mcp logout trackxai",
    },
    hermes: {
        removePlugin: "delete plugins/trackxai in the profile and take trackxai out of plugins.enabled",
    },
    pi: { removePlugin: "pi remove <dir>/node_modules/@trackxai/pi" },
};
export const commandsFor = (harness) => Object.hasOwn(HARNESS_COMMANDS, harness) ? HARNESS_COMMANDS[harness] : undefined;
