#!/usr/bin/env node
import { spawn } from "node:child_process";
import { homedir, hostname } from "node:os";
import { LoginError } from "./login-error.js";
import { packageVersion } from "../package-root.js";
import { parseLogoutOptions, LOGOUT_USAGE } from "./logout-options.js";
import { browserAvailableIn, parseLoginOptions, USAGE } from "./options.js";
import { runLogin } from "./run-login.js";
import { runLogout } from "./run-logout.js";
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
const say = (line) => void process.stdout.write(`${line}\n`);
const login = async (argv) => {
    const abort = new AbortController();
    process.once("SIGINT", () => abort.abort());
    const options = parseLoginOptions(argv, {
        env,
        defaultHostName: hostname(),
        browserAvailable: browserAvailableIn(env, process.platform),
    });
    await runLogin(options, {
        api: { http: (url, init) => fetch(url, init), userAgent: `trackxai-login/${packageVersion()}` },
        clock: { now: () => Date.now(), sleep },
        signal: abort.signal,
        say,
        openUrl,
        env,
        home: homedir(),
        cwd: process.cwd(),
    });
};
const logout = async (argv) => {
    await runLogout(parseLogoutOptions(argv), {
        api: { http: (url, init) => fetch(url, init), userAgent: `trackxai-logout/${packageVersion()}` },
        say,
        env,
        home: homedir(),
        cwd: process.cwd(),
    });
};
const main = async (argv) => {
    const command = argv[0];
    if (command !== "login" && command !== "logout") {
        process.stderr.write(`${USAGE}\n${LOGOUT_USAGE}\n`);
        return 2;
    }
    try {
        await (command === "login" ? login : logout)(argv.slice(1));
        return 0;
    }
    catch (error) {
        process.stderr.write(`trackxai ${command}: ${error instanceof LoginError ? error.message : "failed unexpectedly."}\n`);
        return 1;
    }
};
process.exitCode = await main(process.argv.slice(2));
