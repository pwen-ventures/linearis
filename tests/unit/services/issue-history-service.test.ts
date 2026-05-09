import { describe, expect, it, vi } from "vitest";
import type { GraphQLClient } from "../../../src/client/graphql-client.js";
import {
  getIssueDescriptionHistory,
  getIssueDescriptionHistoryEntry,
  getIssueHistory,
} from "../../../src/services/issue-history-service.js";

function mockGqlClient(response: Record<string, unknown>): GraphQLClient {
  return {
    request: vi.fn().mockResolvedValue(response),
  } as unknown as GraphQLClient;
}

describe("getIssueHistory", () => {
  it("returns paginated history nodes", async () => {
    const node = {
      id: "hist-1",
      createdAt: "2026-01-01T00:00:00Z",
      toState: { id: "state-2", name: "In Progress", type: "started" },
    };
    const client = mockGqlClient({
      issue: {
        id: "issue-1",
        history: {
          nodes: [node],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });

    const result = await getIssueHistory(client, "issue-1", { limit: 10 });

    expect(result.nodes).toEqual([node]);
    expect(result.pageInfo).toEqual({ hasNextPage: false, endCursor: null });
    expect(client.request).toHaveBeenCalledOnce();
    expect(client.request).toHaveBeenCalledWith(expect.anything(), {
      id: "issue-1",
      first: 10,
      after: undefined,
    });
  });

  it("throws when the issue is not found", async () => {
    const client = mockGqlClient({ issue: null });

    await expect(getIssueHistory(client, "missing")).rejects.toThrow(
      'Issue with ID "missing" not found',
    );
  });
});

describe("getIssueDescriptionHistory", () => {
  it("returns the history array on success", async () => {
    const entry = {
      id: "ver-1",
      createdAt: "2026-01-01T00:00:00Z",
      contentDataSnapshotAt: "2026-01-01T00:00:00Z",
      actorIds: ["user-1"],
      contentData: { type: "doc" },
      metadata: null,
    };
    const client = mockGqlClient({
      documentContentHistory: { success: true, history: [entry] },
    });

    const result = await getIssueDescriptionHistory(client, "issue-1");

    expect(result.history).toEqual([entry]);
  });

  it("throws when the payload reports failure", async () => {
    const client = mockGqlClient({
      documentContentHistory: { success: false, history: [] },
    });

    await expect(getIssueDescriptionHistory(client, "issue-1")).rejects.toThrow(
      "Failed to fetch description history",
    );
  });
});

describe("getIssueDescriptionHistoryEntry", () => {
  it("returns the matching entry by id", async () => {
    const entry = {
      id: "ver-2",
      createdAt: "2026-01-02T00:00:00Z",
      contentDataSnapshotAt: "2026-01-02T00:00:00Z",
      actorIds: null,
      contentData: { type: "doc", content: [] },
      metadata: null,
    };
    const client = mockGqlClient({
      documentContentHistory: {
        success: true,
        history: [{ id: "ver-1" }, entry],
      },
    });

    const result = await getIssueDescriptionHistoryEntry(
      client,
      "issue-1",
      "ver-2",
    );

    expect(result).toEqual(entry);
  });

  it("throws when no entry matches the version id", async () => {
    const client = mockGqlClient({
      documentContentHistory: {
        success: true,
        history: [{ id: "ver-1" }],
      },
    });

    await expect(
      getIssueDescriptionHistoryEntry(client, "issue-1", "missing"),
    ).rejects.toThrow(
      'Description history entry "missing" not found for issue "issue-1"',
    );
  });
});
