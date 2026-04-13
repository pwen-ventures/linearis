import { notFoundError } from "../common/errors.js";
import { isUuid, parseIssueIdentifier } from "../common/identifier.js";
export async function resolveIssueId(client, issueIdOrIdentifier) {
    if (isUuid(issueIdOrIdentifier))
        return issueIdOrIdentifier;
    const { teamKey, issueNumber } = parseIssueIdentifier(issueIdOrIdentifier);
    const issues = await client.sdk.issues({
        filter: {
            number: { eq: issueNumber },
            team: { key: { eq: teamKey } },
        },
        first: 1,
    });
    if (issues.nodes.length === 0) {
        throw notFoundError("Issue", issueIdOrIdentifier);
    }
    return issues.nodes[0].id;
}
