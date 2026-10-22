import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appOrigin,
  buildRequestBody,
  createTask,
} from "./create-task.js";

describe("create-task", () => {
  it("normalizes origin", () => {
    assert.equal(appOrigin(undefined), "https://app.sirrelay.com");
    assert.equal(appOrigin("https://example.com/"), "https://example.com");
  });

  it("builds the shared bearer POST body", () => {
    assert.deepEqual(
      buildRequestBody({
        title: "  Ship MCP  ",
        dueDate: "2026-10-23",
        projectId: "p1",
        groupId: "g1",
      }),
      {
        title: "Ship MCP",
        dueDate: "2026-10-23",
        projectId: "p1",
        groupId: "g1",
      },
    );
  });

  it("posts Bearer JSON and maps success", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const result = await createTask(
      "https://app.example",
      "tok",
      { title: "Hello", groupId: "g" },
      async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify({ ok: true, away: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      "1.2.3",
    );
    assert.equal(result.ok, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://app.example/api/v1/client/tasks");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer tok");
    assert.equal(headers["X-SirRelay-Client"], "mcp/1.2.3");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(JSON.parse(String(calls[0].init.body)).title, "Hello");
  });

  it("maps unauthorized", async () => {
    const result = await createTask(
      "https://app.example",
      "bad",
      { title: "X" },
      async () =>
        new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.error, "unauthorized");
    }
  });

  it("maps upgrade_required", async () => {
    const result = await createTask(
      "https://app.example",
      "tok",
      { title: "X" },
      async () =>
        new Response(
          JSON.stringify({
            error: "upgrade_required",
            message: "Please update",
          }),
          { status: 410 },
        ),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 410);
      assert.equal(result.error, "Please update");
    }
  });
});
