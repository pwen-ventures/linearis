import { multipleMatchesError, notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
import { resolveTeamId } from "./team-resolver.js";
export async function resolveCycleId(client, nameOrId, teamFilter) {
    if (isUuid(nameOrId))
        return nameOrId;
    const filter = {
        name: { eq: nameOrId },
    };
    if (teamFilter) {
        const teamId = await resolveTeamId(client, teamFilter);
        filter.team = { id: { eq: teamId } };
    }
    const cyclesConnection = await client.sdk.cycles({
        filter,
        first: 10,
    });
    const nodes = [];
    for (const cycle of cyclesConnection.nodes) {
        const team = await cycle.team;
        nodes.push({
            id: cycle.id,
            name: cycle.name ?? "",
            number: cycle.number,
            startsAt: cycle.startsAt
                ? new Date(cycle.startsAt).toISOString()
                : undefined,
            isActive: cycle.isActive,
            isNext: cycle.isNext,
            isPrevious: cycle.isPrevious,
            team: team ? { id: team.id, key: team.key, name: team.name } : undefined,
        });
    }
    if (nodes.length === 0) {
        throw notFoundError("Cycle", nameOrId, teamFilter ? `for team ${teamFilter}` : undefined);
    }
    let chosen = nodes.find((n) => n.isActive);
    if (!chosen)
        chosen = nodes.find((n) => n.isNext);
    if (!chosen)
        chosen = nodes.find((n) => n.isPrevious);
    if (!chosen && nodes.length === 1)
        chosen = nodes[0];
    if (!chosen) {
        const matches = nodes.map((n) => `${n.id} (${n.team?.key || "?"} / #${n.number} / ${n.startsAt})`);
        throw multipleMatchesError("cycle", nameOrId, matches, "use an ID or scope with --team");
    }
    return chosen.id;
}
