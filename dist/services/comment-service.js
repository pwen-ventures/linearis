import { applyActorOverrides } from "../common/actor.js";
import { CreateCommentDocument, DeleteCommentDocument, ListCommentsDocument, ResolveCommentDocument, UnresolveCommentDocument, UpdateCommentDocument, } from "../gql/graphql.js";
export async function createComment(client, input, actorOverrides) {
    const result = await client.request(CreateCommentDocument, { input: applyActorOverrides(input, actorOverrides) });
    if (!result.commentCreate.success || !result.commentCreate.comment) {
        throw new Error("Failed to create comment");
    }
    return result.commentCreate.comment;
}
export async function updateComment(client, id, input) {
    const result = await client.request(UpdateCommentDocument, { id, input });
    if (!result.commentUpdate.success || !result.commentUpdate.comment) {
        throw new Error("Failed to update comment");
    }
    return result.commentUpdate.comment;
}
export async function listComments(client, issueId, options = {}) {
    const { limit = 25, after } = options;
    const result = await client.request(ListCommentsDocument, {
        issueId,
        first: limit,
        after,
    });
    if (!result.issue) {
        throw new Error(`Issue with ID "${issueId}" not found`);
    }
    return {
        nodes: result.issue.comments?.nodes ?? [],
        pageInfo: result.issue.comments?.pageInfo ?? {
            hasNextPage: false,
            endCursor: null,
        },
    };
}
export async function replyToComment(client, input, actorOverrides) {
    const result = await client.request(CreateCommentDocument, {
        input: applyActorOverrides({
            issueId: input.issueId,
            parentId: input.parentId,
            body: input.body,
        }, actorOverrides),
    });
    if (!result.commentCreate.success || !result.commentCreate.comment) {
        throw new Error("Failed to create reply");
    }
    return result.commentCreate.comment;
}
export async function resolveComment(client, id, resolvingCommentId) {
    const result = await client.request(ResolveCommentDocument, { id, resolvingCommentId });
    if (!result.commentResolve.success || !result.commentResolve.comment) {
        throw new Error("Failed to resolve comment");
    }
    return result.commentResolve.comment;
}
export async function unresolveComment(client, id) {
    const result = await client.request(UnresolveCommentDocument, { id });
    if (!result.commentUnresolve.success || !result.commentUnresolve.comment) {
        throw new Error("Failed to unresolve comment");
    }
    return result.commentUnresolve.comment;
}
export async function deleteComment(client, id) {
    const result = await client.request(DeleteCommentDocument, { id });
    if (!result.commentDelete.success) {
        throw new Error("Failed to delete comment");
    }
    return {
        id: result.commentDelete.entityId,
        success: true,
    };
}
