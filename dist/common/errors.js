export function notFoundError(entityType, identifier, context) {
    const contextStr = context ? ` ${context}` : "";
    return new Error(`${entityType} "${identifier}"${contextStr} not found`);
}
export function multipleMatchesError(entityType, identifier, matches, disambiguation) {
    const matchList = matches.join(", ");
    return new Error(`Multiple ${entityType}s found matching "${identifier}". ` +
        `Candidates: ${matchList}. ` +
        `Please ${disambiguation}.`);
}
export function invalidParameterError(parameter, reason) {
    return new Error(`Invalid ${parameter}: ${reason}`);
}
export function requiresParameterError(flag, requiredFlag) {
    return new Error(`${flag} requires ${requiredFlag} to be specified`);
}
export const AUTH_ERROR_CODE = 42;
export class AuthenticationError extends Error {
    details;
    constructor(details) {
        super("Linear API authentication failed.");
        this.name = "AuthenticationError";
        this.details = details ?? "Your stored token is invalid or expired.";
    }
}
const AUTH_ERROR_PATTERNS = [
    "authentication required",
    "unauthorized",
];
export function isAuthError(error) {
    if (error instanceof AuthenticationError)
        return true;
    if (error instanceof Error) {
        const msg = error.message.toLowerCase().trim();
        return AUTH_ERROR_PATTERNS.some((pattern) => msg === pattern);
    }
    return false;
}
