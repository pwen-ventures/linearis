import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDefaultProfile, getProfile, } from "./profile-storage.js";
import { getStoredToken } from "./token-storage.js";
function resolveNamedProfile(name, source) {
    const profile = getProfile(name);
    if (!profile) {
        throw new Error(`Profile "${name}" not found. Run 'linearis auth list' to see available profiles.`);
    }
    return { token: profile.token, source, profile };
}
export function resolveApiToken(options) {
    if (options.apiToken) {
        return { token: options.apiToken, source: "flag" };
    }
    if (options.profile) {
        return resolveNamedProfile(options.profile, "profile-flag");
    }
    const envProfile = process.env.LINEARIS_PROFILE?.trim();
    if (envProfile) {
        return resolveNamedProfile(envProfile, "profile-env");
    }
    if (process.env.LINEAR_API_TOKEN) {
        return { token: process.env.LINEAR_API_TOKEN, source: "env" };
    }
    const defaultProfile = getDefaultProfile();
    if (defaultProfile) {
        return {
            token: defaultProfile.token,
            source: "profile-default",
            profile: defaultProfile,
        };
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
    throw new Error("No API token found. Run 'linearis auth login' to set up authentication.");
}
export function getApiToken(options) {
    const { token } = resolveApiToken(options);
    return token;
}
export function profileActorOverrides(profile) {
    if (!profile) {
        return {};
    }
    const overrides = {};
    if (profile.createAsUser) {
        overrides.createAsUser = profile.createAsUser;
    }
    if (profile.displayIconUrl) {
        overrides.displayIconUrl = profile.displayIconUrl;
    }
    return overrides;
}
