import { resolveTeamId } from "../resolvers/team-resolver.js";
export async function resolveScopedTeamId(ctx, flagValue) {
    if (!flagValue) {
        return ctx.defaultTeamId;
    }
    const resolved = await resolveTeamId(ctx.sdk, flagValue);
    if (ctx.defaultTeamId && resolved !== ctx.defaultTeamId) {
        throw new Error(`Profile is locked to team ${ctx.defaultTeamId} but --team "${flagValue}" resolves to ${resolved}. ` +
            "Switch to a profile whose defaultTeamId matches the team you want to query, or clear the lock with " +
            "`linearis -p <profile> auth set-default-team` (no argument).");
    }
    return resolved;
}
