import { DocumentCreateDocument, DocumentDeleteDocument, DocumentUpdateDocument, GetDocumentDocument, ListDocumentsDocument, } from "../gql/graphql.js";
export async function getDocument(client, id) {
    const result = await client.request(GetDocumentDocument, {
        id,
    });
    if (!result.document) {
        throw new Error(`Document with ID "${id}" not found`);
    }
    return result.document;
}
export async function createDocument(client, input) {
    const result = await client.request(DocumentCreateDocument, { input });
    if (!result.documentCreate.success || !result.documentCreate.document) {
        throw new Error("Failed to create document");
    }
    return result.documentCreate.document;
}
export async function updateDocument(client, id, input) {
    const result = await client.request(DocumentUpdateDocument, { id, input });
    if (!result.documentUpdate.success || !result.documentUpdate.document) {
        throw new Error("Failed to update document");
    }
    return result.documentUpdate.document;
}
export async function listDocuments(client, options) {
    const result = await client.request(ListDocumentsDocument, {
        first: options?.limit ?? 25,
        after: options?.after,
        filter: options?.filter,
    });
    return {
        nodes: result.documents?.nodes ?? [],
        pageInfo: result.documents?.pageInfo ?? {
            hasNextPage: false,
            endCursor: null,
        },
    };
}
export async function listDocumentsBySlugIds(client, slugIds) {
    if (slugIds.length === 0) {
        return [];
    }
    const result = await client.request(ListDocumentsDocument, {
        first: slugIds.length,
        filter: {
            slugId: { in: slugIds },
        },
    });
    return result.documents?.nodes ?? [];
}
export async function deleteDocument(client, id) {
    const result = await client.request(DocumentDeleteDocument, { id });
    if (!result.documentDelete.success) {
        throw new Error("Failed to delete document");
    }
    return { id: result.documentDelete.entity?.id ?? id, success: true };
}
