import { expect, test } from './support/test';

test.describe('Accessibility', () => {
  test('should have no violations with the sheet closed', async ({ sheetPage, makeAxeBuilder }) => {
    await sheetPage.goto('basic.html');

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('should have no violations with the sheet open', async ({ sheetPage, makeAxeBuilder }) => {
    await sheetPage.goto('basic.html');
    await sheetPage.open();

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('should have no violations with a nested sheet open', async ({
    sheetPage,
    makeAxeBuilder,
  }) => {
    await sheetPage.goto('focus.html');
    await sheetPage.openWithKeyboard();

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('should have no violations at an undimmed detent', async ({ sheetPage, makeAxeBuilder }) => {
    await sheetPage.goto('detents-undimmed.html');
    await sheetPage.open();

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('should have no violations at the largest detent', async ({ sheetPage, makeAxeBuilder }) => {
    await sheetPage.goto('detents-undimmed.html');
    await sheetPage.open();
    await sheetPage.setDetent(1);
    await expect(sheetPage.sheet).toHaveAttribute('aria-modal', 'true');

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });
});
