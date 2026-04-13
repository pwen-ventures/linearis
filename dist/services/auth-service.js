import { GetViewerDocument } from "../gql/graphql.js";
export async function validateToken(client) {
    const result = await client.request(GetViewerDocument);
    return result.viewer;
}
