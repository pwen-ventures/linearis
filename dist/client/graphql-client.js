import { LinearClient } from "@linear/sdk";
import { print } from "graphql";
import { AuthenticationError, isAuthError } from "../common/errors.js";
import { withRetry } from "../common/retry.js";
const REQUEST_TIMEOUT_MS = 30_000;
export class GraphQLClient {
    rawClient;
    constructor(apiToken) {
        const linearClient = new LinearClient({
            apiKey: apiToken,
            headers: {
                "public-file-urls-expire-in": "3600",
            },
        });
        this.rawClient = linearClient.client;
    }
    async request(document, variables) {
        try {
            const response = await withRetry(() => Promise.race([
                this.rawClient.rawRequest(print(document), variables),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), REQUEST_TIMEOUT_MS)),
            ]));
            return response.data;
        }
        catch (error) {
            const gqlError = error;
            const errorMessage = gqlError.response?.errors?.[0]?.message ?? "";
            if (isAuthError(new Error(errorMessage))) {
                throw new AuthenticationError(errorMessage || undefined);
            }
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`GraphQL request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
