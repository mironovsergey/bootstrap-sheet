import { expect, test } from './support/test';

/**
 * Pause after a scroll that is longer than the 100 ms during which a new
 * gesture is taken for the scroll's momentum and left to the content (ms)
 */
const AFTER_SCROLL = 200;

/**
 * Pause before release that is longer than the 100 ms window velocity is
 * measured over, so that the sheet is released with no velocity (ms)
 */
const STILL_BEFORE_RELEASE = 200;

test.describe('Scrolling', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('scrolling.html');
    await sheetPage.open();
  });

  test.describe('gestures on scrollable content', () => {
    test('should drag the sheet down from content at its top', async ({ sheetPage, gesture }) => {
      await gesture.start(sheetPage.body);
      await gesture.moveBy(0, 100, { steps: 10 });

      await expect(sheetPage.sheet).toContainClass('dragging');
      await expect.poll(() => sheetPage.translateY()).toBeCloseTo(90, 0);
      expect(await sheetPage.bodyScrollTop()).toBe(0);

      await gesture.hold(STILL_BEFORE_RELEASE);
      await gesture.end();
      await expect.poll(() => sheetPage.translateY()).toBe(0);
    });

    test('should not drag the sheet up from content at its top', async ({ sheetPage, gesture }) => {
      await gesture.start(sheetPage.body);
      await gesture.moveBy(0, -100, { steps: 10 });
      await sheetPage.waitForFrame();

      expect(await sheetPage.translateY()).toBe(0);
      await expect(sheetPage.sheet).not.toContainClass('dragging');

      await gesture.end();
    });

    test('should not drag the sheet from content scrolled away from its top', async ({
      sheetPage,
      gesture,
    }) => {
      await sheetPage.scrollBodyTo(300);
      await sheetPage.page.waitForTimeout(AFTER_SCROLL);

      await gesture.start(sheetPage.body);
      await gesture.moveBy(0, 100, { steps: 10 });
      await sheetPage.waitForFrame();

      expect(await sheetPage.translateY()).toBe(0);
      await expect(sheetPage.sheet).not.toContainClass('dragging');

      await gesture.end();
    });
  });

  // A mouse drag never scrolls anything, so whether content and page scroll
  // under a gesture can only be seen with real touch input
  test.describe('native scrolling under touch', () => {
    test.skip(
      ({ pointerKind }) => pointerKind !== 'touch',
      'Real touch input is available in the Chromium phone only',
    );

    test('should scroll the content on an upward swipe from its top', async ({
      sheetPage,
      gesture,
    }) => {
      await gesture.start(sheetPage.body);
      await gesture.moveBy(0, -150, { steps: 10 });
      await gesture.end();

      await expect.poll(() => sheetPage.bodyScrollTop()).toBeGreaterThan(0);
      expect(await sheetPage.translateY()).toBe(0);
    });

    test('should scroll content scrolled away from its top back towards it', async ({
      sheetPage,
      gesture,
    }) => {
      await sheetPage.scrollBodyTo(300);
      await sheetPage.page.waitForTimeout(AFTER_SCROLL);

      await gesture.start(sheetPage.body);
      await gesture.moveBy(0, 100, { steps: 10 });
      await gesture.end();

      await expect.poll(() => sheetPage.bodyScrollTop()).toBeLessThan(300);
      expect(await sheetPage.translateY()).toBe(0);
    });

    test('should keep the page from scrolling under a swipe on the backdrop', async ({
      sheetPage,
      gesture,
    }) => {
      // Near the top of the screen, well above the sheet
      await gesture.start(sheetPage.backdrop, { x: 20, y: 250 });
      await gesture.moveBy(0, -200, { steps: 10 });
      await gesture.end();
      await sheetPage.waitForFrame();

      expect(await sheetPage.pageScrollY()).toBe(0);
    });

    test('should let the page scroll under a swipe once closed', async ({ sheetPage, gesture }) => {
      await sheetPage.page.keyboard.press('Escape');
      await sheetPage.expectHidden();

      await gesture.start(sheetPage.page.locator('main'), { x: 20, y: 250 });
      await gesture.moveBy(0, -200, { steps: 10 });
      await gesture.end();

      await expect.poll(() => sheetPage.pageScrollY()).toBeGreaterThan(0);
    });
  });
});
