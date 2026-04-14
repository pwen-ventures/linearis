import { describe, expect, it } from "vitest";
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
  it("returns input unchanged when overrides are empty", () => {
    const input = { title: "T", teamId: "team-1" };
    expect(applyActorOverrides(input, {})).toEqual(input);
  });

  it("merges provided overrides into input", () => {
    expect(
      applyActorOverrides(
        { title: "T", teamId: "team-1" },
        {
          createAsUser: "Mark",
          displayIconUrl: "http://path.to/image.png",
        },
      ),
    ).toEqual({
      title: "T",
      teamId: "team-1",
      createAsUser: "Mark",
      displayIconUrl: "http://path.to/image.png",
    });
  });

  it("explicit input overrides values from overrides arg", () => {
    expect(
      applyActorOverrides(
        { title: "T", createAsUser: "Explicit" },
        { createAsUser: "Mark" },
      ),
    ).toEqual({
      title: "T",
      createAsUser: "Explicit",
    });
  });
});
