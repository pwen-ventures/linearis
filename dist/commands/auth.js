import { exec } from "node:child_process";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
const execAsync = promisify(exec);
import { resolveApiToken, } from "../common/auth.js";
import { createGraphQLClient } from "../common/context.js";
import { handleCommand, outputSuccess } from "../common/output.js";
import { deleteProfile, ensureProfilesFile, getProfilesPath, listProfiles, profileExists, saveProfile, setProfileDefaultTeamId, } from "../common/profile-storage.js";
import { clearToken, saveToken } from "../common/token-storage.js";
import { formatDomainUsage } from "../common/usage.js";
import { validateToken } from "../services/auth-service.js";
const LINEAR_API_KEY_URL = "https://linear.app/pwen-ventures/settings/api";
const SOURCE_LABELS = {
    flag: "--api-token flag",
    "profile-flag": "--profile flag",
    "profile-env": "LINEARIS_PROFILE env var",
    env: "LINEAR_API_TOKEN env var",
    "profile-default": "default profile",
    stored: "~/.linearis/token",
    legacy: "~/.linear_api_token (deprecated)",
};
export const AUTH_META = {
    name: "auth",
    summary: "authenticate with Linear API (interactive, for humans)",
    context: [
        "linearis requires a Linear API token for all operations.",
        "use 'auth login' to store a token (optionally under a named profile via -p).",
        "profiles let you switch between tokens and actor attributions (createAsUser,",
        "displayIconUrl) and live in ~/.linearis/profiles.json (encrypted token).",
        "token resolution order: --api-token flag, --profile flag, LINEARIS_PROFILE",
        "env, LINEAR_API_TOKEN env, default profile, ~/.linearis/token (legacy),",
        "~/.linear_api_token (deprecated).",
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
function getRootOpts(command) {
    return command.parent.parent.opts();
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
        .option("--as <name>", "display name for created issues/comments (profile only)")
        .option("--icon-url <url>", "avatar URL for created issues/comments (profile only)")
        .option("--default-team-id <uuid>", "team UUID applied automatically as the team filter when --team is omitted (profile only)")
        .action(async (options, command) => {
        const rootOpts = getRootOpts(command);
        const profileName = rootOpts.profile;
        try {
            if (!options.force && !profileName) {
                try {
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
            if (profileName && !options.force && profileExists(profileName)) {
                console.error(`Profile "${profileName}" already exists. Run with --force to overwrite.`);
                return;
            }
            console.error("");
            if (profileName) {
                console.error(`Setting up profile: ${profileName}`);
                console.error("");
            }
            console.error("To authenticate, create an OAuth application (recommended) or a personal API key:");
            console.error("");
            console.error("  1. Open the link below (or it will open automatically)");
            console.error("  2. For OAuth app: under 'OAuth Applications' create a new app and");
            console.error("     copy its developer token");
            console.error("  3. For personal API key: under 'Personal API keys' create a new key");
            console.error("     and copy the generated token");
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
            if (profileName) {
                saveProfile(profileName, {
                    token,
                    createAsUser: options.as,
                    displayIconUrl: options.iconUrl,
                    defaultTeamId: options.defaultTeamId,
                });
                console.error("");
                console.error(`Profile "${profileName}" saved. Logged in as ${viewer.name} (${viewer.email}).`);
                console.error(`Stored in ${getProfilesPath()}`);
            }
            else {
                if (options.as || options.iconUrl || options.defaultTeamId) {
                    console.error("Warning: --as, --icon-url, and --default-team-id require -p/--profile; ignoring.");
                }
                saveToken(token);
                console.error("");
                console.error(`Authentication successful. Logged in as ${viewer.name} (${viewer.email}).`);
                console.error("Token encrypted and stored in ~/.linearis/token");
            }
        }
        catch (error) {
            console.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
            return;
        }
    });
    auth
        .command("logout")
        .description("remove stored authentication token or profile")
        .action(handleCommand(async (...args) => {
        const [, command] = args;
        const rootOpts = getRootOpts(command);
        if (rootOpts.profile) {
            const removed = deleteProfile(rootOpts.profile);
            if (!removed) {
                outputSuccess({
                    message: `Profile "${rootOpts.profile}" does not exist.`,
                });
                return;
            }
            outputSuccess({
                message: `Profile "${rootOpts.profile}" removed.`,
            });
            return;
        }
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
        .command("list")
        .description("list configured profiles")
        .action(handleCommand(async () => {
        const { defaultProfile, profiles } = listProfiles();
        outputSuccess({
            defaultProfile,
            profiles,
            path: getProfilesPath(),
        });
    }));
    auth
        .command("config")
        .description("open the profile config file in VS Code")
        .action(handleCommand(async () => {
        ensureProfilesFile();
        const filePath = getProfilesPath();
        try {
            await execAsync(`code ${JSON.stringify(filePath)}`);
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to open VS Code (path: ${filePath}): ${detail}`);
        }
        outputSuccess({ path: filePath, opened: true });
    }));
    auth
        .command("set-default-team")
        .description("set or clear the default team UUID for a profile (used as fallback when --team is omitted)")
        .argument("[team-uuid]", "team UUID; omit to clear the default")
        .action(handleCommand(async (...args) => {
        const [teamUuid, , command] = args;
        const rootOpts = getRootOpts(command);
        if (!rootOpts.profile) {
            throw new Error("set-default-team requires -p/--profile to identify which profile to update");
        }
        const updated = setProfileDefaultTeamId(rootOpts.profile, teamUuid?.trim() || undefined);
        if (!updated) {
            throw new Error(`Profile "${rootOpts.profile}" not found. Run 'linearis auth list' to see available profiles.`);
        }
        outputSuccess({
            profile: rootOpts.profile,
            defaultTeamId: teamUuid?.trim() || null,
            message: teamUuid
                ? `Default team UUID set on profile "${rootOpts.profile}".`
                : `Default team UUID cleared on profile "${rootOpts.profile}".`,
        });
    }));
    auth
        .command("usage")
        .description("show detailed usage for auth")
        .action(() => {
        console.log(formatDomainUsage(auth, AUTH_META));
    });
}
