import { multipleMatchesError, notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
export async function resolveUserId(client, nameOrEmailOrId) {
    if (isUuid(nameOrEmailOrId))
        return nameOrEmailOrId;
    const byName = await client.sdk.users({
        filter: { displayName: { eqIgnoreCase: nameOrEmailOrId } },
        first: 10,
    });
    if (byName.nodes.length === 1)
        return byName.nodes[0].id;
    if (byName.nodes.length > 1) {
        throw multipleMatchesError("User", nameOrEmailOrId, byName.nodes.map((u) => `${u.name} <${u.email}>`), "Use email or UUID to disambiguate");
    }
    const byEmail = await client.sdk.users({
        filter: { email: { eqIgnoreCase: nameOrEmailOrId } },
        first: 1,
    });
    if (byEmail.nodes.length > 0)
        return byEmail.nodes[0].id;
    throw notFoundError("User", nameOrEmailOrId);
}
