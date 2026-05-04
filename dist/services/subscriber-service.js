import { notFoundError } from "../common/errors.js";
import { GetIssueSubscribersDocument, IssueSubscribeDocument, IssueUnsubscribeDocument, } from "../gql/graphql.js";
export async function listIssueSubscribers(client, issueId) {
    const result = await client.request(GetIssueSubscribersDocument, { id: issueId });
    if (!result.issue) {
        throw notFoundError("Issue", issueId);
    }
    return result.issue;
}
export async function subscribeIssue(client, issueId, user) {
    const result = await client.request(IssueSubscribeDocument, { id: issueId, userId: user.userId, userEmail: user.userEmail });
    if (!result.issueSubscribe.success || !result.issueSubscribe.issue) {
        throw new Error("Failed to subscribe to issue");
    }
    return result.issueSubscribe.issue;
}
export async function unsubscribeIssue(client, issueId, user) {
    const result = await client.request(IssueUnsubscribeDocument, { id: issueId, userId: user.userId, userEmail: user.userEmail });
    if (!result.issueUnsubscribe.success || !result.issueUnsubscribe.issue) {
        throw new Error("Failed to unsubscribe from issue");
    }
    return result.issueUnsubscribe.issue;
}
