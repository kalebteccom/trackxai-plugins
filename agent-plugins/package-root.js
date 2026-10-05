import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
/** This package's root, found from the running file so source and `dist/_compiler` both resolve. */
export const packageRoot = () => {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (;;) {
        const manifest = join(dir, "package.json");
        if (existsSync(manifest)) {
            const parsed = JSON.parse(readFileSync(manifest, "utf8"));
            if (typeof parsed === "object" &&
                parsed !== null &&
                "name" in parsed &&
                parsed.name === "@trackxai/agent-plugins") {
                return dir;
            }
        }
        const parent = dirname(dir);
        if (parent === dir)
            throw new Error("no @trackxai/agent-plugins package.json above this file");
        dir = parent;
    }
};
/** The one version every artefact carries. */
export const packageVersion = () => {
    const parsed = JSON.parse(readFileSync(join(packageRoot(), "package.json"), "utf8"));
    if (typeof parsed === "object" &&
        parsed !== null &&
        "version" in parsed &&
        typeof parsed.version === "string") {
        return parsed.version;
    }
    throw new Error("package.json carries no version");
};
/** The exact version this package pins for a dependency, so an artefact that ships the same code pins the same one. */
export const packageDependency = (name) => {
    const parsed = JSON.parse(readFileSync(join(packageRoot(), "package.json"), "utf8"));
    const dependencies = typeof parsed === "object" && parsed !== null && "dependencies" in parsed
        ? parsed.dependencies
        : undefined;
    const version = typeof dependencies === "object" && dependencies !== null
        ? dependencies[name]
        : undefined;
    if (typeof version === "string")
        return version;
    throw new Error(`package.json pins no version of ${name}`);
};
