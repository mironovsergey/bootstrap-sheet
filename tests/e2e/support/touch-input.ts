import type { CDPSession } from '@playwright/test';
import type PointerInput from './pointer-input';

/**
 * A finger on the touch screen of an emulated phone, Chromium only.
 *
 * Touches go through the DevTools protocol, so the browser handles them as
 * real touch input: it dispatches pointer events of type `touch`, honors
 * `touch-action` and starts native scrolling. Synthetic touch events, the
 * only touch gestures Playwright itself offers beyond a tap, do none of that.
 */
export default class TouchInput implements PointerInput {
  /** DevTools protocol session attached to the page under test */
  readonly #session: CDPSession;

  /**
   * @param session - DevTools protocol session attached to the page under test
   */
  constructor(session: CDPSession) {
    this.#session = session;
  }

  async press(x: number, y: number): Promise<void> {
    await this.#session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
  }

  async move(x: number, y: number): Promise<void> {
    await this.#session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y }],
    });
  }

  async release(): Promise<void> {
    await this.#session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  }

  /**
   * Sends the release right behind the move instead of waiting until the page
   * has handled the move: the browser processes the commands in order, and
   * the finger leaves the screen within the frame of its last movement, as it
   * does at the end of a real flick.
   */
  async moveAndRelease(x: number, y: number): Promise<void> {
    await Promise.all([
      this.#session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y }],
      }),
      this.#session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      }),
    ]);
  }
}
