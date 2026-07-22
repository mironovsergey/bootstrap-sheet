import { NAME, EVENT, CLASS_NAME, SELECTOR, Default, DefaultType } from './constants';

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

const INSTANCES = new WeakMap();

/**
 * @class BootstrapSheet - A touch-friendly bottom sheet component for Bootstrap 5
 * @version 0.2.0
 * @author Sergey Mironov <sergeymironov@protonmail.com>
 * @license MIT (https://github.com/mironovsergey/bootstrap-sheet/blob/main/LICENSE)
 */
class BootstrapSheet {
  // ==================== Core elements ====================

  /* @type {HTMLElement} Sheet element */
  #element;

  /* @type {Object} Configuration object */
  #config;

  /* @type {Backdrop|null} Backdrop helper instance */
  #backdrop = null;

  /* @type {ScrollBarHelper} Body scrollbar compensation helper */
  #scrollBar = new ScrollBarHelper();

  /* @type {DragController|null} Drag gesture controller (attached while shown) */
  #dragController = null;

  // ==================== Component state ====================

  /* @type {Object} State flags */
  #state = {
    /* @type {boolean} Whether the sheet is currently shown */
    isShown: false,

    /* @type {boolean} Whether a show/hide transition is in progress */
    isTransitioning: false,
  };

  /* @type {number} Total height of the sheet, measured when showing */
  #sheetHeight = 0;

  // ==================== Animation ====================

  /* @type {SpringAnimator} Spring animation driver */
  #springAnimator = new SpringAnimator();

  // ==================== Event handlers ====================

  /* @type {Object} References to bound event handlers for easy removal */
  #handlers = {
    escape: null,
    dismiss: null,
  };

  // ==================== Focus and inert management ====================

  /* @type {FocusTrap} Focus trap helper */
  #focusTrap;

  /* @type {InertManager} Inert manager for content outside the sheet */
  #inert = new InertManager();

  /**
   * Creates a new BootstrapSheet instance.
   * If an instance already exists for the given element, it is returned instead.
   * @param {HTMLElement|string} element - The sheet element or a selector string
   * @param {Object} [config={}] - Configuration options to override defaults
   * @throws {Error} If the element is not found or invalid
   * @throws {TypeError} If config has invalid property types
   */
  constructor(element, config = {}) {
    const resolvedElement = resolveElement(element);

    if (!resolvedElement) {
      throw new Error(`${NAME}: element not found`);
    }

    // Prevent duplicate instances
    if (INSTANCES.has(resolvedElement)) {
      return INSTANCES.get(resolvedElement);
    }

    this.#element = resolvedElement;

    // Merge configuration: defaults < data-attributes < config
    const dataConfig = extractDataAttributes(this.#element);
    this.#config = { ...Default, ...dataConfig, ...config };

    validateConfigTypes(NAME, this.#config, DefaultType);

    this.#focusTrap = new FocusTrap({ trapElement: this.#element });

    this.#setupAccessibility();

    INSTANCES.set(this.#element, this);
  }

  // ==================== Public API ====================

  /**
   * Get the component name
   * @returns {string} The component name
   */
  static get NAME() {
    return NAME;
  }

  /**
   * Get the default configuration
   * @returns {Object} The default configuration
   */
  static get Default() {
    return Default;
  }

  /**
   * Get an instance associated with an element
   * @param {HTMLElement|string} element - The element or selector
   * @throws {Error} If element parameter is invalid
   * @returns {BootstrapSheet|null} Instance or null
   */
  static getInstance(element) {
    const resolvedElement = resolveElement(element);
    return resolvedElement ? INSTANCES.get(resolvedElement) || null : null;
  }

  /**
   * Get or create an instance
   * @param {HTMLElement|string} element - The element or selector
   * @param {Object} [config={}] - Configuration options
   * @throws {Error} If element parameter is invalid
   * @throws {TypeError} If config has invalid property types
   * @returns {BootstrapSheet} The instance
   */
  static getOrCreateInstance(element, config = {}) {
    return this.getInstance(element) || new this(element, config);
  }

  /**
   * Check if the sheet is currently shown
   * @returns {boolean} True if shown, false otherwise
   */
  get isShown() {
    return this.#state.isShown;
  }

  /**
   * Check if the sheet is currently transitioning
   * @returns {boolean} True if transitioning, false otherwise
   */
  get isTransitioning() {
    return this.#state.isTransitioning;
  }

  /**
   * Show the sheet
   * @fires EVENT.SHOW
   * @fires EVENT.SHOWN
   * @see {@link hide}
   * @see {@link toggle}
   * @returns {void}
   */
  show() {
    if (!this.#element) {
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
   * @returns {void}
   */
  hide() {
    if (!this.#element) {
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
   * @returns {void}
   */
  toggle() {
    this.#state.isShown ? this.hide() : this.show();
  }

  /**
   * Dispose the component and clean up resources
   * @returns {void}
   * @example
   * const sheet = new BootstrapSheet('#mySheet');
   * // Later, when you want to remove the sheet
   * sheet.dispose();
   */
  dispose() {
    if (!this.#element) {
      return;
    }

    this.#cleanup();
    INSTANCES.delete(this.#element);
    this.#element = null;
    this.#config = null;
  }

  // ==================== Private Methods: Setup ====================

  /**
   * Set up accessibility attributes on the sheet element
   * @returns {void}
   * @private
   */
  #setupAccessibility() {
    this.#element.setAttribute('role', 'dialog');
    this.#element.setAttribute('aria-modal', 'true');
    this.#element.setAttribute('tabindex', '-1');
  }

  // ==================== Private Methods: Show ====================

  /**
   * Prepare sheet state for showing
   * @returns {void}
   * @private
   */
  #prepareShow() {
    this.#state.isShown = true;
    this.#state.isTransitioning = true;
    this.#focusTrap.capture();
    this.#sheetHeight =
      this.#element.offsetHeight || this.#element.getBoundingClientRect().height || 0;
  }

  /**
   * Execute show animation and setup
   * @returns {void}
   * @private
   */
  #executeShow() {
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
   * @returns {void}
   * @private
   */
  #finalizeShow() {
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
   * @returns {void}
   * @private
   */
  #prepareHide() {
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
   * @returns {void}
   * @private
   */
  #executeHide() {
    this.#detachEventHandlers();
    this.#cancelAnimations();
    this.#inert.remove();

    this.#animateSpring(this.#sheetHeight, 0, () => this.#finalizeHide());
  }

  /**
   * Finalize hide animation
   * @returns {void}
   * @private
   */
  #finalizeHide() {
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
   * @returns {void}
   * @private
   */
  #createBackdrop() {
    const isStatic = this.#config.backdrop === 'static';

    this.#backdrop = new Backdrop({
      isStatic,
      onClick: () => (isStatic ? this.#shakeSheet() : this.hide()),
    });

    this.#backdrop.show();
  }

  /**
   * Remove backdrop element from DOM
   * @returns {void}
   * @private
   */
  #removeBackdrop() {
    if (this.#backdrop) {
      this.#backdrop.dispose();
      this.#backdrop = null;
    }
  }

  /**
   * Update backdrop opacity during drag
   * @param {number} ratio - Opacity ratio (0 to 1)
   * @returns {void}
   * @private
   */
  #updateBackdropOpacity(ratio) {
    this.#backdrop?.setOpacity(ratio);
  }

  // ==================== Private Methods: Event Handlers ====================

  /**
   * Attach all necessary event handlers
   * @returns {void}
   * @private
   */
  #attachEventHandlers() {
    this.#attachEscapeHandler();
    this.#attachDismissHandlers();

    if (this.#config.gestures) {
      this.#attachGestureHandlers();
    }
  }

  /**
   * Detach all event handlers
   * @returns {void}
   * @private
   */
  #detachEventHandlers() {
    this.#detachEscapeHandler();
    this.#detachDismissHandlers();

    if (this.#config.gestures) {
      this.#detachGestureHandlers();
    }
  }

  /**
   * Attach Escape key handler to close the sheet
   * @returns {void}
   * @private
   */
  #attachEscapeHandler() {
    if (!this.#config.keyboard) {
      return;
    }

    this.#handlers.escape = (event) => {
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
   * @returns {void}
   * @private
   */
  #detachEscapeHandler() {
    if (this.#handlers.escape) {
      document.removeEventListener('keydown', this.#handlers.escape);
      this.#handlers.escape = null;
    }
  }

  /**
   * Attach click handlers to dismiss buttons within the sheet
   * @returns {void}
   * @private
   */
  #attachDismissHandlers() {
    const dismissButtons = this.#element.querySelectorAll(SELECTOR.DATA_DISMISS);

    this.#handlers.dismiss = () => this.hide();

    dismissButtons.forEach((button) => {
      button.addEventListener('click', this.#handlers.dismiss);
    });
  }

  /**
   * Detach click handlers from dismiss buttons
   * @returns {void}
   * @private
   */
  #detachDismissHandlers() {
    if (!this.#handlers.dismiss) {
      return;
    }

    const dismissButtons = this.#element.querySelectorAll(SELECTOR.DATA_DISMISS);

    dismissButtons.forEach((button) => {
      button.removeEventListener('click', this.#handlers.dismiss);
    });

    this.#handlers.dismiss = null;
  }

  /**
   * Animate shake effect for static backdrop via Web Animations API.
   * Uses composite: 'add' so the shake overlays the spring transform without interfering.
   * @returns {void}
   * @private
   */
  #shakeSheet() {
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
   * @returns {void}
   * @private
   */
  #attachGestureHandlers() {
    const dragHandle = this.#element.querySelector(SELECTOR.DRAG_HANDLE);

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
   * @returns {void}
   * @private
   */
  #detachGestureHandlers() {
    if (this.#dragController) {
      this.#dragController.abort();
      this.#dragController.detach();
      this.#dragController = null;
    }
  }

  // ==================== Private Methods: Spring Animation ====================

  /**
   * Resolve spring parameters from config.
   * @returns {{ stiffness: number, damping: number, mass: number }} Spring constants
   * @private
   */
  #resolveSpringParams() {
    return springParameters(this.#config.springDampingRatio, this.#config.springResponse);
  }

  /**
   * Animate sheet to target position using the spring driver.
   * The driver produces positions; applying them to the DOM (transform,
   * backdrop opacity, class names) happens here.
   * @param {number} targetY - Target translateY position
   * @param {number} [initialVelocity=0] - Velocity at animation start (px/s)
   * @param {Function} [onComplete] - Callback when animation settles
   * @returns {void}
   * @private
   */
  #animateSpring(targetY, initialVelocity = 0, onComplete) {
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
   * @param {number} position - Current translateY in pixels
   * @returns {number} Ratio in range [0, 1]
   * @private
   */
  #positionToRatio(position) {
    return 1 - (this.#sheetHeight ? position / this.#sheetHeight : 0);
  }

  /**
   * Cancel the spring animation
   * @returns {void}
   * @private
   */
  #cancelAnimations() {
    this.#springAnimator.cancel();

    this.#element?.classList.remove(CLASS_NAME.ANIMATING);
  }

  /**
   * Clean up component state and resources
   * @returns {void}
   * @private
   */
  #cleanup() {
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
   * @param {string} name - Event name
   * @param {Object} detail - Event detail object
   * @returns {CustomEvent} The triggered event
   * @private
   */
  #triggerEvent(name, detail = {}) {
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
  const trigger = event.target.closest?.(SELECTOR.DATA_TOGGLE);

  if (!trigger) {
    return;
  }

  event.preventDefault();

  const targetSelector = extractTargetSelector(trigger);

  if (!targetSelector) {
    return;
  }

  const sheetElement = document.querySelector(targetSelector);

  if (!sheetElement) {
    return;
  }

  const sheetConfig = extractDataAttributes(sheetElement);
  const triggerConfig = extractDataAttributes(trigger);
  const mergedConfig = { ...sheetConfig, ...triggerConfig };
  const sheetInstance = BootstrapSheet.getOrCreateInstance(sheetElement, mergedConfig);

  sheetInstance.toggle();
});

// ==================== Export ====================

export default BootstrapSheet;

if (typeof window !== 'undefined') {
  window.BootstrapSheet = BootstrapSheet;
}
