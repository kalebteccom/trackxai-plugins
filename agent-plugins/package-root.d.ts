/** This package's root, found from the running file so source and `dist/_compiler` both resolve. */
export declare const packageRoot: () => string;
/** The one version every artefact carries. */
export declare const packageVersion: () => string;
/** The exact version this package pins for a dependency, so an artefact that ships the same code pins the same one. */
export declare const packageDependency: (name: string) => string;
