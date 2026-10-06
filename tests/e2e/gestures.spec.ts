import { expect, test } from './support/test';

/**
 * Pause before release that is longer than the 100 ms window velocity is
 * measured over, so that the sheet is released with no velocity (ms)
 */
const STILL_BEFORE_RELEASE = 200;

test.describe('Gestures', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('gestures.html');
    await sheetPage.open();
  });

  test('should follow the pointer while dragged down', async ({ sheetPage, gesture }) => {
    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, 100, { steps: 10 });

    await expect(sheetPage.sheet).toContainClass('dragging');

    // The drag begins where the pointer crosses the drag slop, at the end of
    // the first 10 px step, so the sheet trails the pointer by that step
    await expect.poll(() => sheetPage.translateY()).toBeCloseTo(90, 0);

    await gesture.end();
  });

  test('should spring back when released short of halfway', async ({ sheetPage, gesture }) => {
    const height = await sheetPage.height();

    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, height * 0.3, { steps: 10 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await expect.poll(() => sheetPage.translateY()).toBe(0);
    await expect(sheetPage.sheet).not.toContainClass('dragging');
    await sheetPage.expectShown();
  });

  test('should close when released past halfway', async ({ sheetPage, gesture }) => {
    const height = await sheetPage.height();

    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, height * 0.65, { steps: 13 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await sheetPage.expectHidden();
  });

  test('should close on a quick downward flick', async ({ sheetPage, gesture }) => {
    // 120 px is well short of halfway, 210 px: released without velocity the
    // sheet would spring back. Velocity is measured over the last 100 ms, so
    // the last two steps and the release have to fall within that window;
    // lifting the pointer with the last step, as a flick does, leaves the
    // window to the one step before it, even when touch input through the
    // DevTools protocol is slow to arrive.
    await gesture.start(sheetPage.header);
    await gesture.flick(0, 120, 4);

    await sheetPage.expectHidden();
  });

  test('should resist being dragged above the open position', async ({ sheetPage, gesture }) => {
    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, -100, { steps: 10 });

    // Rubber band resistance: the sheet follows upwards, but by less than
    // 55 % of the 90 px the pointer travelled past the drag slop, since 0.55
    // is the initial slope of the resistance curve
    await expect.poll(() => sheetPage.translateY()).toBeLessThan(0);
    expect(await sheetPage.translateY()).toBeGreaterThan(-90 * 0.55);

    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await expect.poll(() => sheetPage.translateY()).toBe(0);
    await sheetPage.expectShown();
  });

  test('should let a tap on a button inside the sheet through', async ({ sheetPage, gesture }) => {
    await gesture.tap(sheetPage.page.locator('#count'));

    await expect(sheetPage.page.locator('#count-value')).toHaveText('1');
    await sheetPage.expectShown();
    expect(await sheetPage.translateY()).toBe(0);
  });

  test.describe('gestures that belong to the content', () => {
    test('should not drag from a data-bs-drag="false" zone', async ({ sheetPage, gesture }) => {
      await gesture.start(sheetPage.page.locator('#no-drag'));
      await gesture.moveBy(0, 100, { steps: 10 });
      await sheetPage.waitForFrame();

      expect(await sheetPage.translateY()).toBe(0);
      await expect(sheetPage.sheet).not.toContainClass('dragging');

      await gesture.end();
      await sheetPage.expectShown();
    });

    test('should not drag from a range input', async ({ sheetPage, gesture }) => {
      await gesture.start(sheetPage.page.locator('#range'));
      await gesture.moveBy(0, 100, { steps: 10 });
      await sheetPage.waitForFrame();

      expect(await sheetPage.translateY()).toBe(0);
      await expect(sheetPage.sheet).not.toContainClass('dragging');

      await gesture.end();
      await sheetPage.expectShown();
    });

    test('should not drag on a mostly horizontal swipe', async ({ sheetPage, gesture }) => {
      // The vertical part crosses the drag slop on the third step, when the
      // pointer has travelled three times as far sideways
      await gesture.start(sheetPage.page.locator('#text'));
      await gesture.moveBy(100, 30, { steps: 10 });
      await sheetPage.waitForFrame();

      expect(await sheetPage.translateY()).toBe(0);
      await expect(sheetPage.sheet).not.toContainClass('dragging');

      await gesture.end();
      await sheetPage.expectShown();
    });
  });
});
