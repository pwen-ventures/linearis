import { GraphQLClient } from "../client/graphql-client.js";
import { LinearSdkClient } from "../client/linear-client.js";
import { getApiToken } from "./auth.js";
export function createContext(options) {
    const token = getApiToken(options);
    return {
        gql: new GraphQLClient(token),
        sdk: new LinearSdkClient(token),
    };
}
export function createGraphQLClient(token) {
    return new GraphQLClient(token);
}
