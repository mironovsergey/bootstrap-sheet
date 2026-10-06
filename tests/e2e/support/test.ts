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
   * Input the project stands for: a finger where Playwright can drive real
   * touch input, which is Chromium with touch support, the mouse elsewhere
   */
  pointerKind: 'mouse' | 'touch';

  /** Gesture performed with the input the project stands for */
  gesture: Gesture;

  /**
   * Key that moves focus to the next control. Safari, and WebKit with it,
   * moves only between form fields on Tab by default, while Option+Tab
   * reaches every control.
   */
  tabKey: 'Alt+Tab' | 'Tab';
}

/**
 * Playwright's `test` extended with the fixtures above
 */
export const test = base.extend<SheetFixtures>({
  sheetPage: async ({ page }, use) => {
    await use(new SheetPage(page));
  },

  pointerKind: async ({ browserName, hasTouch }, use) => {
    await use(browserName === 'chromium' && hasTouch ? 'touch' : 'mouse');
  },

  gesture: async ({ page, pointerKind }, use) => {
    if (pointerKind === 'touch') {
      const session = await page.context().newCDPSession(page);

      await use(new Gesture(page, new TouchInput(session)));
      await session.detach();

      return;
    }

    await use(new Gesture(page, new MouseInput(page.mouse)));
  },

  tabKey: async ({ browserName }, use) => {
    await use(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  },
});
