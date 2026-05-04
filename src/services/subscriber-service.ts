import type { GraphQLClient } from "../client/graphql-client.js";
import { notFoundError } from "../common/errors.js";
import {
  GetIssueSubscribersDocument,
  type GetIssueSubscribersQuery,
  IssueSubscribeDocument,
  type IssueSubscribeMutation,
  IssueUnsubscribeDocument,
  type IssueUnsubscribeMutation,
} from "../gql/graphql.js";

type SubscribeIssue = NonNullable<
  IssueSubscribeMutation["issueSubscribe"]["issue"]
>;
type SubscribersIssue = GetIssueSubscribersQuery["issue"];

export async function listIssueSubscribers(
  client: GraphQLClient,
  issueId: string,
): Promise<SubscribersIssue> {
  const result = await client.request<GetIssueSubscribersQuery>(
    GetIssueSubscribersDocument,
    { id: issueId },
  );
  if (!result.issue) {
    throw notFoundError("Issue", issueId);
  }
  return result.issue;
}

export async function subscribeIssue(
  client: GraphQLClient,
  issueId: string,
  user: { userId?: string; userEmail?: string },
): Promise<SubscribeIssue> {
  const result = await client.request<IssueSubscribeMutation>(
    IssueSubscribeDocument,
    { id: issueId, userId: user.userId, userEmail: user.userEmail },
  );
  if (!result.issueSubscribe.success || !result.issueSubscribe.issue) {
    throw new Error("Failed to subscribe to issue");
  }
  return result.issueSubscribe.issue;
}

export async function unsubscribeIssue(
  client: GraphQLClient,
  issueId: string,
  user: { userId?: string; userEmail?: string },
): Promise<SubscribeIssue> {
  const result = await client.request<IssueUnsubscribeMutation>(
    IssueUnsubscribeDocument,
    { id: issueId, userId: user.userId, userEmail: user.userEmail },
  );
  if (!result.issueUnsubscribe.success || !result.issueUnsubscribe.issue) {
    throw new Error("Failed to unsubscribe from issue");
  }
  return result.issueUnsubscribe.issue;
}
