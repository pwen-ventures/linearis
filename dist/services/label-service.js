import { GetLabelsDocument } from "../gql/graphql.js";
export async function listLabels(client, teamId, options = {}) {
    const { limit = 50, after } = options;
    const filter = teamId ? { team: { id: { eq: teamId } } } : undefined;
    const result = await client.request(GetLabelsDocument, {
        first: limit,
        after,
        filter,
    });
    return {
        nodes: result.issueLabels.nodes.map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
            description: label.description ?? undefined,
        })),
        pageInfo: result.issueLabels.pageInfo,
    };
}
