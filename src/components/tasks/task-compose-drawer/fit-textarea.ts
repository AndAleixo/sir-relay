/** Grow a textarea to content height, capped at maxPx. */
export function fitTextareaHeight(
  el: HTMLTextAreaElement | null,
  maxPx: number,
): void {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
}
