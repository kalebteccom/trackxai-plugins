export type RegisterOnceResult = {
    readonly servers: Readonly<Record<string, unknown>>;
    readonly registered: boolean;
};
/**
 * What a code-bearing plugin does with the server map it is handed at load time.
 * A `trackxai` entry already there (from the user, from remotxai's injector) is
 * left exactly as it is, and the plugin registers nothing.
 */
export declare const registerOnce: (existing: Readonly<Record<string, unknown>> | undefined, entry: unknown) => RegisterOnceResult;
