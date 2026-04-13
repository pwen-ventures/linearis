import { CreateProjectMilestoneDocument, GetProjectMilestoneByIdDocument, ListProjectMilestonesDocument, UpdateProjectMilestoneDocument, } from "../gql/graphql.js";
export async function listMilestones(client, projectId, options = {}) {
    const { limit = 50, after } = options;
    const result = await client.request(ListProjectMilestonesDocument, { projectId, first: limit, after });
    return {
        nodes: result.project?.projectMilestones?.nodes ?? [],
        pageInfo: result.project?.projectMilestones?.pageInfo ?? {
            hasNextPage: false,
            endCursor: null,
        },
    };
}
export async function getMilestone(client, id, issuesLimit) {
    const result = await client.request(GetProjectMilestoneByIdDocument, { id, issuesFirst: issuesLimit });
    if (!result.projectMilestone) {
        throw new Error(`Milestone with ID "${id}" not found`);
    }
    return result.projectMilestone;
}
export async function createMilestone(client, input) {
    const result = await client.request(CreateProjectMilestoneDocument, { input });
    if (!result.projectMilestoneCreate.success ||
        !result.projectMilestoneCreate.projectMilestone) {
        throw new Error("Failed to create milestone");
    }
    return result.projectMilestoneCreate.projectMilestone;
}
export async function updateMilestone(client, id, input) {
    const result = await client.request(UpdateProjectMilestoneDocument, { id, input });
    if (!result.projectMilestoneUpdate.success ||
        !result.projectMilestoneUpdate.projectMilestone) {
        throw new Error("Failed to update milestone");
    }
    return result.projectMilestoneUpdate.projectMilestone;
}
