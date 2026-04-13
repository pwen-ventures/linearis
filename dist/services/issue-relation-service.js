import { notFoundError } from "../common/errors.js";
import { CreateIssueRelationDocument, DeleteIssueRelationDocument, GetIssueRelationsDocument, } from "../gql/graphql.js";
export async function createIssueRelation(client, input) {
    const result = await client.request(CreateIssueRelationDocument, { input });
    if (!result.issueRelationCreate.success) {
        throw new Error("Failed to create issue relation");
    }
    return result.issueRelationCreate.issueRelation;
}
export async function findIssueRelation(client, issueId, relatedIssueId) {
    const result = await client.request(GetIssueRelationsDocument, { issueId });
    if (!result.issue) {
        throw notFoundError("Issue", issueId);
    }
    const forwardMatch = result.issue.relations.nodes.find((r) => r.relatedIssue.id === relatedIssueId);
    if (forwardMatch)
        return forwardMatch.id;
    const inverseMatch = result.issue.inverseRelations.nodes.find((r) => r.issue.id === relatedIssueId);
    if (inverseMatch)
        return inverseMatch.id;
    throw notFoundError("Relation", `between ${issueId} and ${relatedIssueId}`);
}
export async function deleteIssueRelation(client, relationId) {
    const result = await client.request(DeleteIssueRelationDocument, { id: relationId });
    if (!result.issueRelationDelete.success) {
        throw new Error("Failed to delete issue relation");
    }
    return { id: result.issueRelationDelete.entityId, success: true };
}
