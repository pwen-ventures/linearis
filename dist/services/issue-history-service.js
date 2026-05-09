import { GetDocumentContentHistoryDocument, GetIssueDocumentContentIdDocument, GetIssueHistoryDocument, } from "../gql/graphql.js";
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
async function resolveIssueDocumentContentId(client, issueId) {
    const result = await client.request(GetIssueDocumentContentIdDocument, { id: issueId });
    if (!result.issue) {
        throw new Error(`Issue with ID "${issueId}" not found`);
    }
    if (!result.issue.documentContent?.id) {
        throw new Error(`Issue "${issueId}" has no documentContent (description has never been edited via the Linear editor)`);
    }
    return result.issue.documentContent.id;
}
export async function getIssueDescriptionHistory(client, issueId) {
    const documentContentId = await resolveIssueDocumentContentId(client, issueId);
    const result = await client.request(GetDocumentContentHistoryDocument, { documentContentId });
    if (!result.documentContentHistory.success) {
        throw new Error(`Failed to fetch description history for issue "${issueId}"`);
    }
    return { nodes: result.documentContentHistory.history };
}
export async function getIssueDescriptionHistoryEntry(client, issueId, versionId) {
    const { nodes } = await getIssueDescriptionHistory(client, issueId);
    const entry = nodes.find((node) => node.id === versionId);
    if (!entry) {
        throw new Error(`Description history entry "${versionId}" not found for issue "${issueId}"`);
    }
    return entry;
}
