export type EnvFileContent = {
    readonly harness: string;
    readonly token: string;
    /** Written only when the server is not the default one. */
    readonly mcpUrl: string | undefined;
};
export declare const renderEnvFile: (content: EnvFileContent) => string;
export type ParsedEnvFile = {
    readonly writtenByLogin: boolean;
    readonly values: Readonly<Record<string, string>>;
};
/** `KEY=value` lines, comments and blanks skipped. The reader a harness extension uses for the file. */
export declare const parseEnvFile: (text: string) => ParsedEnvFile;
export declare const envFilePathOf: (profileDir: string) => string;
/**
 * True when `dir` sits inside a repository checkout below `home`. A token in a
 * repository's tree is one `git add` from a public history. The home directory
 * itself is not tested, because a dotfiles repository there is a person's own.
 */
export declare const insideRepository: (dir: string, home: string | undefined) => boolean;
export declare const readIfPresent: (path: string) => Promise<string | undefined>;
export type PlanInput = {
    readonly profileDir: string;
    readonly harness: string;
    readonly mcpUrl: string | undefined;
    readonly home: string | undefined;
    readonly force: boolean;
};
export type ProfileEnvPlan = {
    readonly path: string;
    /** Writes the file. Throws a `LoginError` that names the path and the error code, never the token. */
    readonly write: (token: string) => Promise<void>;
};
/**
 * Every refusal that can be known before a person approves anything, with no
 * write: the directory sits in a repository, the target is a file this command
 * did not write, or nothing above the directory is writable. A refusal after
 * approval would leave a live token nobody holds.
 *
 * The returned `write` puts the file down readable by its owner only. The bytes
 * go to a temporary file created exclusively with mode 0600 in the same
 * directory, then rename over the target, so a reader sees the old file or the
 * whole new one and a symlink at the target is replaced and never followed.
 */
export declare const planProfileEnvFile: (input: PlanInput) => Promise<ProfileEnvPlan>;
