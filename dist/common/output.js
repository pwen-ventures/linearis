import * as fs from "node:fs";
import { AUTH_ERROR_CODE, AuthenticationError, invalidParameterError, } from "./errors.js";
function writeAllSync(fd, text) {
    const buffer = Buffer.from(`${text}\n`, "utf-8");
    let offset = 0;
    while (offset < buffer.length) {
        offset += fs.writeSync(fd, buffer, offset, buffer.length - offset);
    }
}
export function outputSuccess(data) {
    writeAllSync(1, JSON.stringify(data, null, 2));
    process.exit(0);
}
export function outputError(error) {
    writeAllSync(2, JSON.stringify({ error: error.message }, null, 2));
    process.exit(1);
}
export function outputAuthError(error) {
    writeAllSync(2, JSON.stringify({
        error: "AUTHENTICATION_REQUIRED",
        message: error.message,
        details: error.details,
        action: "USER_ACTION_REQUIRED",
        instruction: "Run 'linearis auth' to set up or refresh your authentication token.",
        exit_code: AUTH_ERROR_CODE,
    }, null, 2));
    process.exit(AUTH_ERROR_CODE);
}
export function parseLimit(value) {
    const limit = parseInt(value, 10);
    if (Number.isNaN(limit) || limit < 1) {
        throw invalidParameterError("--limit", "must be a positive integer");
    }
    return limit;
}
export function handleCommand(asyncFn) {
    return async (...args) => {
        try {
            await asyncFn(...args);
        }
        catch (error) {
            if (error instanceof AuthenticationError) {
                outputAuthError(error);
                return;
            }
            outputError(error instanceof Error ? error : new Error(String(error)));
        }
    };
}
