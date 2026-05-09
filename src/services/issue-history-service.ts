import type { GraphQLClient } from "../client/graphql-client.js";
import type { PaginatedResult, PaginationOptions } from "../common/types.js";
import {
  type DocumentContentHistoryFieldsFragment,
  GetDocumentContentHistoryDocument,
  type GetDocumentContentHistoryQuery,
  GetIssueDocumentContentIdDocument,
  type GetIssueDocumentContentIdQuery,
  GetIssueHistoryDocument,
  type GetIssueHistoryQuery,
  type IssueHistoryFieldsFragment,
} from "../gql/graphql.js";

export type IssueHistoryEntry = IssueHistoryFieldsFragment;
export type IssueDescriptionHistoryEntry = DocumentContentHistoryFieldsFragment;

export async function getIssueHistory(
  client: GraphQLClient,
  issueId: string,
  options: PaginationOptions = {},
): Promise<PaginatedResult<IssueHistoryEntry>> {
  const { limit = 25, after } = options;

  const result = await client.request<GetIssueHistoryQuery>(
    GetIssueHistoryDocument,
    { id: issueId, first: limit, after },
  );

  if (!result.issue) {
    throw new Error(`Issue with ID "${issueId}" not found`);
  }

  return {
    nodes: result.issue.history.nodes,
    pageInfo: result.issue.history.pageInfo,
  };
}

// Linear's `documentContentHistory(id:)` query takes a DocumentContent.id,
// not an Issue.id — they are distinct entities. Resolve the issue's
// documentContent.id first, then fetch the history with it.
async function resolveIssueDocumentContentId(
  client: GraphQLClient,
  issueId: string,
): Promise<string> {
  const result = await client.request<GetIssueDocumentContentIdQuery>(
    GetIssueDocumentContentIdDocument,
    { id: issueId },
  );

  if (!result.issue) {
    throw new Error(`Issue with ID "${issueId}" not found`);
  }

  if (!result.issue.documentContent?.id) {
    throw new Error(
      `Issue "${issueId}" has no documentContent (description has never been edited via the Linear editor)`,
    );
  }

  return result.issue.documentContent.id;
}

export async function getIssueDescriptionHistory(
  client: GraphQLClient,
  issueId: string,
): Promise<{ nodes: IssueDescriptionHistoryEntry[] }> {
  const documentContentId = await resolveIssueDocumentContentId(
    client,
    issueId,
  );

  const result = await client.request<GetDocumentContentHistoryQuery>(
    GetDocumentContentHistoryDocument,
    { documentContentId },
  );

  if (!result.documentContentHistory.success) {
    throw new Error(
      `Failed to fetch description history for issue "${issueId}"`,
    );
  }

  return { nodes: result.documentContentHistory.history };
}

export async function getIssueDescriptionHistoryEntry(
  client: GraphQLClient,
  issueId: string,
  versionId: string,
): Promise<IssueDescriptionHistoryEntry> {
  const { nodes } = await getIssueDescriptionHistory(client, issueId);
  const entry = nodes.find((node) => node.id === versionId);
  if (!entry) {
    throw new Error(
      `Description history entry "${versionId}" not found for issue "${issueId}"`,
    );
  }
  return entry;
}
