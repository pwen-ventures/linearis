import { describe, expect, it, vi } from "vitest";
import type { GraphQLClient } from "../../../src/client/graphql-client.js";
import {
  listIssueSubscribers,
  subscribeIssue,
  unsubscribeIssue,
} from "../../../src/services/subscriber-service.js";

function mockGqlClient(response: Record<string, unknown>): GraphQLClient {
  return {
    request: vi.fn().mockResolvedValue(response),
  } as unknown as GraphQLClient;
}

const issuePayload = {
  id: "issue-1",
  identifier: "ENG-1",
  subscribers: {
    nodes: [
      {
        id: "user-1",
        name: "Alice",
        displayName: "alice",
        email: "alice@example.com",
      },
    ],
  },
};

describe("listIssueSubscribers", () => {
  it("returns subscribers for an issue", async () => {
    const client = mockGqlClient({ issue: issuePayload });
    const result = await listIssueSubscribers(client, "issue-1");
    expect(result).toEqual(issuePayload);
    expect(client.request).toHaveBeenCalledOnce();
  });

  it("throws when the issue is not found", async () => {
    const client = mockGqlClient({ issue: null });
    await expect(listIssueSubscribers(client, "issue-1")).rejects.toThrow(
      /Issue/,
    );
  });
});

describe("subscribeIssue", () => {
  it("subscribes a user and returns the issue", async () => {
    const client = mockGqlClient({
      issueSubscribe: { success: true, issue: issuePayload },
    });
    const result = await subscribeIssue(client, "issue-1", {
      userId: "user-1",
    });
    expect(result).toEqual(issuePayload);
    expect(client.request).toHaveBeenCalledWith(expect.anything(), {
      id: "issue-1",
      userId: "user-1",
      userEmail: undefined,
    });
  });

  it("defaults to viewer when no user is specified", async () => {
    const client = mockGqlClient({
      issueSubscribe: { success: true, issue: issuePayload },
    });
    await subscribeIssue(client, "issue-1", {});
    expect(client.request).toHaveBeenCalledWith(expect.anything(), {
      id: "issue-1",
      userId: undefined,
      userEmail: undefined,
    });
  });

  it("throws when subscription fails", async () => {
    const client = mockGqlClient({
      issueSubscribe: { success: false, issue: null },
    });
    await expect(subscribeIssue(client, "issue-1", {})).rejects.toThrow(
      "Failed to subscribe to issue",
    );
  });
});

describe("unsubscribeIssue", () => {
  it("unsubscribes a user and returns the issue", async () => {
    const client = mockGqlClient({
      issueUnsubscribe: { success: true, issue: issuePayload },
    });
    const result = await unsubscribeIssue(client, "issue-1", {
      userId: "user-1",
    });
    expect(result).toEqual(issuePayload);
  });

  it("throws when unsubscription fails", async () => {
    const client = mockGqlClient({
      issueUnsubscribe: { success: false, issue: null },
    });
    await expect(unsubscribeIssue(client, "issue-1", {})).rejects.toThrow(
      "Failed to unsubscribe from issue",
    );
  });
});
