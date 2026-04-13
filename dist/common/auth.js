import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getStoredToken } from "./token-storage.js";
export function resolveApiToken(options) {
    if (options.apiToken) {
        return { token: options.apiToken, source: "flag" };
    }
    if (process.env.LINEAR_API_TOKEN) {
        return { token: process.env.LINEAR_API_TOKEN, source: "env" };
    }
    const storedToken = getStoredToken();
    if (storedToken) {
        return { token: storedToken, source: "stored" };
    }
    const legacyFile = path.join(os.homedir(), ".linear_api_token");
    if (fs.existsSync(legacyFile)) {
        console.error("Warning: ~/.linear_api_token is deprecated. Run 'linearis auth' to migrate.");
        return {
            token: fs.readFileSync(legacyFile, "utf8").trim(),
            source: "legacy",
        };
    }
    throw new Error("No API token found. Run 'linearis auth' to set up authentication.");
}
export function getApiToken(options) {
    const { token } = resolveApiToken(options);
    return token;
}
