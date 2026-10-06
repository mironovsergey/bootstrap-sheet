import type { Locator, Page } from '@playwright/test';
import type PointerInput from './pointer-input';

/**
 * Options for moving the pointer of a gesture
 */
export interface GestureMoveOptions {
  /** Number of equal steps the movement is split into */
  steps?: number;

  /** Pause after each step (ms); 0 moves as fast as the browser accepts input */
  stepDelay?: number;
}

/**
 * A press, drag and release performed step by step with a pointer input.
 *
 * The pointer never leaves the viewport: Playwright does not deliver mouse
 * input outside it in every browser, and a phone has no screen there.
 */
export default class Gesture {
  /** Page the gesture is performed on */
  readonly #page: Page;

  /** Mouse or finger that performs the gesture */
  readonly #input: PointerInput;

  /** Horizontal position of the pointer (px) */
  #x = 0;

  /** Vertical position of the pointer (px) */
  #y = 0;

  /**
   * @param page - Page the gesture is performed on
   * @param input - Mouse or finger that performs the gesture
   */
  constructor(page: Page, input: PointerInput) {
    this.#page = page;
    this.#input = input;
  }

  /**
   * Put the pointer down on an element
   * @param target - Element to press
   * @param position - Point relative to the top left corner of the element;
   * its center when omitted
   */
  async start(target: Locator, position?: { x: number; y: number }): Promise<void> {
    const box = await target.boundingBox();

    if (box === null) {
      throw new Error('The gesture target is not rendered.');
    }

    this.#x = box.x + (position?.x ?? box.width / 2);
    this.#y = box.y + (position?.y ?? box.height / 2);

    this.#assertInViewport(this.#x, this.#y);

    await this.#input.press(this.#x, this.#y);
  }

  /**
   * Move the pointer by an offset in equal steps
   * @param deltaX - Horizontal offset (px)
   * @param deltaY - Vertical offset (px), positive downwards
   * @param options - Number of steps and pause after each
   */
  async moveBy(deltaX: number, deltaY: number, options: GestureMoveOptions = {}): Promise<void> {
    const { steps = 10, stepDelay = 0 } = options;
    const targetX = this.#x + deltaX;
    const targetY = this.#y + deltaY;

    this.#assertInViewport(targetX, targetY);

    const startX = this.#x;
    const startY = this.#y;

    for (let step = 1; step <= steps; step++) {
      this.#x = startX + (deltaX * step) / steps;
      this.#y = startY + (deltaY * step) / steps;

      await this.#input.move(this.#x, this.#y);

      if (stepDelay > 0) {
        await this.#page.waitForTimeout(stepDelay);
      }
    }
  }

  /**
   * Keep the pointer still. Velocity is measured over the last 100 ms of
   * movement, so holding still longer than that releases with no velocity.
   * @param duration - How long to hold (ms)
   */
  async hold(duration: number): Promise<void> {
    await this.#page.waitForTimeout(duration);
  }

  /**
   * Lift the pointer
   */
  async end(): Promise<void> {
    await this.#input.release();
  }

  /**
   * Press and release at the center of an element without moving
   * @param target - Element to tap
   */
  async tap(target: Locator): Promise<void> {
    await this.start(target);
    await this.end();
  }

  /**
   * Fail early when a movement would take the pointer out of the viewport
   * @param x - Horizontal target (px)
   * @param y - Vertical target (px)
   */
  #assertInViewport(x: number, y: number): void {
    const viewport = this.#page.viewportSize();

    if (viewport === null) {
      throw new Error('The page has no fixed viewport.');
    }

    if (x < 0 || y < 0 || x >= viewport.width || y >= viewport.height) {
      throw new Error(`The gesture would leave the viewport at (${x}, ${y}).`);
    }
  }
}
