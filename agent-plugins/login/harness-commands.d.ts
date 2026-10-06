export type HarnessCommands = {
    /** The harness's own way to remove the plugin. Logout prints it and runs nothing. */
    readonly removePlugin: string;
    /** The harness's own sign-out for a native MCP OAuth session, when it has one. */
    readonly nativeSignOut?: string;
};
/** Keyed by the `--harness` value, the same id a build writes under `dist/`. */
export declare const HARNESS_COMMANDS: Readonly<Record<string, HarnessCommands>>;
export declare const commandsFor: (harness: string) => HarnessCommands | undefined;
