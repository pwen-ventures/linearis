import { notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
export async function resolveLabelId(client, nameOrId) {
    if (isUuid(nameOrId))
        return nameOrId;
    const result = await client.sdk.issueLabels({
        filter: { name: { eqIgnoreCase: nameOrId } },
        first: 1,
    });
    if (result.nodes.length === 0) {
        throw notFoundError("Label", nameOrId);
    }
    return result.nodes[0].id;
}
export async function resolveLabelIds(client, namesOrIds) {
    return Promise.all(namesOrIds.map((id) => resolveLabelId(client, id)));
}
