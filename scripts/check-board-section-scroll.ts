import assert from "node:assert/strict";
import {
  BOARD_SECTION_CARD_SLOT_PX,
  BOARD_SECTION_SCROLL_AFTER_DESKTOP,
  BOARD_SECTION_SCROLL_AFTER_MOBILE,
  sectionListNeedsScroll,
} from "../src/components/tasks/board-section-scroll";

assert.equal(
  BOARD_SECTION_SCROLL_AFTER_MOBILE * BOARD_SECTION_CARD_SLOT_PX,
  204,
  "mobile max-h-[204px] must match slot × mobile after",
);
assert.equal(
  BOARD_SECTION_SCROLL_AFTER_DESKTOP * BOARD_SECTION_CARD_SLOT_PX,
  272,
  "desktop md:max-h-[272px] must match slot × desktop after",
);
assert.equal(sectionListNeedsScroll(BOARD_SECTION_SCROLL_AFTER_MOBILE), false);
assert.equal(sectionListNeedsScroll(BOARD_SECTION_SCROLL_AFTER_MOBILE + 1), true);

console.log("check-board-section-scroll: ok");
