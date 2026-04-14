import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ActorOverrides } from "./actor.js";
import {
  getDefaultProfile,
  getProfile,
  type ResolvedProfile,
} from "./profile-storage.js";
import { getStoredToken } from "./token-storage.js";

export interface CommandOptions {
  apiToken?: string;
  profile?: string;
}

export type TokenSource =
  | "flag"
  | "profile-flag"
  | "profile-env"
  | "env"
  | "profile-default"
  | "stored"
  | "legacy";

export interface ResolvedToken {
  token: string;
  source: TokenSource;
  profile?: ResolvedProfile;
}

function resolveNamedProfile(
  name: string,
  source: "profile-flag" | "profile-env",
): ResolvedToken {
  const profile = getProfile(name);
  if (!profile) {
    throw new Error(
      `Profile "${name}" not found. Run 'linearis auth list' to see available profiles.`,
    );
  }
  return { token: profile.token, source, profile };
}

/** @throws Error if no token found in any source */
export function resolveApiToken(options: CommandOptions): ResolvedToken {
  // 1. CLI flag (no profile actor overrides)
  if (options.apiToken) {
    return { token: options.apiToken, source: "flag" };
  }

  // 2. Named profile via flag
  if (options.profile) {
    return resolveNamedProfile(options.profile, "profile-flag");
  }

  // 3. Named profile via env
  const envProfile = process.env.LINEARIS_PROFILE?.trim();
  if (envProfile) {
    return resolveNamedProfile(envProfile, "profile-env");
  }

  // 4. LINEAR_API_TOKEN env
  if (process.env.LINEAR_API_TOKEN) {
    return { token: process.env.LINEAR_API_TOKEN, source: "env" };
  }

  // 5. Default profile (if configured)
  const defaultProfile = getDefaultProfile();
  if (defaultProfile) {
    return {
      token: defaultProfile.token,
      source: "profile-default",
      profile: defaultProfile,
    };
  }

  // 6. Encrypted stored token (~/.linearis/token) — legacy single-token store
  const storedToken = getStoredToken();
  if (storedToken) {
    return { token: storedToken, source: "stored" };
  }

  // 7. Legacy plaintext file (~/.linear_api_token) — deprecated
  const legacyFile = path.join(os.homedir(), ".linear_api_token");
  if (fs.existsSync(legacyFile)) {
    console.error(
      "Warning: ~/.linear_api_token is deprecated. Run 'linearis auth' to migrate.",
    );
    return {
      token: fs.readFileSync(legacyFile, "utf8").trim(),
      source: "legacy",
    };
  }

  throw new Error(
    "No API token found. Run 'linearis auth login' to set up authentication.",
  );
}

export function getApiToken(options: CommandOptions): string {
  const { token } = resolveApiToken(options);
  return token;
}

export function profileActorOverrides(
  profile: ResolvedProfile | undefined,
): ActorOverrides {
  if (!profile) {
    return {};
  }
  const overrides: ActorOverrides = {};
  if (profile.createAsUser) {
    overrides.createAsUser = profile.createAsUser;
  }
  if (profile.displayIconUrl) {
    overrides.displayIconUrl = profile.displayIconUrl;
  }
  return overrides;
}
