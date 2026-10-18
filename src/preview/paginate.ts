/** A4 in CSS pixels (96 dpi). */
export const PAGE_WIDTH_PX = (210 * 96) / 25.4;
export const PAGE_HEIGHT_PX = (297 * 96) / 25.4;

/**
 * Distance from `el`'s top edge to `ancestor`'s, in layout pixels. Uses the
 * offsetParent chain, so the preview's zoom transform doesn't skew it. The
 * sheet is position: relative, so the chain always ends there.
 */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

/**
 * Mimics print pagination on screen. Every `.cv-block` that would straddle a
 * page boundary is pushed to the top of the next page (via --cv-push), the way
 * `break-inside: avoid` behaves in print. Column padding is assumed to repeat
 * on each page (box-decoration-break: clone). Returns the page count.
 */
export function paginate(sheet: HTMLElement, pageHeight = PAGE_HEIGHT_PX): number {
  const blocks = sheet.querySelectorAll<HTMLElement>('.cv-block');
  blocks.forEach((b) => b.style.removeProperty('--cv-push'));

  sheet.querySelectorAll<HTMLElement>('.cv-col').forEach((col) => {
    const cs = getComputedStyle(col);
    const padTop = Number.parseFloat(cs.paddingTop) || 0;
    const padBottom = Number.parseFloat(cs.paddingBottom) || 0;
    const usable = pageHeight - padTop - padBottom;

    // Blocks are processed top-down; each push moves everything after it.
    col.querySelectorAll<HTMLElement>('.cv-block').forEach((block) => {
      const top = offsetWithin(block, sheet);
      const height = block.offsetHeight;
      const page = Math.floor(top / pageHeight);
      const pageStart = page * pageHeight;
      const pageLimit = pageStart + pageHeight - padBottom;

      let target = top;
      if (page > 0 && top < pageStart + padTop) {
        target = pageStart + padTop;
      } else if (top + height > pageLimit && height <= usable) {
        target = pageStart + pageHeight + padTop;
      }
      if (target > top + 0.5) block.style.setProperty('--cv-push', `${target - top}px`);
    });
  });

  const content = sheet.querySelector<HTMLElement>('.cv-content') ?? sheet;
  const height = content.offsetHeight;
  return Math.max(1, Math.ceil((height - 1) / pageHeight));
}
