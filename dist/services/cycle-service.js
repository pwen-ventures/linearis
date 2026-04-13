import { GetCycleByIdDocument, GetCyclesDocument, } from "../gql/graphql.js";
export async function listCycles(client, teamId, activeOnly = false, options = {}) {
    const { limit = 50, after } = options;
    const filter = {};
    if (teamId) {
        filter.team = { id: { eq: teamId } };
    }
    if (activeOnly) {
        filter.isActive = { eq: true };
    }
    const result = await client.request(GetCyclesDocument, {
        first: limit,
        after,
        filter,
    });
    return {
        nodes: result.cycles.nodes.map((cycle) => ({
            id: cycle.id,
            number: cycle.number,
            name: cycle.name ?? `Cycle ${cycle.number}`,
            startsAt: cycle.startsAt,
            endsAt: cycle.endsAt,
            isActive: cycle.isActive,
            isNext: cycle.isNext,
            isPrevious: cycle.isPrevious,
        })),
        pageInfo: result.cycles.pageInfo,
    };
}
export async function getCycle(client, cycleId, issuesLimit = 50) {
    const result = await client.request(GetCycleByIdDocument, {
        id: cycleId,
        first: issuesLimit,
    });
    const cycle = result.cycle;
    if (!cycle) {
        throw new Error(`Cycle with ID "${cycleId}" not found`);
    }
    return {
        id: cycle.id,
        number: cycle.number,
        name: cycle.name ?? `Cycle ${cycle.number}`,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        isActive: cycle.isActive,
        isNext: cycle.isNext,
        isPrevious: cycle.isPrevious,
        issues: cycle.issues.nodes.map((issue) => ({
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            state: { name: issue.state.name },
        })),
    };
}
