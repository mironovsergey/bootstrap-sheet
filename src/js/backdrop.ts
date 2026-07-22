import { CLASS_NAME } from './constants';
import { clamp } from './utils';

/**
 * Configuration for the backdrop helper
 */
export interface BackdropConfig {
  /** Whether the backdrop is static (clicking it does not close the sheet) */
  isStatic: boolean;

  /** Invoked when the backdrop is clicked */
  onClick: () => void;
}

/**
 * Backdrop helper for BootstrapSheet.
 *
 * Owns the backdrop DOM element lifecycle: creation, opacity updates during
 * drag and animation, and removal. Behavioral decisions (hide vs shake on
 * click) stay with the orchestrator via the `onClick` callback.
 */
export default class Backdrop {
  /** Backdrop DOM element (null when not shown) */
  #element: HTMLElement | null = null;

  /** Configuration object */
  #config: BackdropConfig;

  constructor(config: BackdropConfig) {
    this.#config = config;
  }

  /**
   * Get the backdrop DOM element
   * @returns The element, or null when the backdrop is not shown
   */
  get element(): HTMLElement | null {
    return this.#element;
  }

  /**
   * Create the backdrop element and append it to the document body.
   * Does nothing if the backdrop is already shown.
   */
  show(): void {
    if (this.#element) {
      return;
    }

    const backdrop = document.createElement('div');

    backdrop.className = CLASS_NAME.BACKDROP;
    backdrop.style.opacity = '0';

    if (this.#config.isStatic) {
      backdrop.dataset.bsStatic = '';
    }

    backdrop.addEventListener('click', () => this.#config.onClick());

    document.body.appendChild(backdrop);

    this.#element = backdrop;
  }

  /**
   * Update backdrop opacity
   * @param ratio - Opacity ratio (clamped to [0, 1])
   */
  setOpacity(ratio: number): void {
    if (!this.#element) {
      return;
    }

    this.#element.style.opacity = String(clamp(ratio, 0, 1));
  }

  /**
   * Remove the backdrop element from the DOM
   */
  dispose(): void {
    if (this.#element) {
      this.#element.remove();
      this.#element = null;
    }
  }
}
