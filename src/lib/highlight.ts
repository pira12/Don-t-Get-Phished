/**
 * Find the tightest element under `root` whose text contains `needle`, flash it,
 * and scroll it into view. Used by the feedback "evidence chips" to point at the
 * exact spoofed domain / urgency phrase / SPF-fail row inside the reading pane.
 */
export function findAndFlash(root: HTMLElement | null, needle: string): boolean {
  if (!root || !needle) return false;
  const target = tightestMatch(root, needle.toLowerCase());
  if (!target) return false;

  target.classList.remove("evidence-flash");
  // Force reflow so re-adding the class restarts the animation.
  void target.offsetWidth;
  target.classList.add("evidence-flash");
  target.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => target.classList.remove("evidence-flash"), 1900);
  return true;
}

function tightestMatch(root: HTMLElement, needleLower: string): HTMLElement | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let best: HTMLElement | null = null;
  let current = walker.currentNode as HTMLElement | null;

  while (current) {
    const el = current as HTMLElement;
    const text = (el.textContent ?? "").toLowerCase();
    if (text.includes(needleLower)) {
      // Prefer the smallest element that still contains the whole needle.
      if (!best || (el.textContent ?? "").length <= (best.textContent ?? "").length) {
        best = el;
      }
    }
    current = walker.nextNode() as HTMLElement | null;
  }
  return best;
}
