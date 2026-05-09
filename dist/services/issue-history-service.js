import { GetIssueDescriptionHistoryDocument, GetIssueHistoryDocument, } from "../gql/graphql.js";
export async function getIssueHistory(client, issueId, options = {}) {
    const { limit = 25, after } = options;
    const result = await client.request(GetIssueHistoryDocument, { id: issueId, first: limit, after });
    if (!result.issue) {
        throw new Error(`Issue with ID "${issueId}" not found`);
    }
    return {
        nodes: result.issue.history.nodes,
        pageInfo: result.issue.history.pageInfo,
    };
}
export async function getIssueDescriptionHistory(client, issueId) {
    const result = await client.request(GetIssueDescriptionHistoryDocument, { id: issueId });
    if (!result.documentContentHistory.success) {
        throw new Error(`Failed to fetch description history for issue "${issueId}"`);
    }
    return { history: result.documentContentHistory.history };
}
export async function getIssueDescriptionHistoryEntry(client, issueId, versionId) {
    const { history } = await getIssueDescriptionHistory(client, issueId);
    const entry = history.find((node) => node.id === versionId);
    if (!entry) {
        throw new Error(`Description history entry "${versionId}" not found for issue "${issueId}"`);
    }
    return entry;
}
