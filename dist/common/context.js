import { GraphQLClient } from "../client/graphql-client.js";
import { LinearSdkClient } from "../client/linear-client.js";
import { getActorOverridesFromEnv } from "./actor.js";
import { profileActorOverrides, resolveApiToken, } from "./auth.js";
export function createContext(options) {
    const resolved = resolveApiToken(options);
    const actorOverrides = resolved.profile
        ? profileActorOverrides(resolved.profile)
        : getActorOverridesFromEnv();
    return {
        gql: new GraphQLClient(resolved.token),
        sdk: new LinearSdkClient(resolved.token),
        actorOverrides,
    };
}
export function createGraphQLClient(token) {
    return new GraphQLClient(token);
}
