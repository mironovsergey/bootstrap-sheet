import { getScrollbarWidth } from './utils';

/**
 * Scrollbar compensation helper for BootstrapSheet.
 *
 * When the sheet opens, body scrolling is disabled. On pages with a visible
 * scrollbar this would cause a layout shift, so the scrollbar width is
 * compensated with an equivalent body padding.
 */
export default class ScrollBarHelper {
  /**
   * Disable body scrolling and compensate for the scrollbar width.
   *
   * Scrolling is disabled unconditionally. Only the compensation depends on
   * the scrollbar: it is skipped when the page does not overflow or when its
   * scrollbar takes no space, as overlay scrollbars on touch devices and
   * macOS do.
   */
  hide(): void {
    const isOverflowing = document.body.scrollHeight > window.innerHeight;

    if (isOverflowing) {
      const scrollbarWidth = getScrollbarWidth();

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    document.body.style.overflow = 'hidden';
  }

  /**
   * Restore body scrolling and remove the compensation padding
   */
  reset(): void {
    document.body.style.paddingRight = '';
    document.body.style.overflow = '';
  }
}
