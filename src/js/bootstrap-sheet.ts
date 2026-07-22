import { NAME, EVENT, CLASS_NAME, SELECTOR, Default, DefaultType } from './constants';
import type { BootstrapSheetOptions, ResolvedSheetOptions } from './constants';

import {
  resolveElement,
  extractTargetSelector,
  clamp,
  extractDataAttributes,
  validateConfigTypes,
  getTranslateY,
  springParameters,
} from './utils';

import Backdrop from './backdrop';
import ScrollBarHelper from './scrollbar';
import FocusTrap, { InertManager } from './focus-trap';
import SpringAnimator from './spring-animator';
import DragController from './drag-controller';

export type { BootstrapSheetOptions } from './constants';

const INSTANCES = new WeakMap<HTMLElement, BootstrapSheet>();

/**
 * Bound event handlers kept for removal
 */
interface SheetHandlers {
  escape: ((event: KeyboardEvent) => void) | null;
  dismiss: (() => void) | null;
}

/**
 * @class BootstrapSheet - A touch-friendly bottom sheet component for Bootstrap 5
 * @version 0.3.0
 * @author Sergey Mironov <sergeymironov@protonmail.com>
 * @license MIT (https://github.com/mironovsergey/bootstrap-sheet/blob/main/LICENSE)
 */
class BootstrapSheet {
  // ==================== Core elements ====================

  /** Sheet element */
  #element: HTMLElement;

  /** Resolved configuration object */
  #config: ResolvedSheetOptions;

  /** Backdrop helper instance */
  #backdrop: Backdrop | null = null;

  /** Body scrollbar compensation helper */
  #scrollBar = new ScrollBarHelper();

  /** Drag gesture controller (attached while shown) */
  #dragController: DragController | null = null;

  // ==================== Component state ====================

  /** State flags */
  #state = {
    /** Whether the sheet is currently shown */
    isShown: false,

    /** Whether a show/hide transition is in progress */
    isTransitioning: false,
  };

  /** Whether the component has been disposed */
  #disposed = false;

  /** Total height of the sheet, measured when showing */
  #sheetHeight = 0;

  // ==================== Animation ====================

  /** Spring animation driver */
  #springAnimator = new SpringAnimator();

  // ==================== Event handlers ====================

  /** References to bound event handlers for easy removal */
  #handlers: SheetHandlers = {
    escape: null,
    dismiss: null,
  };

  // ==================== Focus and inert management ====================

  /** Focus trap helper */
  #focusTrap: FocusTrap;

  /** Inert manager for content outside the sheet */
  #inert = new InertManager();

  /**
   * Creates a new BootstrapSheet instance.
   * If an instance already exists for the given element, it is returned instead.
   * @param element - The sheet element or a selector string
   * @param config - Configuration options to override defaults
   * @throws {Error} If the element is not found or invalid
   * @throws {TypeError} If config has invalid property types
   */
  constructor(element: HTMLElement | string, config: BootstrapSheetOptions = {}) {
    const resolvedElement = resolveElement(element);

    if (!(resolvedElement instanceof HTMLElement)) {
      throw new Error(`${NAME}: element not found`);
    }

    // Assign fields before the duplicate check so every constructor path
    // definitely initializes them; the placeholder config is replaced below.
    this.#element = resolvedElement;
    this.#config = Default;
    this.#focusTrap = new FocusTrap({ trapElement: resolvedElement });

    // Prevent duplicate instances
    const existing = INSTANCES.get(resolvedElement);

    if (existing) {
      return existing;
    }

    // Merge configuration: defaults < data-attributes < config
    const dataConfig = extractDataAttributes(resolvedElement);
    const mergedConfig: Record<string, unknown> = { ...Default, ...dataConfig, ...config };

    validateConfigTypes<ResolvedSheetOptions>(NAME, mergedConfig, DefaultType);

    this.#config = mergedConfig;

    this.#setupAccessibility();

    INSTANCES.set(resolvedElement, this);
  }

  // ==================== Public API ====================

  /**
   * Get the component name
   * @returns The component name
   */
  static get NAME(): string {
    return NAME;
  }

  /**
   * Get the default configuration
   * @returns The default configuration
   */
  static get Default(): ResolvedSheetOptions {
    return Default;
  }

  /**
   * Get an instance associated with an element
   * @param element - The element or selector
   * @returns Instance or null
   */
  static getInstance(element: HTMLElement | string): BootstrapSheet | null {
    const resolvedElement = resolveElement(element);

    return resolvedElement instanceof HTMLElement ? (INSTANCES.get(resolvedElement) ?? null) : null;
  }

  /**
   * Get or create an instance
   * @param element - The element or selector
   * @param config - Configuration options
   * @throws {Error} If element parameter is invalid
   * @throws {TypeError} If config has invalid property types
   * @returns The instance
   */
  static getOrCreateInstance(
    element: HTMLElement | string,
    config: BootstrapSheetOptions = {},
  ): BootstrapSheet {
    return this.getInstance(element) ?? new this(element, config);
  }

  /**
   * Check if the sheet is currently shown
   * @returns True if shown, false otherwise
   */
  get isShown(): boolean {
    return this.#state.isShown;
  }

  /**
   * Check if the sheet is currently transitioning
   * @returns True if transitioning, false otherwise
   */
  get isTransitioning(): boolean {
    return this.#state.isTransitioning;
  }

  /**
   * Show the sheet
   * @fires EVENT.SHOW
   * @fires EVENT.SHOWN
   * @see {@link hide}
   * @see {@link toggle}
   */
  show(): void {
    if (this.#disposed) {
      return;
    }

    if (this.#state.isShown || this.#state.isTransitioning) {
      return;
    }

    const showEvent = this.#triggerEvent(EVENT.SHOW);

    if (showEvent.defaultPrevented) {
      return;
    }

    this.#prepareShow();
    this.#executeShow();
  }

  /**
   * Hide the sheet
   * @fires EVENT.HIDE
   * @fires EVENT.HIDDEN
   * @see {@link show}
   * @see {@link toggle}
   */
  hide(): void {
    if (this.#disposed) {
      return;
    }

    if (!this.#state.isShown || this.#state.isTransitioning) {
      return;
    }

    const hideEvent = this.#triggerEvent(EVENT.HIDE);

    if (hideEvent.defaultPrevented) {
      return;
    }

    this.#prepareHide();
    this.#executeHide();
  }

  /**
   * Toggle the sheet visibility
   */
  toggle(): void {
    if (this.#state.isShown) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Dispose the component and clean up resources
   * @example
   * const sheet = new BootstrapSheet('#mySheet');
   * // Later, when you want to remove the sheet
   * sheet.dispose();
   */
  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#cleanup();
    INSTANCES.delete(this.#element);
    this.#disposed = true;
  }

  // ==================== Private Methods: Setup ====================

  /**
   * Set up accessibility attributes on the sheet element
   */
  #setupAccessibility(): void {
    this.#element.setAttribute('role', 'dialog');
    this.#element.setAttribute('aria-modal', 'true');
    this.#element.setAttribute('tabindex', '-1');
  }

  // ==================== Private Methods: Show ====================

  /**
   * Prepare sheet state for showing
   */
  #prepareShow(): void {
    this.#state.isShown = true;
    this.#state.isTransitioning = true;
    this.#focusTrap.capture();
    this.#sheetHeight =
      this.#element.offsetHeight || this.#element.getBoundingClientRect().height || 0;
  }

  /**
   * Execute show animation and setup
   */
  #executeShow(): void {
    if (this.#config.backdrop) {
      this.#createBackdrop();
    }

    this.#inert.apply([this.#backdrop?.element, this.#element]);
    this.#scrollBar.hide();

    this.#element.classList.add(CLASS_NAME.SHOWING);

    this.#attachEventHandlers();

    if (this.#config.focus) {
      this.#focusTrap.activate();
    }

    this.#animateSpring(0, 0, () => this.#finalizeShow());
  }

  /**
   * Finalize show animation
   */
  #finalizeShow(): void {
    this.#element.classList.remove(CLASS_NAME.SHOWING);
    this.#element.classList.add(CLASS_NAME.SHOW);
    this.#state.isTransitioning = false;

    if (this.#config.focus) {
      this.#focusTrap.focusInitial();
    }

    this.#triggerEvent(EVENT.SHOWN);
  }

  // ==================== Private Methods: Hide ====================

  /**
   * Prepare sheet state for hiding
   */
  #prepareHide(): void {
    this.#state.isShown = false;
    this.#state.isTransitioning = true;

    if (this.#dragController?.isDragging) {
      this.#dragController.abort();
      this.#cancelAnimations();
    }

    if (this.#config.focus) {
      this.#focusTrap.deactivate();
    }

    this.#element.classList.add(CLASS_NAME.HIDING);
    this.#element.classList.remove(CLASS_NAME.SHOW);
  }

  /**
   * Execute hide animation and cleanup
   */
  #executeHide(): void {
    this.#detachEventHandlers();
    this.#cancelAnimations();
    this.#inert.remove();

    this.#animateSpring(this.#sheetHeight, 0, () => this.#finalizeHide());
  }

  /**
   * Finalize hide animation
   */
  #finalizeHide(): void {
    this.#element.classList.remove(CLASS_NAME.HIDING);
    this.#element.style.transform = '';
    this.#state.isTransitioning = false;

    this.#removeBackdrop();
    this.#scrollBar.reset();
    this.#focusTrap.restore();
    this.#triggerEvent(EVENT.HIDDEN);
  }

  // ==================== Private Methods: Backdrop ====================

  /**
   * Create and show the backdrop via the Backdrop helper
   */
  #createBackdrop(): void {
    const isStatic = this.#config.backdrop === 'static';

    this.#backdrop = new Backdrop({
      isStatic,
      onClick: () => (isStatic ? this.#shakeSheet() : this.hide()),
    });

    this.#backdrop.show();
  }

  /**
   * Remove backdrop element from DOM
   */
  #removeBackdrop(): void {
    if (this.#backdrop) {
      this.#backdrop.dispose();
      this.#backdrop = null;
    }
  }

  /**
   * Update backdrop opacity during drag
   * @param ratio - Opacity ratio (0 to 1)
   */
  #updateBackdropOpacity(ratio: number): void {
    this.#backdrop?.setOpacity(ratio);
  }

  // ==================== Private Methods: Event Handlers ====================

  /**
   * Attach all necessary event handlers
   */
  #attachEventHandlers(): void {
    this.#attachEscapeHandler();
    this.#attachDismissHandlers();

    if (this.#config.gestures) {
      this.#attachGestureHandlers();
    }
  }

  /**
   * Detach all event handlers
   */
  #detachEventHandlers(): void {
    this.#detachEscapeHandler();
    this.#detachDismissHandlers();

    if (this.#config.gestures) {
      this.#detachGestureHandlers();
    }
  }

  /**
   * Attach Escape key handler to close the sheet
   */
  #attachEscapeHandler(): void {
    if (!this.#config.keyboard) {
      return;
    }

    this.#handlers.escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.#config.backdrop === 'static') {
          this.#shakeSheet();
        } else {
          this.hide();
        }
      }
    };

    document.addEventListener('keydown', this.#handlers.escape);
  }

  /**
   * Detach Escape key handler
   */
  #detachEscapeHandler(): void {
    if (this.#handlers.escape) {
      document.removeEventListener('keydown', this.#handlers.escape);
      this.#handlers.escape = null;
    }
  }

  /**
   * Attach click handlers to dismiss buttons within the sheet
   */
  #attachDismissHandlers(): void {
    const dismissButtons = this.#element.querySelectorAll(SELECTOR.DATA_DISMISS);
    const dismissHandler = (): void => this.hide();

    this.#handlers.dismiss = dismissHandler;

    dismissButtons.forEach((button) => {
      button.addEventListener('click', dismissHandler);
    });
  }

  /**
   * Detach click handlers from dismiss buttons
   */
  #detachDismissHandlers(): void {
    const dismissHandler = this.#handlers.dismiss;

    if (!dismissHandler) {
      return;
    }

    const dismissButtons = this.#element.querySelectorAll(SELECTOR.DATA_DISMISS);

    dismissButtons.forEach((button) => {
      button.removeEventListener('click', dismissHandler);
    });

    this.#handlers.dismiss = null;
  }

  /**
   * Animate shake effect for static backdrop via Web Animations API.
   * Uses composite: 'add' so the shake overlays the spring transform without interfering.
   */
  #shakeSheet(): void {
    if (typeof this.#element.animate !== 'function') {
      return;
    }

    this.#element.animate(
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-4px)' },
        { transform: 'translateY(4px)' },
        { transform: 'translateY(-4px)' },
        { transform: 'translateY(4px)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: 600, easing: 'ease-in-out', composite: 'add' },
    );
  }

  // ==================== Private Methods: Gestures ====================

  /**
   * Create and attach the drag controller for the sheet's drag handle.
   * The controller owns pointer input and gesture physics; DOM side effects
   * (transform, backdrop, class names, events, animations) happen here.
   */
  #attachGestureHandlers(): void {
    const dragHandle = this.#element.querySelector<HTMLElement>(SELECTOR.DRAG_HANDLE);

    if (!dragHandle) {
      return;
    }

    this.#dragController = new DragController({
      handle: dragHandle,
      getPosition: () => getTranslateY(this.#element),
      getSheetHeight: () => this.#sheetHeight,
      isEnabled: () => this.#state.isShown,
      onDragStart: () => this.#element.classList.add(CLASS_NAME.DRAGGING),
      onDragEnd: () => this.#element.classList.remove(CLASS_NAME.DRAGGING),
      onTakeover: () => this.#springAnimator.cancel(),
      onMove: ({ adjustedY, deltaY, ratio, velocity }) => {
        this.#element.style.transform = `translateY(${adjustedY}px)`;

        this.#updateBackdropOpacity(clamp(ratio, 0, 1));

        this.#triggerEvent(EVENT.SLIDE, { velocity, adjustedY, deltaY, ratio });
      },
      onRelease: ({ shouldDismiss, velocity }) => {
        if (shouldDismiss) {
          this.#animateSpring(this.#sheetHeight, velocity, () => this.hide());
        } else {
          this.#animateSpring(0, velocity);
        }
      },
    });

    this.#dragController.attach();
  }

  /**
   * Abort any active drag and detach the drag controller
   */
  #detachGestureHandlers(): void {
    if (this.#dragController) {
      this.#dragController.abort();
      this.#dragController.detach();
      this.#dragController = null;
    }
  }

  // ==================== Private Methods: Spring Animation ====================

  /**
   * Resolve spring parameters from config
   * @returns Physical spring constants
   */
  #resolveSpringParams() {
    return springParameters(this.#config.springDampingRatio, this.#config.springResponse);
  }

  /**
   * Animate sheet to target position using the spring driver.
   * The driver produces positions; applying them to the DOM (transform,
   * backdrop opacity, class names) happens here.
   * @param targetY - Target translateY position
   * @param initialVelocity - Velocity at animation start (px/s)
   * @param onComplete - Callback when animation settles
   */
  #animateSpring(targetY: number, initialVelocity = 0, onComplete?: () => void): void {
    this.#cancelAnimations();

    this.#element.classList.add(CLASS_NAME.ANIMATING);

    this.#springAnimator.start({
      from: getTranslateY(this.#element),
      to: targetY,
      initialVelocity,
      params: this.#resolveSpringParams(),
      onFrame: (position) => {
        this.#element.style.transform = `translateY(${position}px)`;
        this.#updateBackdropOpacity(clamp(this.#positionToRatio(position), 0, 1));
      },
      onSettle: () => {
        // Snap to exact target and clean up
        this.#element.style.transform = `translateY(${targetY}px)`;
        this.#element.classList.remove(CLASS_NAME.ANIMATING);

        onComplete?.();
      },
    });
  }

  // ==================== Private Methods: Utilities ====================

  /**
   * Convert absolute translateY position to a backdrop opacity ratio.
   * Returns 1 (fully opaque) when sheet is fully open (position = 0),
   * and 0 (transparent) when fully closed (position = sheetHeight).
   * @param position - Current translateY in pixels
   * @returns Ratio in range [0, 1]
   */
  #positionToRatio(position: number): number {
    return 1 - (this.#sheetHeight ? position / this.#sheetHeight : 0);
  }

  /**
   * Cancel the spring animation
   */
  #cancelAnimations(): void {
    this.#springAnimator.cancel();

    this.#element.classList.remove(CLASS_NAME.ANIMATING);
  }

  /**
   * Clean up component state and resources
   */
  #cleanup(): void {
    // Reset state
    this.#state.isShown = false;
    this.#state.isTransitioning = false;

    this.#scrollBar.reset();
    this.#removeBackdrop();
    this.#detachEventHandlers();
    this.#cancelAnimations();
    this.#focusTrap.deactivate();
    this.#inert.remove();
  }

  /**
   * Trigger custom event on the sheet element
   * @param name - Event name
   * @param detail - Event detail object
   * @returns The triggered event
   */
  #triggerEvent(name: string, detail: Record<string, unknown> = {}): CustomEvent {
    const event = new CustomEvent(name, {
      detail,
      bubbles: true,
      cancelable: true,
    });

    this.#element.dispatchEvent(event);

    return event;
  }
}

// ==================== Global Initialization ====================

/**
 * Global click handler to toggle sheets via data attributes
 */
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const trigger = event.target.closest(SELECTOR.DATA_TOGGLE);

  if (!trigger) {
    return;
  }

  event.preventDefault();

  const targetSelector = extractTargetSelector(trigger);

  if (!targetSelector) {
    return;
  }

  const sheetElement = document.querySelector(targetSelector);

  if (!(sheetElement instanceof HTMLElement)) {
    return;
  }

  let sheetInstance = BootstrapSheet.getInstance(sheetElement);

  if (!sheetInstance) {
    const sheetConfig = extractDataAttributes(sheetElement);
    const triggerConfig = extractDataAttributes(trigger);
    const mergedConfig: Record<string, unknown> = { ...sheetConfig, ...triggerConfig };

    // Runtime-validates the parsed attributes and narrows them to typed options
    validateConfigTypes<BootstrapSheetOptions>(NAME, mergedConfig, DefaultType);

    sheetInstance = new BootstrapSheet(sheetElement, mergedConfig);
  }

  sheetInstance.toggle();
});

// ==================== Export ====================

export default BootstrapSheet;

declare global {
  interface Window {
    BootstrapSheet: typeof BootstrapSheet;
  }
}

if (typeof window !== 'undefined') {
  window.BootstrapSheet = BootstrapSheet;
}
