import type { GraphQLClient } from "../client/graphql-client.js";
import type { PaginatedResult, PaginationOptions } from "../common/types.js";
import {
  type DocumentContentHistoryFieldsFragment,
  GetIssueDescriptionHistoryDocument,
  type GetIssueDescriptionHistoryQuery,
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

export async function getIssueDescriptionHistory(
  client: GraphQLClient,
  issueId: string,
): Promise<{ history: IssueDescriptionHistoryEntry[] }> {
  const result = await client.request<GetIssueDescriptionHistoryQuery>(
    GetIssueDescriptionHistoryDocument,
    { id: issueId },
  );

  if (!result.documentContentHistory.success) {
    throw new Error(
      `Failed to fetch description history for issue "${issueId}"`,
    );
  }

  return { history: result.documentContentHistory.history };
}

export async function getIssueDescriptionHistoryEntry(
  client: GraphQLClient,
  issueId: string,
  versionId: string,
): Promise<IssueDescriptionHistoryEntry> {
  const { history } = await getIssueDescriptionHistory(client, issueId);
  const entry = history.find((node) => node.id === versionId);
  if (!entry) {
    throw new Error(
      `Description history entry "${versionId}" not found for issue "${issueId}"`,
    );
  }
  return entry;
}
