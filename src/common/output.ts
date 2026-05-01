import * as fs from "node:fs";
import {
  AUTH_ERROR_CODE,
  AuthenticationError,
  invalidParameterError,
} from "./errors.js";

// Write synchronously to an stdio file descriptor, looping over partial
// writes if the kernel pipe buffer fills before everything is accepted.
//
// Why not console.log / process.stdout.write?
//   When stdout is a pipe (the common case for CLI consumers piping to other
//   processes), Node uses non-blocking writes on stdout. Calling
//   `console.log(big); process.exit(0);` truncates the output at ~8KB
//   because the unflushed bytes are still queued inside libuv when the
//   process terminates. Stream-level `drain` doesn't help: Node's stdout
//   HWM is 16KB, so writes under that size never trigger drain even though
//   they aren't yet in the kernel buffer.
//
//   `fs.writeSync(fd, ...)` bypasses Node's stream layer and goes straight
//   to the `write(2)` syscall, returning the number of bytes the kernel
//   accepted. Wrapping it in a loop lets us reliably push payloads larger
//   than the pipe buffer through.
function writeAllSync(fd: number, text: string): void {
  const buffer = Buffer.from(`${text}\n`, "utf-8");
  let offset = 0;
  while (offset < buffer.length) {
    offset += fs.writeSync(fd, buffer, offset, buffer.length - offset);
  }
}

export function outputSuccess(data: unknown): void {
  writeAllSync(1, JSON.stringify(data, null, 2));
  process.exit(0);
}

export function outputError(error: Error): void {
  writeAllSync(2, JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
}

export function outputAuthError(error: AuthenticationError): void {
  writeAllSync(
    2,
    JSON.stringify(
      {
        error: "AUTHENTICATION_REQUIRED",
        message: error.message,
        details: error.details,
        action: "USER_ACTION_REQUIRED",
        instruction:
          "Run 'linearis auth' to set up or refresh your authentication token.",
        exit_code: AUTH_ERROR_CODE,
      },
      null,
      2,
    ),
  );
  process.exit(AUTH_ERROR_CODE);
}

export function parseLimit(value: string): number {
  const limit = parseInt(value, 10);
  if (Number.isNaN(limit) || limit < 1) {
    throw invalidParameterError("--limit", "must be a positive integer");
  }
  return limit;
}

export function handleCommand(
  asyncFn: (...args: unknown[]) => Promise<void>,
): (...args: unknown[]) => Promise<void> {
  return async (...args: unknown[]) => {
    try {
      await asyncFn(...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        outputAuthError(error);
        return;
      }
      outputError(error instanceof Error ? error : new Error(String(error)));
    }
  };
}
