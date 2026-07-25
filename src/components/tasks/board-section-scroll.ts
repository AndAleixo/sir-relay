/**
 * Team board To do / In progress: start clamping when count exceeds the mobile
 * window. Desktop uses a taller CSS max-height (`md:`) — see team-board.styles.
 */
export const BOARD_SECTION_SCROLL_AFTER_MOBILE = 3;
export const BOARD_SECTION_SCROLL_AFTER_DESKTOP = 4;

/** Estimated card row height (card + gap); keep in sync with CSS max-h values. */
export const BOARD_SECTION_CARD_SLOT_PX = 68;

export function sectionListNeedsScroll(
  itemCount: number,
  mobileAfter: number = BOARD_SECTION_SCROLL_AFTER_MOBILE,
): boolean {
  return itemCount > mobileAfter;
}
