import { CreateProjectDocument, GetProjectDocument, GetProjectsDocument, UpdateProjectDocument, } from "../gql/graphql.js";
export async function listProjects(client, options = {}) {
    const { limit = 50, after } = options;
    const result = await client.request(GetProjectsDocument, {
        first: limit,
        after,
    });
    return {
        nodes: result.projects.nodes,
        pageInfo: result.projects.pageInfo,
    };
}
export async function getProject(client, id) {
    const result = await client.request(GetProjectDocument, {
        id,
    });
    if (!result.project) {
        throw new Error(`Project with ID "${id}" not found`);
    }
    return result.project;
}
export async function createProject(client, input) {
    const result = await client.request(CreateProjectDocument, { input });
    if (!result.projectCreate.success || !result.projectCreate.project) {
        throw new Error(`Failed to create project "${input.name}"`);
    }
    return result.projectCreate.project;
}
export async function updateProject(client, id, input) {
    const result = await client.request(UpdateProjectDocument, { id, input });
    if (!result.projectUpdate.success || !result.projectUpdate.project) {
        throw new Error(`Failed to update project "${id}"`);
    }
    return result.projectUpdate.project;
}
