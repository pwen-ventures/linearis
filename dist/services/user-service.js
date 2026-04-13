import { GetUsersDocument } from "../gql/graphql.js";
export async function listUsers(client, activeOnly = false, options = {}) {
    const { limit = 50, after } = options;
    const filter = activeOnly ? { active: { eq: true } } : undefined;
    const result = await client.request(GetUsersDocument, {
        first: limit,
        after,
        filter,
    });
    return {
        nodes: result.users.nodes.sort((a, b) => a.name.localeCompare(b.name)),
        pageInfo: result.users.pageInfo,
    };
}
