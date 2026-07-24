/** Default: scroll inside a section when it has more than this many task cards. */
export const DEFAULT_BOARD_SECTION_SCROLL_AFTER = 3;

/** Estimated card row height (card + gap) for max-height calculation. */
export const BOARD_SECTION_CARD_SLOT_PX = 68;

/** Done accordion: initial visible cards (most recent). */
export const DONE_PREVIEW_INITIAL = 5;

/** Done accordion: extra cards per show-more click. */
export const DONE_PREVIEW_STEP = 10;

export function sectionListMaxHeight(
  itemCount: number,
  scrollAfter: number = DEFAULT_BOARD_SECTION_SCROLL_AFTER,
): number | undefined {
  if (itemCount <= scrollAfter) return undefined;
  return scrollAfter * BOARD_SECTION_CARD_SLOT_PX;
}
