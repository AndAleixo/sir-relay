import assert from "node:assert/strict";
import { safeVsCodeNext, vsCodeScheme, withVsCodeNext } from "../src/lib/vscode-next";

assert.equal(
  safeVsCodeNext("pt-br", "/pt-br/vscode/connect?scheme=cursor"),
  "/pt-br/vscode/connect?scheme=cursor",
);
assert.equal(safeVsCodeNext("pt-br", "/pt-br/tasks"), null);
assert.equal(safeVsCodeNext("pt-br", "https://evil.test/pt-br/vscode/connect"), null);
assert.equal(safeVsCodeNext("en-gb", "/pt-br/vscode/connect"), null);
assert.equal(safeVsCodeNext("pt-br", "/pt-br/vscode/connect?scheme=javascript"), null);
assert.equal(vsCodeScheme("cursor"), "cursor");
assert.equal(vsCodeScheme("nope"), "vscode");
assert.equal(
  withVsCodeNext("/en-gb/login", "/en-gb/vscode/connect?scheme=cursor"),
  "/en-gb/login?next=%2Fen-gb%2Fvscode%2Fconnect%3Fscheme%3Dcursor",
);
assert.equal(withVsCodeNext("/en-gb/signup", "/en-gb/tasks"), "/en-gb/signup");
assert.equal(withVsCodeNext("/en-gb/login", null), "/en-gb/login");

console.log("check-vscode-next: ok");
