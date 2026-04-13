import { notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
export async function resolveStatusId(client, nameOrId, teamId) {
    if (isUuid(nameOrId))
        return nameOrId;
    const filter = {
        name: { eqIgnoreCase: nameOrId },
    };
    if (teamId) {
        filter.team = { id: { eq: teamId } };
    }
    const result = await client.sdk.workflowStates({
        filter,
        first: 1,
    });
    if (result.nodes.length === 0) {
        const context = teamId ? `for team ${teamId}` : undefined;
        throw notFoundError("Status", nameOrId, context);
    }
    return result.nodes[0].id;
}
