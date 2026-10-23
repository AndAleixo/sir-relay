import assert from "node:assert/strict";
import { safeConnectNext, editorUriScheme, withConnectNext } from "../src/lib/connect-next";

assert.equal(
  safeConnectNext("pt-br", "/pt-br/connect?scheme=cursor"),
  "/pt-br/connect?scheme=cursor",
);
assert.equal(safeConnectNext("pt-br", "/pt-br/tasks"), null);
assert.equal(safeConnectNext("pt-br", "https://evil.test/pt-br/connect"), null);
assert.equal(safeConnectNext("en-gb", "/pt-br/connect"), null);
assert.equal(safeConnectNext("pt-br", "/pt-br/connect?scheme=javascript"), null);
assert.equal(safeConnectNext("pt-br", "/pt-br/vscode/connect?scheme=cursor"), null);
assert.equal(editorUriScheme("cursor"), "cursor");
assert.equal(editorUriScheme("antigravity"), "antigravity");
assert.equal(
  safeConnectNext("pt-br", "/pt-br/connect?scheme=antigravity"),
  "/pt-br/connect?scheme=antigravity",
);
assert.equal(editorUriScheme("nope"), "vscode");
assert.equal(
  withConnectNext("/en-gb/login", "/en-gb/connect?scheme=cursor"),
  "/en-gb/login?next=%2Fen-gb%2Fconnect%3Fscheme%3Dcursor",
);
assert.equal(withConnectNext("/en-gb/signup", "/en-gb/tasks"), "/en-gb/signup");
assert.equal(withConnectNext("/en-gb/login", null), "/en-gb/login");

console.log("check-connect-next: ok");
