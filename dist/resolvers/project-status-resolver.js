import { notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
import { GetProjectStatusesDocument, } from "../gql/graphql.js";
export async function resolveProjectStatusId(client, nameOrId) {
    if (isUuid(nameOrId))
        return nameOrId;
    const result = await client.request(GetProjectStatusesDocument);
    const match = result.projectStatuses.nodes.find((s) => s.name.toLowerCase() === nameOrId.toLowerCase());
    if (!match) {
        throw notFoundError("Project status", nameOrId);
    }
    return match.id;
}
