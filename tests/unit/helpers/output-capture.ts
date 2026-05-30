import type { MockInstance } from "vitest";

// `outputSuccess` / `outputError` deliberately bypass `console` and write
// straight to file descriptors 1/2 via `fs.writeSync` (see src/common/output.ts
// for why — pipe-truncation avoidance). Tests that assert on that output must
// therefore mock `node:fs` and decode the captured buffers rather than spying
// on `console.log` / `console.error`.
//
// Pair this helper with a `node:fs` mock whose `writeSync` records its calls:
//
//   vi.mock("node:fs", async (importOriginal) => {
//     const actual = await importOriginal<typeof import("node:fs")>();
//     const writeSync = vi.fn(
//       (_fd: number, buf: Buffer, _offset?: number, length?: number) =>
//         length ?? buf.length,
//     );
//     return { ...actual, default: { ...actual, writeSync }, writeSync };
//   });

type WriteSyncCall = [fd: number, buffer: Buffer, ...rest: unknown[]];

/** Concatenated text the mocked `fs.writeSync` wrote to the given descriptor. */
export function fdOutput(writeSync: MockInstance, fd: 1 | 2): string {
  return (writeSync.mock.calls as WriteSyncCall[])
    .filter((call) => call[0] === fd)
    .map((call) => call[1].toString())
    .join("");
}
