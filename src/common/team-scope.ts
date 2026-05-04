import { resolveTeamId } from "../resolvers/team-resolver.js";
import type { CommandContext } from "./context.js";

/**
 * Resolve the effective team UUID for a command:
 *
 * - When the user passed `--team <key|uuid>`, validate it against the
 *   profile's `defaultTeamId`. Different team → throw. Same team → pass through.
 * - When the user passed nothing, fall back to `ctx.defaultTeamId` (which may
 *   be undefined for unscoped profiles like a runtime/ops identity).
 *
 * Profiles that carry a `defaultTeamId` are *locked* to that team — overriding
 * to another team from the same profile is rejected loudly so the caller has
 * to switch profiles instead. This makes profile = workspace + actor + team an
 * enforceable invariant rather than a convention.
 */
export async function resolveScopedTeamId(
  ctx: CommandContext,
  flagValue: string | undefined,
): Promise<string | undefined> {
  if (!flagValue) {
    return ctx.defaultTeamId;
  }
  const resolved = await resolveTeamId(ctx.sdk, flagValue);
  if (ctx.defaultTeamId && resolved !== ctx.defaultTeamId) {
    throw new Error(
      `Profile is locked to team ${ctx.defaultTeamId} but --team "${flagValue}" resolves to ${resolved}. ` +
        "Switch to a profile whose defaultTeamId matches the team you want to query, or clear the lock with " +
        "`linearis -p <profile> auth set-default-team` (no argument).",
    );
  }
  return resolved;
}
