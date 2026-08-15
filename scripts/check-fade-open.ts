import assert from "node:assert/strict";
import { FADE_CLOSE_MS, FADE_OPEN_MS } from "../src/hooks/use-fade-open";
import { TOAST_DURATION_MS } from "../src/components/ui/toast/toast.styles";
import { taskCardStyles } from "../src/components/tasks/task-card/task-card.styles";

assert.equal(FADE_OPEN_MS, 200, "open must match duration-200");
assert.equal(FADE_CLOSE_MS, 300, "close must match duration-300");
assert.ok(FADE_CLOSE_MS > FADE_OPEN_MS, "close should outlast open so exit is noticeable");
assert.equal(TOAST_DURATION_MS, 3000);

assert.match(taskCardStyles.overlayOpen, new RegExp(`\\bduration-${FADE_OPEN_MS}\\b`));
assert.match(taskCardStyles.overlayFade, new RegExp(`\\bduration-${FADE_OPEN_MS}\\b`));
assert.match(taskCardStyles.overlayFaded, new RegExp(`\\bduration-${FADE_CLOSE_MS}\\b`));
assert.match(taskCardStyles.menuSegmentClosed, new RegExp(`\\bduration-${FADE_CLOSE_MS}\\b`));
assert.match(taskCardStyles.projectSegmentClosed, new RegExp(`\\bduration-${FADE_CLOSE_MS}\\b`));
assert.match(taskCardStyles.menuSegment, /\binset-y-0\b/);
assert.match(taskCardStyles.projectSegment, /\binset-y-0\b/);
assert.match(taskCardStyles.projectMenuItem, /\btext-xs\b/);
assert.match(taskCardStyles.acronymButton, /\btext-xs\b/);

console.log("check-fade-open: ok");
