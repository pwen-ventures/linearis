import { exec } from "node:child_process";
import { createInterface } from "node:readline";
import { resolveApiToken, } from "../common/auth.js";
import { createGraphQLClient } from "../common/context.js";
import { handleCommand, outputSuccess } from "../common/output.js";
import { clearToken, saveToken } from "../common/token-storage.js";
import { formatDomainUsage } from "../common/usage.js";
import { validateToken } from "../services/auth-service.js";
const LINEAR_API_KEY_URL = "https://linear.app/settings/account/security/api-keys/new";
const SOURCE_LABELS = {
    flag: "--api-token flag",
    env: "LINEAR_API_TOKEN env var",
    stored: "~/.linearis/token",
    legacy: "~/.linear_api_token (deprecated)",
};
export const AUTH_META = {
    name: "auth",
    summary: "authenticate with Linear API (interactive, for humans)",
    context: [
        "linearis requires a Linear API token for all operations.",
        "the auth command guides you through creating and storing a token.",
        "tokens are encrypted and stored in ~/.linearis/token.",
        "token resolution order: --api-token flag, LINEAR_API_TOKEN env,",
        "~/.linearis/token (encrypted), ~/.linear_api_token (deprecated).",
    ].join("\n"),
    arguments: {},
    seeAlso: [],
};
function openBrowser(url) {
    const cmd = process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
            ? `start "" "${url}"`
            : `xdg-open "${url}"`;
    exec(cmd, () => {
    });
}
function promptToken() {
    return new Promise((resolve, reject) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stderr,
        });
        process.stderr.write("Paste your Linear API token: ");
        if (process.stdin.isTTY) {
            process.stdin.setRawMode?.(true);
            process.stdin.resume();
            process.stdin.setEncoding("utf8");
            let token = "";
            const onData = (char) => {
                if (char === "\n" || char === "\r") {
                    process.stdin.setRawMode?.(false);
                    process.stdin.pause();
                    process.stdin.removeListener("data", onData);
                    process.stderr.write("\n");
                    rl.close();
                    resolve(token.trim());
                }
                else if (char === "\u0003") {
                    process.stdin.setRawMode?.(false);
                    process.stdin.pause();
                    process.stdin.removeListener("data", onData);
                    process.stderr.write("\n");
                    rl.close();
                    reject(new Error("Cancelled"));
                }
                else if (char === "\u007F" || char === "\b") {
                    if (token.length > 0) {
                        token = token.slice(0, -1);
                        process.stderr.write("\b \b");
                    }
                }
                else {
                    token += char;
                    process.stderr.write("*");
                }
            };
            process.stdin.on("data", onData);
        }
        else {
            rl.question("", (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        }
    });
}
function validateApiToken(token) {
    return validateToken(createGraphQLClient(token));
}
export function setupAuthCommands(program) {
    const auth = program
        .command("auth")
        .description("Authenticate with Linear API");
    auth.action(() => auth.help());
    auth
        .command("login")
        .description("set up or refresh authentication")
        .option("--force", "reauthenticate even if already authenticated")
        .action(async (options, command) => {
        try {
            if (!options.force) {
                try {
                    const rootOpts = command.parent.parent.opts();
                    const { token, source } = resolveApiToken(rootOpts);
                    try {
                        const viewer = await validateApiToken(token);
                        console.error(`Already authenticated as ${viewer.name} (${viewer.email}) via ${SOURCE_LABELS[source]}.`);
                        console.error("Run with --force to reauthenticate.");
                        return;
                    }
                    catch {
                        console.error("Existing token is invalid. Starting new authentication...");
                    }
                }
                catch {
                }
            }
            console.error("");
            console.error("To authenticate, create a new Linear API key:");
            console.error("");
            console.error("  1. Open the link below (or it will open automatically)");
            console.error("  2. Set key name to: linearis-cli");
            console.error("  3. Keep 'Full access' selected (default)");
            console.error("  4. Keep 'All teams' selected (default)");
            console.error("  5. Click 'Create'");
            console.error("  6. Copy the generated token");
            console.error("");
            console.error(`  ${LINEAR_API_KEY_URL}`);
            console.error("");
            openBrowser(LINEAR_API_KEY_URL);
            const token = await promptToken();
            if (!token) {
                console.error("No token provided. Authentication cancelled.");
                process.exit(1);
                return;
            }
            console.error("Validating token...");
            let viewer;
            try {
                viewer = await validateApiToken(token);
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                console.error(`Token validation failed: ${detail}`);
                process.exit(1);
                return;
            }
            saveToken(token);
            console.error("");
            console.error(`Authentication successful. Logged in as ${viewer.name} (${viewer.email}).`);
            console.error("Token encrypted and stored in ~/.linearis/token");
        }
        catch (error) {
            console.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
            return;
        }
    });
    auth
        .command("status")
        .description("check current authentication status")
        .action(handleCommand(async (...args) => {
        const [, command] = args;
        const rootOpts = command.parent.parent.opts();
        let token;
        let source;
        try {
            const resolved = resolveApiToken(rootOpts);
            token = resolved.token;
            source = resolved.source;
        }
        catch {
            outputSuccess({
                authenticated: false,
                message: "No API token found. Run 'linearis auth login' to authenticate.",
            });
            return;
        }
        try {
            const viewer = await validateApiToken(token);
            outputSuccess({
                authenticated: true,
                source: SOURCE_LABELS[source],
                user: { id: viewer.id, name: viewer.name, email: viewer.email },
            });
        }
        catch {
            outputSuccess({
                authenticated: false,
                source: SOURCE_LABELS[source],
                message: "Token is invalid or expired. Run 'linearis auth login' to reauthenticate.",
            });
        }
    }));
    auth
        .command("logout")
        .description("remove stored authentication token")
        .action(handleCommand(async (...args) => {
        const [, command] = args;
        const rootOpts = command.parent.parent.opts();
        clearToken();
        try {
            const { source } = resolveApiToken(rootOpts);
            outputSuccess({
                message: "Authentication token removed.",
                warning: `A token is still active via ${SOURCE_LABELS[source]}.`,
            });
        }
        catch {
            outputSuccess({ message: "Authentication token removed." });
        }
    }));
    auth
        .command("usage")
        .description("show detailed usage for auth")
        .action(() => {
        console.log(formatDomainUsage(auth, AUTH_META));
    });
}
