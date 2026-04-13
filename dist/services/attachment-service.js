import { AttachmentCreateDocument, AttachmentDeleteDocument, ListAttachmentsDocument, } from "../gql/graphql.js";
export async function createAttachment(client, input) {
    const result = await client.request(AttachmentCreateDocument, { input });
    if (!result.attachmentCreate.success || !result.attachmentCreate.attachment) {
        throw new Error("Failed to create attachment");
    }
    return result.attachmentCreate.attachment;
}
export async function deleteAttachment(client, id) {
    const result = await client.request(AttachmentDeleteDocument, { id });
    if (!result.attachmentDelete.success) {
        throw new Error("Failed to delete attachment");
    }
    return { id: result.attachmentDelete.entityId, success: true };
}
export async function listAttachments(client, issueId, filter) {
    const result = await client.request(ListAttachmentsDocument, { issueId, ...(filter && { filter }) });
    if (!result.issue) {
        throw new Error(`Issue with ID "${issueId}" not found`);
    }
    return result.issue.attachments?.nodes ?? [];
}
