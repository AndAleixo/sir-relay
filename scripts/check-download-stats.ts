import assert from "node:assert/strict";
import { formatDownloadFloor } from "../src/lib/download-stats";

assert.equal(formatDownloadFloor(99, "en-gb"), null);
assert.equal(formatDownloadFloor(100, "en-gb"), "100+");
assert.equal(formatDownloadFloor(1276, "en-gb"), "1,200+");
assert.equal(formatDownloadFloor(1276, "pt-br"), "1.200+");
assert.equal(formatDownloadFloor(1276, "es-es"), "1.200+");
assert.equal(formatDownloadFloor(832, "en-gb"), "800+");
assert.equal(formatDownloadFloor(0, "en-gb"), null);

console.log("check-download-stats: ok");
