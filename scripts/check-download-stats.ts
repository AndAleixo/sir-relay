import assert from "node:assert/strict";
import { formatDownloadFloor } from "../src/lib/download-stats";

assert.equal(formatDownloadFloor(99, "en-GB"), null);
assert.equal(formatDownloadFloor(100, "en-GB"), "100+");
assert.equal(formatDownloadFloor(1276, "en-GB"), "1,200+");
assert.equal(formatDownloadFloor(1276, "pt-BR"), "1.200+");
assert.equal(formatDownloadFloor(832, "en-GB"), "800+");
assert.equal(formatDownloadFloor(0, "en-GB"), null);

console.log("check-download-stats: ok");
