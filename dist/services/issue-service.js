import { applyActorOverrides } from "../common/actor.js";
import { CreateIssueDocument, FilteredSearchIssuesDocument, GetIssueByIdDocument, GetIssueByIdentifierDocument, GetIssueByIdentifierWithAttachmentsDocument, GetIssueByIdWithAttachmentsDocument, GetIssuesDocument, PaginationOrderBy, SearchIssuesDocument, UpdateIssueDocument, } from "../gql/graphql.js";
const NON_COMPLETED_ISSUES_FILTER = {
    state: { type: { neq: "completed" } },
};
function buildListIssuesFilter(filter) {
    return {
        and: [NON_COMPLETED_ISSUES_FILTER, filter],
    };
}
export async function listIssues(client, options = {}, filter) {
    const { limit = 25, after } = options;
    if (filter) {
        const result = await client.request(FilteredSearchIssuesDocument, {
            first: limit,
            after,
            filter: buildListIssuesFilter(filter),
            orderBy: PaginationOrderBy.UpdatedAt,
        });
        return {
            nodes: result.issues?.nodes ?? [],
            pageInfo: result.issues.pageInfo,
        };
    }
    const result = await client.request(GetIssuesDocument, {
        first: limit,
        after,
        orderBy: PaginationOrderBy.UpdatedAt,
    });
    return {
        nodes: result.issues?.nodes ?? [],
        pageInfo: result.issues.pageInfo,
    };
}
export async function getIssue(client, id) {
    const result = await client.request(GetIssueByIdDocument, {
        id,
    });
    if (!result.issue) {
        throw new Error(`Issue with ID "${id}" not found`);
    }
    return result.issue;
}
export async function getIssueByIdentifier(client, teamKey, issueNumber) {
    const result = await client.request(GetIssueByIdentifierDocument, { teamKey, number: issueNumber });
    if (!result.issues.nodes.length) {
        throw new Error(`Issue with identifier "${teamKey}-${issueNumber}" not found`);
    }
    return result.issues.nodes[0];
}
export async function getIssueWithAttachments(client, id) {
    const result = await client.request(GetIssueByIdWithAttachmentsDocument, { id });
    if (!result.issue) {
        throw new Error(`Issue with ID "${id}" not found`);
    }
    return result.issue;
}
export async function getIssueByIdentifierWithAttachments(client, teamKey, issueNumber) {
    const result = await client.request(GetIssueByIdentifierWithAttachmentsDocument, { teamKey, number: issueNumber });
    if (!result.issues.nodes.length) {
        throw new Error(`Issue with identifier "${teamKey}-${issueNumber}" not found`);
    }
    return result.issues.nodes[0];
}
export async function searchIssues(client, term, options = {}, filter) {
    const { limit = 25, after } = options;
    const variables = {
        term,
        first: limit,
        after,
        ...(filter && { filter }),
    };
    const result = await client.request(SearchIssuesDocument, variables);
    return {
        nodes: result.searchIssues?.nodes ?? [],
        pageInfo: result.searchIssues.pageInfo,
    };
}
export async function createIssue(client, input, actorOverrides) {
    const result = await client.request(CreateIssueDocument, { input: applyActorOverrides(input, actorOverrides) });
    if (!result.issueCreate.success || !result.issueCreate.issue) {
        throw new Error("Failed to create issue");
    }
    return result.issueCreate.issue;
}
export async function updateIssue(client, id, input) {
    const result = await client.request(UpdateIssueDocument, { id, input });
    if (!result.issueUpdate.success || !result.issueUpdate.issue) {
        throw new Error("Failed to update issue");
    }
    const issue = result.issueUpdate.issue;
    if (input.assigneeId != null && issue.assignee?.id !== input.assigneeId) {
        throw new Error(`Issue updated but the assignee was not applied (requested ${input.assigneeId}, ` +
            `got ${issue.assignee?.id ?? "null"}). ` +
            `The user is likely not assignable on this issue's team.`);
    }
    return issue;
}
