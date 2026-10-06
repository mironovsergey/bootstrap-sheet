import { expect, test } from './support/test';

/**
 * Pause before release that is longer than the 100 ms window velocity is
 * measured over, so that the sheet is released with no velocity (ms)
 */
const STILL_BEFORE_RELEASE = 200;

/**
 * Where the 500 px sheet rests at the 0.4 detent: 60 % of it below the
 * bottom edge of the viewport (px)
 */
const SMALL_DETENT_Y = 300;

// The detent the component reports changes only once the sheet settles, so
// the tests wait for it rather than for a position: a spring that overshoots
// passes through its target position while still in flight.

test.describe('Detents', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('detents.html');
    await sheetPage.open();
  });

  test('should open at the smallest detent', async ({ sheetPage }) => {
    expect(await sheetPage.currentDetent()).toBe(0.4);
    expect(await sheetPage.translateY()).toBeCloseTo(SMALL_DETENT_Y, 0);
    expect(await sheetPage.heightInViewport()).toBeCloseTo(200, 0);
  });

  test('should dim the backdrop as far as the sheet is open', async ({ sheetPage }) => {
    expect(await sheetPage.backdropOpacity()).toBeCloseTo(0.4, 2);
  });

  test('should expand to the largest detent when dragged up', async ({ sheetPage, gesture }) => {
    // 180 px past the drag slop leaves the sheet 120 px down, nearer to the
    // largest detent at 0 than to the smallest at 300
    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, -200, { steps: 10 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await expect.poll(() => sheetPage.currentDetent()).toBe(1);
    expect(await sheetPage.translateY()).toBe(0);
    expect(await sheetPage.backdropOpacity()).toBe(1);
  });

  test('should collapse to the smallest detent when dragged down', async ({
    sheetPage,
    gesture,
  }) => {
    await sheetPage.setDetent(1);
    await expect.poll(() => sheetPage.currentDetent()).toBe(1);

    // 180 px past the drag slop is nearer to the smallest detent at 300 than
    // to the largest at 0
    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, 200, { steps: 10 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await expect.poll(() => sheetPage.currentDetent()).toBe(0.4);
    expect(await sheetPage.translateY()).toBeCloseTo(SMALL_DETENT_Y, 0);
  });

  test('should close when dragged down from the smallest detent', async ({
    sheetPage,
    gesture,
  }) => {
    // 126 px past the drag slop leaves the sheet 426 px down, nearer to
    // closed at 500 than to the smallest detent at 300
    await gesture.start(sheetPage.header);
    await gesture.moveBy(0, 140, { steps: 10 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await sheetPage.expectHidden();
  });

  test('should move to a detent set through the API', async ({ sheetPage }) => {
    await sheetPage.setDetent(1);

    await expect.poll(() => sheetPage.currentDetent()).toBe(1);
    expect(await sheetPage.translateY()).toBe(0);
  });

  test('should expand rather than scroll its content when dragged up from it', async ({
    sheetPage,
    gesture,
  }) => {
    // Only the top of the body shows at the smallest detent
    await gesture.start(sheetPage.body, { x: 40, y: 20 });
    await gesture.moveBy(0, -200, { steps: 10 });
    await gesture.hold(STILL_BEFORE_RELEASE);
    await gesture.end();

    await expect.poll(() => sheetPage.currentDetent()).toBe(1);
    expect(await sheetPage.translateY()).toBe(0);
    expect(await sheetPage.bodyScrollTop()).toBe(0);
  });

  test('should take vertical touch gestures from the browser below the largest detent', async ({
    sheetPage,
  }) => {
    expect(await sheetPage.touchAction()).toBe('pan-x');

    await sheetPage.setDetent(1);
    await expect.poll(() => sheetPage.touchAction()).toBe('pan-x pan-y');
  });
});

test.describe('Undimmed detent', () => {
  test.beforeEach(async ({ sheetPage }) => {
    await sheetPage.goto('detents-undimmed.html');
    await sheetPage.open();
  });

  test('should leave the backdrop transparent at the undimmed detent', async ({ sheetPage }) => {
    expect(await sheetPage.backdropOpacity()).toBe(0);
  });

  test('should leave the page usable at the undimmed detent', async ({ sheetPage }) => {
    await sheetPage.page.locator('#count').click();

    await expect(sheetPage.page.locator('#count-value')).toHaveText('1');
    await sheetPage.expectShown();
  });

  test('should dim the page and close on a click outside at the largest detent', async ({
    sheetPage,
  }) => {
    const countButton = sheetPage.page.locator('#count');
    const box = await countButton.boundingBox();

    if (box === null) {
      throw new Error('The count button is not rendered.');
    }

    await sheetPage.setDetent(1);

    // The sheet turns modal when it settles, not while it moves: an
    // overshooting spring makes the backdrop opaque before that
    await expect(sheetPage.sheet).toHaveAttribute('aria-modal', 'true');
    expect(await sheetPage.backdropOpacity()).toBe(1);

    // A raw click at the button's position: the backdrop is on top of it now
    await sheetPage.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await sheetPage.expectHidden();
    await expect(sheetPage.page.locator('#count-value')).toHaveText('0');
  });
});
