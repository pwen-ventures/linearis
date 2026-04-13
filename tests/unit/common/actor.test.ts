import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyActorOverrides,
  getActorOverridesFromEnv,
} from "../../../src/common/actor.js";

describe("getActorOverridesFromEnv", () => {
  it("returns empty object when env vars are unset", () => {
    expect(getActorOverridesFromEnv({})).toEqual({});
  });

  it("reads both env vars when set", () => {
    expect(
      getActorOverridesFromEnv({
        LINEAR_CREATE_AS_USER: "Mark",
        LINEAR_DISPLAY_ICON_URL: "http://path.to/image.png",
      }),
    ).toEqual({
      createAsUser: "Mark",
      displayIconUrl: "http://path.to/image.png",
    });
  });

  it("ignores empty/whitespace-only values", () => {
    expect(
      getActorOverridesFromEnv({
        LINEAR_CREATE_AS_USER: "  ",
        LINEAR_DISPLAY_ICON_URL: "",
      }),
    ).toEqual({});
  });

  it("trims surrounding whitespace", () => {
    expect(
      getActorOverridesFromEnv({
        LINEAR_CREATE_AS_USER: "  Mark  ",
      }),
    ).toEqual({ createAsUser: "Mark" });
  });
});

describe("applyActorOverrides", () => {
  const originalUser = process.env.LINEAR_CREATE_AS_USER;
  const originalIcon = process.env.LINEAR_DISPLAY_ICON_URL;

  beforeEach(() => {
    delete process.env.LINEAR_CREATE_AS_USER;
    delete process.env.LINEAR_DISPLAY_ICON_URL;
  });

  afterEach(() => {
    if (originalUser === undefined) {
      delete process.env.LINEAR_CREATE_AS_USER;
    } else {
      process.env.LINEAR_CREATE_AS_USER = originalUser;
    }
    if (originalIcon === undefined) {
      delete process.env.LINEAR_DISPLAY_ICON_URL;
    } else {
      process.env.LINEAR_DISPLAY_ICON_URL = originalIcon;
    }
  });

  it("returns input unchanged when env vars absent", () => {
    const input = { title: "T", teamId: "team-1" };
    expect(applyActorOverrides(input)).toEqual(input);
  });

  it("merges env-derived actor fields into input", () => {
    process.env.LINEAR_CREATE_AS_USER = "Mark";
    process.env.LINEAR_DISPLAY_ICON_URL = "http://path.to/image.png";
    expect(applyActorOverrides({ title: "T", teamId: "team-1" })).toEqual({
      title: "T",
      teamId: "team-1",
      createAsUser: "Mark",
      displayIconUrl: "http://path.to/image.png",
    });
  });

  it("explicit input overrides env values", () => {
    process.env.LINEAR_CREATE_AS_USER = "Mark";
    expect(
      applyActorOverrides({
        title: "T",
        createAsUser: "Explicit",
      }),
    ).toEqual({
      title: "T",
      createAsUser: "Explicit",
    });
  });
});
