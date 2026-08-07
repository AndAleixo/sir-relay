import assert from "node:assert/strict";
import {
  MY_WORK_MOBILE_CHROME,
  kanbanStyles,
} from "../src/components/tasks/status-kanban/status-kanban.styles";

assert.equal(MY_WORK_MOBILE_CHROME, "13rem");
assert.match(
  kanbanStyles.grid,
  new RegExp(
    `max-md:h-\\[calc\\(100dvh-${MY_WORK_MOBILE_CHROME}\\)\\]`,
  ),
  "mobile kanban must fill viewport below chrome",
);
assert.match(kanbanStyles.grid, /max-md:grid-rows-3/);
assert.match(kanbanStyles.column, /min-h-0/);
assert.match(kanbanStyles.cardList, /flex-1/);
assert.match(kanbanStyles.cardList, /overflow-y-auto/);

console.log("check-my-work-mobile-kanban: ok");
