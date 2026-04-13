const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value) {
    return UUID_REGEX.test(value);
}
export function parseIssueIdentifier(identifier) {
    const parts = identifier.split("-");
    if (parts.length !== 2) {
        throw new Error(`Invalid issue identifier format: "${identifier}". Expected format: TEAM-123`);
    }
    const teamKey = parts[0];
    const issueNumber = parseInt(parts[1], 10);
    if (Number.isNaN(issueNumber)) {
        throw new Error(`Invalid issue number in identifier: "${identifier}"`);
    }
    return { teamKey, issueNumber };
}
export function tryParseIssueIdentifier(identifier) {
    try {
        return parseIssueIdentifier(identifier);
    }
    catch {
        return null;
    }
}
const DUE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export function parseDueDate(value) {
    if (!DUE_DATE_REGEX.test(value)) {
        throw new Error(`Invalid due date format: "${value}". Expected format: YYYY-MM-DD`);
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
        throw new Error(`Invalid due date: "${value}". The date does not exist.`);
    }
    return value;
}
