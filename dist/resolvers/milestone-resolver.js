import { multipleMatchesError, notFoundError } from "../common/errors.js";
import { isUuid } from "../common/identifier.js";
import { FindProjectMilestoneGlobalDocument, FindProjectMilestoneScopedDocument, } from "../gql/graphql.js";
import { resolveProjectId } from "./project-resolver.js";
export async function resolveMilestoneId(gqlClient, sdkClient, nameOrId, projectNameOrId) {
    if (isUuid(nameOrId))
        return nameOrId;
    let nodes = [];
    if (projectNameOrId) {
        const projectId = await resolveProjectId(sdkClient, projectNameOrId);
        const result = await gqlClient.request(FindProjectMilestoneScopedDocument, { name: nameOrId, projectId });
        nodes = result.project?.projectMilestones?.nodes || [];
    }
    if (nodes.length === 0) {
        const globalResult = await gqlClient.request(FindProjectMilestoneGlobalDocument, { name: nameOrId });
        nodes = globalResult.projectMilestones?.nodes || [];
    }
    if (nodes.length === 0) {
        throw notFoundError("Milestone", nameOrId);
    }
    if (nodes.length > 1) {
        const matches = nodes.map((m) => `"${m.name}" in project "${m.project?.name}"`);
        throw multipleMatchesError("milestone", nameOrId, matches, "specify --project or use the milestone ID");
    }
    return nodes[0].id;
}
