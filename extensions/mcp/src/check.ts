import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appOrigin,
  assertSafeId,
  buildCreateBody,
  createTask,
  deleteTask,
  listBoard,
  updateTask,
} from "./client-api.js";

describe("client-api", () => {
  it("normalizes origin", () => {
    assert.equal(appOrigin(undefined), "https://app.sirrelay.com");
    assert.equal(appOrigin("https://example.com/"), "https://example.com");
  });

  it("rejects unsafe ids", () => {
    assert.throws(() => assertSafeId("../x", "taskId"));
    assert.throws(() => assertSafeId("a/b", "taskId"));
    assert.equal(assertSafeId("task-abc_1", "taskId"), "task-abc_1");
  });

  it("builds create body", () => {
    assert.deepEqual(
      buildCreateBody({
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

  it("create posts Bearer JSON", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const result = await createTask(
      "https://app.example",
      "tok",
      { title: "Hello", groupId: "g1" },
      "1.2.3",
      async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify({ ok: true, id: "task-1", away: false }), {
          status: 200,
        });
      },
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.id, "task-1");
    assert.equal(calls[0].url, "https://app.example/api/v1/client/tasks");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer tok");
    assert.equal(headers["X-SirRelay-Client"], "mcp/1.2.3");
  });

  it("create with doing issues status patch", async () => {
    const ops: string[] = [];
    const result = await createTask(
      "https://app.example",
      "tok",
      { title: "Go", status: "doing" },
      "1.0.0",
      async (url, init) => {
        ops.push(`${init?.method ?? "GET"} ${url}`);
        if (String(url).endsWith("/tasks")) {
          return new Response(JSON.stringify({ ok: true, id: "task-9", away: false }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    );
    assert.equal(result.ok, true);
    assert.equal(ops.length, 2);
    assert.match(ops[1], /PATCH .*\/tasks\/task-9/);
  });

  it("list_board maps payload", async () => {
    const result = await listBoard(
      "https://app.example",
      "tok",
      undefined,
      "1.0.0",
      async () =>
        new Response(
          JSON.stringify({
            userId: "u1",
            groupId: "g1",
            groupName: "Casa",
            groups: [{ id: "g1", name: "Casa" }],
            projects: [],
            tasks: [{ id: "task-1", title: "A", status: "todo" }],
          }),
          { status: 200 },
        ),
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.board.groupName, "Casa");
      assert.equal(result.board.tasks[0].title, "A");
    }
  });

  it("update_task patches status", async () => {
    const result = await updateTask(
      "https://app.example",
      "tok",
      { taskId: "task-1", status: "done" },
      "1.0.0",
      async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.op, "status");
        assert.equal(body.status, "done");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    );
    assert.equal(result.ok, true);
  });

  it("delete_task requires confirm", async () => {
    const denied = await deleteTask(
      "https://app.example",
      "tok",
      { taskId: "task-1", confirm: false as unknown as true },
      "1.0.0",
    );
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.error, "confirm_required");
  });

  it("maps upgrade_required", async () => {
    const result = await createTask(
      "https://app.example",
      "tok",
      { title: "X" },
      "1.0.0",
      async () =>
        new Response(
          JSON.stringify({ error: "upgrade_required", message: "Please update" }),
          { status: 410 },
        ),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "Please update");
  });
});
