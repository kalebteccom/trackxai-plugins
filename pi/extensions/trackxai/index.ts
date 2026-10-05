import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { createTrackxaiExtension } from "./targets/pi/extension.js";

const readFile = (path: string): string | undefined => {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
};

const playbook = readFile(fileURLToPath(new URL("../../prompt/playbook.md", import.meta.url))) ?? "";

/** trackxai-pi 0.1.0. Pi calls the default export with its extension API. */
export default createTrackxaiExtension({
  version: "0.1.0",
  defaultUrl: "https://trackxai.kalebtec.com/mcp",
  playbook,
  fetch: (url, init) => globalThis.fetch(url, init),
  env: process.env,
  readFile,
  homeDir: homedir(),
});
