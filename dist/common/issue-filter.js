import { invalidParameterError, requiresParameterError } from "./errors.js";
import { isUuid } from "./identifier.js";
export function validatePriority(value) {
    if (!Number.isInteger(value) || value < 0 || value > 4) {
        throw invalidParameterError("priority", "must be an integer between 0 and 4");
    }
}
export function validateEstimate(value) {
    if (!Number.isInteger(value) || value < 0) {
        throw invalidParameterError("estimate", "must be a non-negative integer");
    }
}
export function validateDateRange(after, before, label) {
    if (after && before && after >= before) {
        throw invalidParameterError(label, `range is contradictory: after (${after}) must be before (${before})`);
    }
}
export function validateFilterDependencies(flags) {
    if (flags.status && !isUuid(flags.status) && !flags.team) {
        throw requiresParameterError("--status", "--team");
    }
    if (flags.cycle && !isUuid(flags.cycle) && !flags.team) {
        throw requiresParameterError("--cycle", "--team");
    }
    if (flags.milestone && !isUuid(flags.milestone) && !flags.project) {
        throw requiresParameterError("--milestone", "--project");
    }
}
export function parseCommaSeparated(value) {
    const parts = value.split(",").map((s) => s.trim());
    for (const part of parts) {
        if (part === "") {
            throw invalidParameterError("comma-separated list", "contains empty segments");
        }
    }
    return parts;
}
