/** Team board To do / In progress: scroll when section has more than this many cards. */
export const DEFAULT_BOARD_SECTION_SCROLL_AFTER = 3;

/** Estimated card row height (card + gap) for max-height calculation. */
export const BOARD_SECTION_CARD_SLOT_PX = 68;

export function sectionListMaxHeight(
  itemCount: number,
  scrollAfter: number = DEFAULT_BOARD_SECTION_SCROLL_AFTER,
): number | undefined {
  if (itemCount <= scrollAfter) return undefined;
  return scrollAfter * BOARD_SECTION_CARD_SLOT_PX;
}
