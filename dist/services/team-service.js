import { GetTeamsDocument } from "../gql/graphql.js";
export async function listTeams(client, options = {}) {
    const { limit = 50, after } = options;
    const result = await client.request(GetTeamsDocument, {
        first: limit,
        after,
    });
    return {
        nodes: result.teams.nodes,
        pageInfo: result.teams.pageInfo,
    };
}
