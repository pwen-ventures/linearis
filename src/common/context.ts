import { GraphQLClient } from "../client/graphql-client.js";
import { LinearSdkClient } from "../client/linear-client.js";
import type { ActorOverrides } from "./actor.js";
import { getActorOverridesFromEnv } from "./actor.js";
import {
  type CommandOptions,
  profileActorOverrides,
  resolveApiToken,
} from "./auth.js";

export type { CommandOptions };

export interface CommandContext {
  gql: GraphQLClient;
  sdk: LinearSdkClient;
  actorOverrides: ActorOverrides;
}

export function createContext(options: CommandOptions): CommandContext {
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

export function createGraphQLClient(token: string): GraphQLClient {
  return new GraphQLClient(token);
}
