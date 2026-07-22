import { FOCUSABLE_SELECTOR } from './constants';

const SUPPORTS_INERT = 'inert' in HTMLElement.prototype;

/**
 * Previous accessibility state of a node hidden from assistive technology
 */
type InertState = { kind: 'inert'; value: boolean } | { kind: 'aria-hidden'; value: string | null };

/**
 * Configuration for the focus trap helper
 */
export interface FocusTrapConfig {
  /** Element that focus is trapped within */
  trapElement: HTMLElement;
}

/**
 * Focus trap helper for BootstrapSheet.
 *
 * Keeps keyboard focus inside the trap element while it is active: cycles
 * Tab/Shift+Tab between the first and last focusable descendants, tracks
 * DOM changes that affect focusability via a MutationObserver, and restores
 * focus to the previously focused element when the sheet closes.
 */
export default class FocusTrap {
  /** Element that focus is trapped within */
  #trapElement: HTMLElement;

  /** Previously focused element before the trap was activated */
  #previousElement: Element | null = null;

  /** Focusable elements within the trap element */
  #focusableElements: HTMLElement[] | null = null;

  /** Observer for changes affecting focusable elements */
  #mutationObserver: MutationObserver | null = null;

  /** Bound keydown handler (null when inactive) */
  #keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(config: FocusTrapConfig) {
    this.#trapElement = config.trapElement;
  }

  /**
   * Remember the currently focused element so it can be restored later
   */
  capture(): void {
    this.#previousElement = document.activeElement;
  }

  /**
   * Start trapping focus: track focusable elements and cycle Tab keys
   */
  activate(): void {
    this.#updateFocusableElements();

    this.#keydownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.#handleTabKey(event);
      }
    };

    this.#trapElement.addEventListener('keydown', this.#keydownHandler);

    this.#observeFocusableChanges();
  }

  /**
   * Stop trapping focus: detach the keydown handler and the observer
   */
  deactivate(): void {
    if (this.#keydownHandler) {
      this.#trapElement.removeEventListener('keydown', this.#keydownHandler);
      this.#keydownHandler = null;
    }

    if (this.#mutationObserver) {
      this.#mutationObserver.disconnect();
      this.#mutationObserver = null;
    }
  }

  /**
   * Focus the first focusable element, or the trap element itself
   */
  focusInitial(): void {
    this.#updateFocusableElements();

    if (this.#focusableElements?.length) {
      this.#focusableElements[0].focus();
    } else {
      this.#trapElement.focus();
    }
  }

  /**
   * Restore focus to the element that was focused before activation
   */
  restore(): void {
    if (this.#previousElement instanceof HTMLElement) {
      this.#previousElement.focus();
    }
  }

  /**
   * Update the list of focusable elements within the trap element
   */
  #updateFocusableElements(): void {
    const elements = this.#trapElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    this.#focusableElements = Array.from(elements).filter(
      (element) =>
        element.offsetParent !== null &&
        !element.hasAttribute('inert') &&
        element.getAttribute('aria-hidden') !== 'true',
    );
  }

  /**
   * Handle Tab key to cycle focus within the trap element
   * @param event - The keydown event
   */
  #handleTabKey(event: KeyboardEvent): void {
    const focusableElements = this.#focusableElements;

    if (!focusableElements?.length) {
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Observe DOM changes that affect focusable elements
   */
  #observeFocusableChanges(): void {
    if (this.#mutationObserver) {
      return;
    }

    this.#mutationObserver = new MutationObserver(() => {
      this.#updateFocusableElements();
    });

    this.#mutationObserver.observe(this.#trapElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'hidden', 'aria-hidden'],
    });
  }
}

/**
 * Inert manager for BootstrapSheet.
 *
 * Hides everything outside the sheet from assistive technology while the
 * sheet is open. Uses the native `inert` attribute when supported, falling
 * back to `aria-hidden` otherwise, and restores the previous state on remove.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert}
 */
export class InertManager {
  /** Map of hidden nodes and their previous accessibility state */
  #inertedNodes = new Map<Element, InertState>();

  /**
   * Apply inert (or aria-hidden) to all body children except the given ones
   * @param excluded - Elements to leave interactive (e.g. sheet and backdrop)
   */
  apply(excluded: readonly (Element | null | undefined)[]): void {
    const bodyChildren = Array.from(document.body.children);

    for (const node of bodyChildren) {
      if (excluded.includes(node)) {
        continue;
      }

      if (SUPPORTS_INERT && node instanceof HTMLElement) {
        this.#inertedNodes.set(node, { kind: 'inert', value: node.inert });
        node.inert = true;
      } else {
        this.#inertedNodes.set(node, {
          kind: 'aria-hidden',
          value: node.getAttribute('aria-hidden'),
        });
        node.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Restore the previous accessibility state of all hidden nodes
   */
  remove(): void {
    if (this.#inertedNodes.size === 0) {
      return;
    }

    for (const [node, previousState] of this.#inertedNodes.entries()) {
      if (previousState.kind === 'inert') {
        if (node instanceof HTMLElement) {
          node.inert = previousState.value;
        }
      } else if (previousState.value === null) {
        node.removeAttribute('aria-hidden');
      } else {
        node.setAttribute('aria-hidden', previousState.value);
      }
    }

    this.#inertedNodes.clear();
  }
}
