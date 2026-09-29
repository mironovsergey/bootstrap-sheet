import { getScrollbarWidth } from './utils';

/**
 * Inline body styles replaced by the page lock
 */
interface ReplacedStyles {
  overflow: string;
  paddingRight: string;
}

/**
 * Page scroll lock for BootstrapSheet.
 *
 * When a sheet presents modally, page scrolling is disabled. On pages with a
 * visible scrollbar this would cause a layout shift, so the scrollbar width is
 * compensated with an equivalent body padding.
 *
 * The lock is shared by all sheets: it is applied when the first sheet takes
 * it and released only when the last one lets go, in any order. Releasing
 * restores the inline styles the body had before, rather than clearing them.
 */
export default class ScrollBarHelper {
  /** Sheets currently holding the page lock */
  static #lockHolders = new Set<HTMLElement>();

  /** Inline body styles the lock replaced, or null while the page is unlocked */
  static #replacedStyles: ReplacedStyles | null = null;

  /** Sheet this helper holds the lock for */
  #owner: HTMLElement;

  /**
   * @param owner - Sheet element that holds the lock
   */
  constructor(owner: HTMLElement) {
    this.#owner = owner;
  }

  /**
   * Take the page lock, applying it if no other sheet holds it
   */
  hide(): void {
    if (ScrollBarHelper.#lockHolders.has(this.#owner)) {
      return;
    }

    ScrollBarHelper.#pruneDetachedHolders();

    if (ScrollBarHelper.#lockHolders.size === 0) {
      // A holder pruned above may have left its lock applied
      ScrollBarHelper.#unlockPage();
      ScrollBarHelper.#lockPage();
    }

    ScrollBarHelper.#lockHolders.add(this.#owner);
  }

  /**
   * Release the page lock, restoring the page if no other sheet holds it
   */
  reset(): void {
    if (!ScrollBarHelper.#lockHolders.delete(this.#owner)) {
      return;
    }

    ScrollBarHelper.#pruneDetachedHolders();

    if (ScrollBarHelper.#lockHolders.size === 0) {
      ScrollBarHelper.#unlockPage();
    }
  }

  /**
   * Disable page scrolling and compensate for the scrollbar width
   */
  static #lockPage(): void {
    const bodyStyle = document.body.style;

    // Measured before the body is locked, which would hide the scrollbar
    const scrollbarWidth = ScrollBarHelper.#visibleScrollbarWidth();

    ScrollBarHelper.#replacedStyles = {
      overflow: bodyStyle.overflow,
      paddingRight: bodyStyle.paddingRight,
    };

    bodyStyle.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      const computedPadding = Number.parseFloat(
        window.getComputedStyle(document.body).getPropertyValue('padding-right'),
      );

      bodyStyle.paddingRight = `${(computedPadding || 0) + scrollbarWidth}px`;
    }
  }

  /**
   * Restore the inline body styles the lock replaced
   */
  static #unlockPage(): void {
    const replacedStyles = ScrollBarHelper.#replacedStyles;

    if (!replacedStyles) {
      return;
    }

    const bodyStyle = document.body.style;

    bodyStyle.overflow = replacedStyles.overflow;
    bodyStyle.paddingRight = replacedStyles.paddingRight;

    ScrollBarHelper.#replacedStyles = null;
  }

  /**
   * Width of the page scrollbar the lock is about to remove.
   *
   * Zero when there is none: the page does not overflow, its scrollbar takes
   * no space, as overlay scrollbars on touch devices and macOS do, or page
   * scrolling is already disabled, by a Bootstrap modal underneath for
   * example, whose own lock has compensated for the scrollbar already.
   * @returns Width in pixels
   */
  static #visibleScrollbarWidth(): number {
    const { body, documentElement } = document;

    if (body.scrollHeight <= window.innerHeight) {
      return 0;
    }

    const isScrollingDisabled = [documentElement, body].some((element) => {
      const overflowY = window.getComputedStyle(element).getPropertyValue('overflow-y');

      return overflowY === 'hidden' || overflowY === 'clip';
    });

    return isScrollingDisabled ? 0 : getScrollbarWidth();
  }

  /**
   * Forget holders that left the document without releasing the lock, such as
   * a sheet unmounted while open. Otherwise they would keep the page locked for
   * good.
   */
  static #pruneDetachedHolders(): void {
    for (const holder of ScrollBarHelper.#lockHolders) {
      if (!holder.isConnected) {
        ScrollBarHelper.#lockHolders.delete(holder);
      }
    }
  }
}
