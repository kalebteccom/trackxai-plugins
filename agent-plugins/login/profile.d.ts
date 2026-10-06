export type ProfileInput = {
    readonly harness: string;
    readonly profileDirFlag: string | undefined;
    readonly env: (name: string) => string | undefined;
    readonly home: string;
    readonly cwd: string;
};
export declare const assertHarnessId: (harness: string) => void;
/** Whether `login` and `logout` know this harness's profile directory without being told. */
export declare const hasKnownProfile: (harness: string) => boolean;
/** The active profile's directory: the flag, else the harness's own variable, else its default. */
export declare const profileDirOf: (input: ProfileInput) => string;
