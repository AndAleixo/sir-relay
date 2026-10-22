import assert from "node:assert/strict";
import { taskMatchesProject } from "../extensions/vscode/src/project-filter";

assert.equal(taskMatchesProject({ projectId: "p1" }, ""), true);
assert.equal(taskMatchesProject({ projectId: null }, ""), true);
assert.equal(taskMatchesProject({ projectId: "p1" }, "p1"), true);
assert.equal(taskMatchesProject({ projectId: "p2" }, "p1"), false);
assert.equal(taskMatchesProject({ projectId: null }, "p1"), false);

console.log("check-vscode-project-filter: ok");
