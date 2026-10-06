import { expect, test } from './support/test';

test.describe('Focus', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('focus.html');
  });

  test('should expose the open sheet as a named modal dialog', async ({ sheetPage }) => {
    const dialog = sheetPage.page.getByRole('dialog', { name: 'Focus' });

    // A closed sheet is hidden, which keeps it out of the accessibility tree
    await expect(dialog).toHaveCount(0);

    await sheetPage.openWithKeyboard();

    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('should move focus to the first control in the sheet', async ({ sheetPage }) => {
    await sheetPage.openWithKeyboard();

    await expect(sheetPage.page.locator('#close')).toBeFocused();
  });

  test('should keep Tab within the sheet', async ({ sheetPage, tabKey }) => {
    const { page } = sheetPage;

    await sheetPage.openWithKeyboard();

    await page.keyboard.press(tabKey);
    await expect(page.locator('#sheet-input')).toBeFocused();

    await page.keyboard.press(tabKey);
    await expect(page.locator('#done')).toBeFocused();

    // Past the last control focus wraps around instead of leaving the sheet
    await page.keyboard.press(tabKey);
    await expect(page.locator('#close')).toBeFocused();

    await page.keyboard.press(`Shift+${tabKey}`);
    await expect(page.locator('#done')).toBeFocused();
  });

  test('should keep the page behind out of reach', async ({ sheetPage }) => {
    await sheetPage.openWithKeyboard();

    expect(await sheetPage.canFocus(sheetPage.page.locator('#background-input'))).toBe(false);
    expect(await sheetPage.canFocus(sheetPage.trigger)).toBe(false);

    // The sheet shares an ancestor with the inert page content, yet stays usable
    await sheetPage.page.locator('#sheet-input').fill('typed');
    await expect(sheetPage.page.locator('#sheet-input')).toHaveValue('typed');
  });

  test('should give the page back and return focus to the trigger', async ({ sheetPage }) => {
    await sheetPage.openWithKeyboard();

    await sheetPage.page.keyboard.press('Escape');
    await sheetPage.expectHidden();

    await expect(sheetPage.trigger).toBeFocused();
    expect(await sheetPage.canFocus(sheetPage.page.locator('#background-input'))).toBe(true);
  });

  test('should return focus to the trigger when closed from inside', async ({ sheetPage }) => {
    await sheetPage.openWithKeyboard();

    await sheetPage.page.keyboard.press('Enter');
    await sheetPage.expectHidden();

    await expect(sheetPage.trigger).toBeFocused();
  });
});

test.describe('Focus at an undimmed detent', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('detents-undimmed.html');
  });

  test('should leave focus and the page alone', async ({ sheetPage, tabKey }) => {
    await sheetPage.openWithKeyboard();

    await expect(sheetPage.trigger).toBeFocused();
    await expect(sheetPage.sheet).toHaveAttribute('aria-modal', 'false');

    // The next control on the page, not one inside the sheet
    await sheetPage.page.keyboard.press(tabKey);
    await expect(sheetPage.page.locator('#count')).toBeFocused();
  });
});
