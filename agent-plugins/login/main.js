#!/usr/bin/env node
import { spawn } from "node:child_process";
import { homedir, hostname } from "node:os";
import { LoginError } from "./login-error.js";
import { packageVersion } from "../package-root.js";
import { browserAvailableIn, parseLoginOptions, USAGE } from "./options.js";
import { runLogin } from "./run-login.js";
/**
 * The command file: the one place in this package that reads the process
 * environment and names the global `fetch`. Everything it calls takes both as
 * arguments, so the tests run with neither.
 */
const env = (name) => process.env[name];
const openUrl = (url) => new Promise((resolve) => {
    const [command, ...args] = process.platform === "darwin"
        ? ["open", url]
        : process.platform === "win32"
            ? ["rundll32", "url.dll,FileProtocolHandler", url]
            : ["xdg-open", url];
    const child = spawn(command ?? "open", args, { stdio: "ignore", detached: true });
    child.once("error", () => resolve(false));
    child.once("spawn", () => {
        child.unref();
        resolve(true);
    });
});
const sleep = (millis, signal) => new Promise((resolve, reject) => {
    if (signal.aborted)
        return reject(new Error("aborted"));
    const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
    }, millis);
    const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
});
const main = async (argv) => {
    if (argv[0] !== "login") {
        process.stderr.write(`${USAGE}\n`);
        return 2;
    }
    const abort = new AbortController();
    process.once("SIGINT", () => abort.abort());
    try {
        const options = parseLoginOptions(argv.slice(1), {
            env,
            defaultHostName: hostname(),
            browserAvailable: browserAvailableIn(env, process.platform),
        });
        await runLogin(options, {
            api: { http: (url, init) => fetch(url, init), userAgent: `trackxai-login/${packageVersion()}` },
            clock: { now: () => Date.now(), sleep },
            signal: abort.signal,
            say: (line) => process.stdout.write(`${line}\n`),
            openUrl,
            env,
            home: homedir(),
            cwd: process.cwd(),
        });
        return 0;
    }
    catch (error) {
        process.stderr.write(`trackxai login: ${error instanceof LoginError ? error.message : "failed unexpectedly."}\n`);
        return 1;
    }
};
process.exitCode = await main(process.argv.slice(2));
