import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for a test page that holds one sheet, `#sheet`, toggled by the
 * trigger `#open`.
 *
 * Reads what the browser renders rather than the component's internal state:
 * computed styles, layout boxes and visibility.
 */
export default class SheetPage {
  /** Browser page the test runs in */
  readonly page: Page;

  /** The sheet element */
  readonly sheet: Locator;

  /** The backdrop, present in the document only while the sheet is shown */
  readonly backdrop: Locator;

  /** Trigger that toggles the sheet through the data API */
  readonly trigger: Locator;

  /**
   * @param page - Browser page the test runs in
   */
  constructor(page: Page) {
    this.page = page;
    this.sheet = page.locator('#sheet');
    this.backdrop = page.locator('.sheet-backdrop');
    this.trigger = page.locator('#open');
  }

  /**
   * Load a test page
   * @param name - File name of the page in tests/e2e/pages
   */
  async goto(name: string): Promise<void> {
    await this.page.goto(name);
  }

  /**
   * Open the sheet with its trigger and wait until it has settled
   */
  async open(): Promise<void> {
    await this.trigger.click();
    await this.expectShown();
  }

  /**
   * Wait until the sheet has settled open: the `show` class is added only
   * when the opening animation comes to rest
   */
  async expectShown(): Promise<void> {
    await expect(this.sheet).toContainClass('show');
  }

  /**
   * Wait until the sheet has finished closing: a closed sheet is hidden with
   * `visibility: hidden`, which applies only once the closing animation ends
   */
  async expectHidden(): Promise<void> {
    await expect(this.sheet).toBeHidden();
    await expect(this.backdrop).toHaveCount(0);
  }

  /**
   * Rendered vertical translation of the sheet
   * @returns Translation in pixels; 0 at the fully open position
   */
  async translateY(): Promise<number> {
    return this.sheet.evaluate((element) => {
      const { transform } = window.getComputedStyle(element);

      return transform === 'none' ? 0 : new DOMMatrix(transform).m42;
    });
  }

  /**
   * Height of the part of the sheet that lies inside the viewport
   * @returns Height in pixels; 0 when the sheet is entirely outside
   */
  async heightInViewport(): Promise<number> {
    return this.sheet.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect();

      return Math.max(0, Math.min(bottom, window.innerHeight) - Math.max(top, 0));
    });
  }

  /**
   * Distance from the bottom edge of the sheet to the bottom of the viewport
   * @returns Distance in pixels; 0 when the sheet sits on the bottom edge
   */
  async bottomGap(): Promise<number> {
    return this.sheet.evaluate(
      (element) => window.innerHeight - element.getBoundingClientRect().bottom,
    );
  }

  /**
   * Rendered opacity of the backdrop
   * @returns Opacity between 0 and 1
   */
  async backdropOpacity(): Promise<number> {
    return this.backdrop.evaluate((element) => Number(window.getComputedStyle(element).opacity));
  }

  /**
   * Vertical scroll position of the page
   * @returns Scroll offset in pixels
   */
  async pageScrollY(): Promise<number> {
    return this.page.evaluate(() => window.scrollY);
  }
}
