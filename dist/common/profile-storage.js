import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { decryptToken, encryptToken } from "./encryption.js";
const DIR_NAME = "linearis";
const LEGACY_DIR_NAME = ".linearis";
const PROFILES_FILE = "profiles.json";
export function getProfilesDir() {
    if (process.platform === "linux") {
        const xdgConfig = process.env.XDG_CONFIG_HOME;
        if (xdgConfig && path.isAbsolute(xdgConfig)) {
            return path.join(xdgConfig, DIR_NAME);
        }
        return path.join(os.homedir(), ".config", DIR_NAME);
    }
    return path.join(os.homedir(), LEGACY_DIR_NAME);
}
export function getProfilesPath() {
    return path.join(getProfilesDir(), PROFILES_FILE);
}
function ensureProfilesDir() {
    const dir = getProfilesDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    else {
        fs.chmodSync(dir, 0o700);
    }
}
function emptyFile() {
    return { profiles: {} };
}
function readProfilesFile() {
    const filePath = getProfilesPath();
    if (!fs.existsSync(filePath)) {
        return emptyFile();
    }
    const raw = fs.readFileSync(filePath, "utf8");
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Profiles file at ${filePath} is not valid JSON: ${reason}. ` +
            `Edit the file by hand to fix the syntax, or delete it and run \`linearis auth login\` to recreate it.`);
    }
    if (!parsed.profiles || typeof parsed.profiles !== "object") {
        return emptyFile();
    }
    return parsed;
}
function writeProfilesFile(data) {
    ensureProfilesDir();
    const filePath = getProfilesPath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    fs.chmodSync(filePath, 0o600);
}
export function listProfiles() {
    const data = readProfilesFile();
    const profiles = Object.entries(data.profiles).map(([name, entry]) => ({
        name,
        ...(entry.createAsUser ? { createAsUser: entry.createAsUser } : {}),
        ...(entry.displayIconUrl ? { displayIconUrl: entry.displayIconUrl } : {}),
        ...(entry.defaultTeamId ? { defaultTeamId: entry.defaultTeamId } : {}),
    }));
    return {
        defaultProfile: data.defaultProfile ?? null,
        profiles,
    };
}
export function saveProfile(name, profile) {
    const data = readProfilesFile();
    data.profiles[name] = {
        token: encryptToken(profile.token),
        ...(profile.createAsUser ? { createAsUser: profile.createAsUser } : {}),
        ...(profile.displayIconUrl
            ? { displayIconUrl: profile.displayIconUrl }
            : {}),
        ...(profile.defaultTeamId ? { defaultTeamId: profile.defaultTeamId } : {}),
    };
    if (!data.defaultProfile) {
        data.defaultProfile = name;
    }
    writeProfilesFile(data);
}
export function setProfileDefaultTeamId(name, defaultTeamId) {
    const data = readProfilesFile();
    const entry = data.profiles[name];
    if (!entry) {
        return false;
    }
    if (defaultTeamId) {
        entry.defaultTeamId = defaultTeamId;
    }
    else {
        delete entry.defaultTeamId;
    }
    writeProfilesFile(data);
    return true;
}
export function deleteProfile(name) {
    const data = readProfilesFile();
    if (!data.profiles[name]) {
        return false;
    }
    delete data.profiles[name];
    if (data.defaultProfile === name) {
        const remaining = Object.keys(data.profiles);
        data.defaultProfile = remaining[0];
    }
    writeProfilesFile(data);
    return true;
}
export function getProfile(name) {
    const data = readProfilesFile();
    const entry = data.profiles[name];
    if (!entry) {
        return null;
    }
    return {
        name,
        token: decryptToken(entry.token),
        ...(entry.createAsUser ? { createAsUser: entry.createAsUser } : {}),
        ...(entry.displayIconUrl ? { displayIconUrl: entry.displayIconUrl } : {}),
        ...(entry.defaultTeamId ? { defaultTeamId: entry.defaultTeamId } : {}),
    };
}
export function getDefaultProfile() {
    const data = readProfilesFile();
    if (!data.defaultProfile) {
        return null;
    }
    return getProfile(data.defaultProfile);
}
export function ensureProfilesFile() {
    const filePath = getProfilesPath();
    if (!fs.existsSync(filePath)) {
        writeProfilesFile(emptyFile());
    }
}
export function profileExists(name) {
    const data = readProfilesFile();
    return Boolean(data.profiles[name]);
}
