import assert from "node:assert/strict";
import { taskCardStyles } from "../src/components/tasks/task-card/task-card.styles";

assert.match(taskCardStyles.root, /\bmin-w-0\b/);
assert.match(taskCardStyles.root, /\bmax-w-full\b/);
assert.match(taskCardStyles.descriptionPreview, /\bmin-w-0\b/);
assert.match(taskCardStyles.descriptionPreview, /\btruncate\b/);
assert.match(taskCardStyles.descriptionInFooter, /\bmin-w-0\b/);
assert.match(taskCardStyles.descriptionInFooter, /\btruncate\b/);
assert.doesNotMatch(
  taskCardStyles.descriptionInFooter,
  /\bflex-1\b/,
  "footer description is block in footerSlot; flex-1 is a no-op",
);
assert.match(taskCardStyles.titleButton, /\bmin-w-0\b/);

console.log("check-task-card-truncate: ok");
