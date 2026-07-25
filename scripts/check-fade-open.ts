import assert from "node:assert/strict";
import { FADE_CLOSE_MS, FADE_OPEN_MS } from "../src/hooks/use-fade-open";

assert.equal(FADE_OPEN_MS, 200, "open must match duration-200");
assert.equal(FADE_CLOSE_MS, 300, "close must match duration-300");
assert.ok(FADE_CLOSE_MS > FADE_OPEN_MS, "close should outlast open so exit is noticeable");

console.log("check-fade-open: ok");
