import type { Mouse } from '@playwright/test';
import type PointerInput from './pointer-input';

/**
 * The primary mouse button. Every browser in Playwright dispatches real mouse
 * input, which reaches the page as pointer events of type `mouse`.
 */
export default class MouseInput implements PointerInput {
  /** Mouse of the page under test */
  readonly #mouse: Mouse;

  /**
   * @param mouse - Mouse of the page under test
   */
  constructor(mouse: Mouse) {
    this.#mouse = mouse;
  }

  async press(x: number, y: number): Promise<void> {
    await this.#mouse.move(x, y);
    await this.#mouse.down();
  }

  async move(x: number, y: number): Promise<void> {
    await this.#mouse.move(x, y);
  }

  async release(): Promise<void> {
    await this.#mouse.up();
  }

  async moveAndRelease(x: number, y: number): Promise<void> {
    await this.#mouse.move(x, y);
    await this.#mouse.up();
  }
}
