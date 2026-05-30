// tests/unit/common/output.test.ts
import * as fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "../../../src/common/errors.js";
import {
  handleCommand,
  outputAuthError,
  outputError,
  outputSuccess,
  parseLimit,
} from "../../../src/common/output.js";
import { fdOutput } from "../helpers/output-capture.js";

// outputSuccess/outputError write straight to fd 1/2 via fs.writeSync — mock it
// so the bytes are captured instead of hitting the real descriptors.
vi.mock("node:fs", () => {
  const writeSync = vi.fn(
    (_fd: number, buf: Buffer, _offset?: number, length?: number) =>
      length ?? buf.length,
  );
  return { writeSync, default: { writeSync } };
});

const writeSync = vi.mocked(fs.writeSync);

describe("outputSuccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes JSON to stdout and exits with code 0", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    outputSuccess({ id: "123", title: "Test" });

    expect(fdOutput(writeSync, 1)).toContain(
      JSON.stringify({ id: "123", title: "Test" }, null, 2),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });
});

describe("outputError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes error JSON to stderr and exits", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    outputError(new Error("something failed"));

    expect(fdOutput(writeSync, 2)).toContain(
      JSON.stringify({ error: "something failed" }, null, 2),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});

describe("handleCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the wrapped function", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = handleCommand(fn);
    await wrapped("arg1", "arg2");
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("catches errors and outputs them", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const wrapped = handleCommand(fn);
    await wrapped();

    expect(fdOutput(writeSync, 2)).toContain(
      JSON.stringify({ error: "boom" }, null, 2),
    );

    exitSpy.mockRestore();
  });
});

describe("handleCommand with AuthenticationError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls outputAuthError for AuthenticationError", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    const handler = handleCommand(async () => {
      throw new AuthenticationError("expired");
    });

    await handler();

    const output = JSON.parse(fdOutput(writeSync, 2));
    expect(output.error).toBe("AUTHENTICATION_REQUIRED");
    expect(exitSpy).toHaveBeenCalledWith(42);

    exitSpy.mockRestore();
  });
});

describe("parseLimit", () => {
  it("parses valid integer string", () => {
    expect(parseLimit("50")).toBe(50);
  });

  it("parses single digit", () => {
    expect(parseLimit("1")).toBe(1);
  });

  it("throws on non-numeric string", () => {
    expect(() => parseLimit("foo")).toThrow();
  });

  it("throws on zero", () => {
    expect(() => parseLimit("0")).toThrow();
  });

  it("throws on negative number", () => {
    expect(() => parseLimit("-1")).toThrow();
  });
});

describe("outputAuthError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("outputs structured JSON with AUTHENTICATION_REQUIRED", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    const err = new AuthenticationError("Token expired");
    outputAuthError(err);

    const output = JSON.parse(fdOutput(writeSync, 2));
    expect(output.error).toBe("AUTHENTICATION_REQUIRED");
    expect(output.message).toBe("Linear API authentication failed.");
    expect(output.details).toBe("Token expired");
    expect(output.action).toBe("USER_ACTION_REQUIRED");
    expect(output.instruction).toContain("linearis auth");
    expect(output.exit_code).toBe(42);
    expect(exitSpy).toHaveBeenCalledWith(42);

    exitSpy.mockRestore();
  });
});
