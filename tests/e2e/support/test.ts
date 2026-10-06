import { test as base } from '@playwright/test';
import Gesture from './gesture';
import MouseInput from './mouse-input';
import SheetPage from './sheet-page';
import TouchInput from './touch-input';

export { expect } from '@playwright/test';

/**
 * Fixtures shared by the end-to-end specs
 */
interface SheetFixtures {
  /** Page object for the test page, created for every test */
  sheetPage: SheetPage;

  /**
   * Gesture performed with the input the project stands for: a finger where
   * Playwright can drive real touch input, the mouse everywhere else
   */
  gesture: Gesture;
}

/**
 * Playwright's `test` extended with the fixtures above
 */
export const test = base.extend<SheetFixtures>({
  sheetPage: async ({ page }, use) => {
    await use(new SheetPage(page));
  },

  gesture: async ({ page, browserName, hasTouch }, use) => {
    if (browserName === 'chromium' && hasTouch) {
      const session = await page.context().newCDPSession(page);

      await use(new Gesture(page, new TouchInput(session)));
      await session.detach();

      return;
    }

    await use(new Gesture(page, new MouseInput(page.mouse)));
  },
});
