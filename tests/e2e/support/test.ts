import { test as base } from '@playwright/test';
import SheetPage from './sheet-page';

export { expect } from '@playwright/test';

/**
 * Fixtures shared by the end-to-end specs
 */
interface SheetFixtures {
  /** Page object for the test page, created for every test */
  sheetPage: SheetPage;
}

/**
 * Playwright's `test` extended with the fixtures above
 */
export const test = base.extend<SheetFixtures>({
  sheetPage: async ({ page }, use) => {
    await use(new SheetPage(page));
  },
});
