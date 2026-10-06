import { expect, test } from './support/test';

test.describe('Lifecycle', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('basic.html');
  });

  test('should keep a closed sheet hidden below the viewport', async ({ sheetPage }) => {
    await expect(sheetPage.sheet).toBeHidden();
    await expect(sheetPage.backdrop).toHaveCount(0);

    // Translating by 100% of a fractional height can leave the top edge a
    // fraction of a pixel inside the viewport, which renders nothing
    expect(await sheetPage.heightInViewport()).toBeLessThan(0.5);
  });

  test('should open from its trigger and rest on the bottom edge', async ({ sheetPage }) => {
    await sheetPage.open();

    await expect(sheetPage.sheet).toBeVisible();
    await expect(sheetPage.sheet).toBeInViewport({ ratio: 1 });
    expect(await sheetPage.translateY()).toBe(0);
    expect(await sheetPage.bottomGap()).toBeCloseTo(0, 0);
  });

  test('should cover the page with an opaque backdrop while open', async ({ sheetPage }) => {
    await sheetPage.open();

    await expect(sheetPage.backdrop).toBeVisible();
    await expect(sheetPage.backdrop).toBeInViewport({ ratio: 1 });
    expect(await sheetPage.backdropOpacity()).toBe(1);
  });

  test('should close from a dismiss button', async ({ sheetPage }) => {
    await sheetPage.open();

    await sheetPage.sheet.getByRole('button', { name: 'Close' }).click();

    await sheetPage.expectHidden();
  });

  test('should close when the backdrop is clicked', async ({ sheetPage }) => {
    await sheetPage.open();

    // The top left corner is outside the sheet, which rests at the bottom
    await sheetPage.backdrop.click({ position: { x: 10, y: 10 } });

    await sheetPage.expectHidden();
  });

  test('should close on Escape', async ({ sheetPage }) => {
    await sheetPage.open();

    await sheetPage.page.keyboard.press('Escape');

    await sheetPage.expectHidden();
  });

  test.describe('page scrolling with the mouse wheel', () => {
    test.skip(
      ({ browserName, isMobile }) => browserName === 'webkit' && isMobile,
      'Playwright does not support the mouse wheel in mobile WebKit',
    );

    test('should keep the page from scrolling while open', async ({ sheetPage }) => {
      await sheetPage.open();

      await sheetPage.page.mouse.move(10, 10);
      await sheetPage.page.mouse.wheel(0, 600);

      // A wheel step is applied asynchronously; give it a frame before reading
      await sheetPage.page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );

      expect(await sheetPage.pageScrollY()).toBe(0);
    });

    test('should let the page scroll again once closed', async ({ sheetPage }) => {
      await sheetPage.open();
      await sheetPage.page.keyboard.press('Escape');
      await sheetPage.expectHidden();

      await sheetPage.page.mouse.move(10, 10);
      await sheetPage.page.mouse.wheel(0, 600);

      await expect.poll(() => sheetPage.pageScrollY()).toBeGreaterThan(0);
    });
  });
});
