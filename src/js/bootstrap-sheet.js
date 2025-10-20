import {
  NAME,
  EVENT,
  CLASS_NAME,
  SELECTOR,
  FOCUSABLE_SELECTOR,
  Default,
  DefaultType,
} from './constants';

import {
  resolveElement,
  extractTargetSelector,
  reflow,
  clamp,
  getScrollbarWidth,
  extractDataAttributes,
  validateConfigTypes,
  executeAfterTransition,
  getTranslateY,
} from './utils';

const INSTANCES = new WeakMap();
const SUPPORTS_INERT = 'inert' in HTMLElement.prototype;

/**
 * @class BootstrapSheet - A touch-friendly bottom sheet component for Bootstrap 5
 * @version 0.1.0
 * @author Sergey Mironov <sergeymironov@protonmail.com>
 * @license MIT (https://github.com/mironovsergey/bootstrap-sheet/blob/main/LICENSE)
 */
class BootstrapSheet {
  // ==================== Core elements ====================

  /* @type {HTMLElement} Sheet element */
  #element;

  /* @type {Object} Configuration object */
  #config;

  /* @type {HTMLElement|null} Backdrop element */
  #backdrop = null;

  // ==================== Component state ====================

  /* @type {Object} State flags */
  #state = {
    /* @type {boolean} Whether the sheet is currently shown */
    isShown: false,

    /* @type {boolean} Whether a show/hide transition is in progress */
    isTransitioning: false,

    /* @type {boolean} Whether the sheet is currently being dragged */
    isDragging: false,
  };

  // ==================== Timeouts and animation frames ====================

  /* @type {number|null} Animation frame ID for gesture updates */
  #animationFrame = null;

  /* @type {Function|null} Cancel function for open timeout */
  #openTimeout = null;

  /* @type {Function|null} Cancel function for close timeout */
  #closeTimeout = null;

  // ==================== Event handlers ====================

  /* @type {Object} References to bound event handlers for easy removal */
  #handlers = {
    escape: null,
    dismiss: null,
    focusTrap: null,
    pointerDown: null,
    pointerMove: null,
    pointerUp: null,
  };

  // ==================== Focus management ====================

  /* @type {Object} Focus management state */
  #focus = {
    /* @type {HTMLElement|null} Previously focused element before sheet opened */
    previousElement: null,

    /* @type {HTMLElement[]} Array of focusable elements within sheet */
    focusableElements: null,

    /* @type {MutationObserver|null} Observer for focusable element changes */
    mutationObserver: null,
  };

  // ==================== Inert management ====================

  /* @type {Map<HTMLElement, Object>} Map of inerted nodes and their previous states */
  #inertedNodes = new Map();

  // ==================== Gesture tracking ====================

  /* @type {Object} Gesture tracking state */
  #gesture = {
    /* @type {number} Initial Y coordinate when drag starts */
    startY: 0,

    /* @type {number} Current Y coordinate during drag */
    currentY: 0,

    /* @type {number} Last recorded Y coordinate */
    lastY: 0,

    /* @type {number} Timestamp when drag started */
    startTime: 0,

    /* @type {number} Last timestamp during drag */
    lastTime: 0,

    /* @type {number} Current velocity in px/ms */
    velocity: 0,

    /* @type {number} Initial translateY value when drag starts */
    startTranslateY: 0,

    /* @type {number} Total height of the sheet */
    sheetHeight: 0,
  };

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
    this.#focus.previousElement = document.activeElement;
    this.#gesture.sheetHeight =
      this.#element.offsetHeight || this.#element.getBoundingClientRect().height || 0;
  }

  /**
   * Execute show animation and setup
   * @returns {void}
   * @private
   */
  #executeShow() {
    if (this.#config.backdrop) {
      this.#showBackdrop();
    }

    this.#applyInert();
    this.#adjustBodyPadding();

    this.#element.classList.add(CLASS_NAME.SHOWING);

    reflow(this.#element);

    this.#element.classList.add(CLASS_NAME.SHOW);

    this.#attachEventHandlers();

    if (this.#config.focus) {
      this.#startFocusManagement();
    }

    this.#openTimeout = executeAfterTransition(
      this.#element,
      () => this.#finalizeShow(),
      this.#config.animationDuration,
    );
  }

  /**
   * Finalize show transition
   * @returns {void}
   * @private
   */
  #finalizeShow() {
    this.#element.classList.remove(CLASS_NAME.SHOWING);
    this.#state.isTransitioning = false;

    if (this.#config.focus) {
      this.#trapFocus();
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

    if (this.#state.isDragging) {
      this.#abortDrag();
    }

    if (this.#config.focus) {
      this.#stopFocusManagement();
    }

    this.#element.classList.add(CLASS_NAME.HIDING);
    this.#element.classList.remove(CLASS_NAME.DRAGGING, CLASS_NAME.SHOW);
    this.#element.style.transform = '';
  }

  /**
   * Execute hide animation and cleanup
   * @returns {void}
   * @private
   */
  #executeHide() {
    this.#detachEventHandlers();
    this.#cancelAnimations();
    this.#removeInert();
    this.#updateBackdropOpacity(0);

    this.#closeTimeout = executeAfterTransition(
      this.#element,
      () => this.#finalizeHide(),
      this.#config.animationDuration,
    );
  }

  /**
   * Finalize hide transition
   * @returns {void}
   * @private
   */
  #finalizeHide() {
    this.#element.classList.remove(CLASS_NAME.HIDING);
    this.#state.isTransitioning = false;

    this.#removeBackdrop();
    this.#resetBodyPadding();
    this.#restoreFocus();
    this.#triggerEvent(EVENT.HIDDEN);
  }

  // ==================== Private Methods: Backdrop ====================

  /**
   * Show the backdrop
   * @returns {void}
   * @private
   */
  #showBackdrop() {
    if (!this.#backdrop) {
      this.#createBackdrop();
    }

    this.#updateBackdropOpacity(1);
  }

  /**
   * Create the backdrop element
   * @returns {void}
   * @private
   */
  #createBackdrop() {
    const backdrop = document.createElement('div');

    backdrop.className = CLASS_NAME.BACKDROP;
    backdrop.style.opacity = '0';
    backdrop.style.transition = `opacity ${this.#config.animationDuration}ms`;

    if (this.#config.backdrop === 'static') {
      backdrop.dataset.bsStatic = '';
    } else {
      backdrop.addEventListener('click', () => this.hide());
    }

    document.body.appendChild(backdrop);

    reflow(backdrop);

    this.#backdrop = backdrop;
  }

  /**
   * Remove backdrop element from DOM
   * @returns {void}
   * @private
   */
  #removeBackdrop() {
    if (this.#backdrop) {
      this.#backdrop.remove();
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
    if (!this.#config.backdrop || !this.#backdrop) {
      return;
    }

    this.#backdrop.style.opacity = String(clamp(ratio, 0, 1));
  }

  // ==================== Private Methods: Body scroll ====================

  /**
   * Adjust body padding to prevent layout shift when showing the sheet
   * @returns {void}
   * @private
   */
  #adjustBodyPadding() {
    const isOverflowing = document.body.scrollHeight > window.innerHeight;

    if (isOverflowing) {
      const scrollbarWidth = getScrollbarWidth();

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden';
      }
    }
  }

  /**
   * Reset body padding and overflow to original state
   * @returns {void}
   * @private
   */
  #resetBodyPadding() {
    document.body.style.paddingRight = '';
    document.body.style.overflow = '';
  }

  // ==================== Private Methods: Inert ====================

  /**
   * Apply inert or aria-hidden to all elements outside the sheet.
   * Uses native 'inert' attribute if supported, falls back to aria-hidden otherwise.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert}
   * @returns {void}
   * @private
   */
  #applyInert() {
    const bodyChildren = Array.from(document.body.children);

    for (const node of bodyChildren) {
      if (node === this.#backdrop || node === this.#element) {
        continue;
      }

      if (SUPPORTS_INERT) {
        this.#inertedNodes.set(node, { inert: node.inert || false });
        node.inert = true;
      } else {
        this.#inertedNodes.set(node, { ariaHidden: node.getAttribute('aria-hidden') });
        node.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Remove inert or aria-hidden from all previously inerted elements
   * @returns {void}
   * @private
   */
  #removeInert() {
    if (this.#inertedNodes.size === 0) {
      return;
    }

    for (const [node, previousState] of this.#inertedNodes.entries()) {
      if (!node) {
        continue;
      }

      if (SUPPORTS_INERT) {
        node.inert = previousState.inert;
      } else {
        if (previousState.ariaHidden === null || previousState.ariaHidden === undefined) {
          node.removeAttribute('aria-hidden');
        } else {
          node.setAttribute('aria-hidden', previousState.ariaHidden);
        }
      }
    }

    this.#inertedNodes.clear();
  }

  // ==================== Private Methods: Focus Management ====================

  /**
   * Start managing focus within the sheet
   * @returns {void}
   * @private
   */
  #startFocusManagement() {
    this.#updateFocusableElements();
    this.#attachFocusTrapHandler();
    this.#observeFocusableChanges();
  }

  /**
   * Stop managing focus within the sheet
   * @returns {void}
   * @private
   */
  #stopFocusManagement() {
    this.#detachFocusTrapHandler();
    this.#disconnectFocusObserver();
  }

  /**
   * Update the list of focusable elements within the sheet
   * @returns {void}
   * @private
   */
  #updateFocusableElements() {
    const elements = this.#element.querySelectorAll(FOCUSABLE_SELECTOR);

    this.#focus.focusableElements = Array.from(elements).filter(
      (element) =>
        element.offsetParent !== null &&
        !element.hasAttribute('inert') &&
        element.getAttribute('aria-hidden') !== 'true',
    );
  }

  /**
   * Attach keydown handler to trap focus within the sheet
   * @returns {void}
   * @private
   */
  #attachFocusTrapHandler() {
    this.#handlers.focusTrap = (event) => {
      if (event.key === 'Tab') {
        this.#handleTabKey(event);
      }
    };

    this.#element.addEventListener('keydown', this.#handlers.focusTrap);
  }

  /**
   * Detach keydown handler for focus trap
   * @returns {void}
   * @private
   */
  #detachFocusTrapHandler() {
    if (this.#handlers.focusTrap) {
      this.#element.removeEventListener('keydown', this.#handlers.focusTrap);
      this.#handlers.focusTrap = null;
    }
  }

  /**
   * Handle Tab key to trap focus within the sheet
   * @param {KeyboardEvent} event - The keydown event
   * @returns {void}
   * @private
   */
  #handleTabKey(event) {
    const { focusableElements } = this.#focus;

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
   * Focus the first focusable element or the sheet itself
   * @returns {void}
   * @private
   */
  #trapFocus() {
    this.#updateFocusableElements();

    if (this.#focus.focusableElements?.length) {
      this.#focus.focusableElements[0].focus();
    } else {
      this.#element.focus();
    }
  }

  /**
   * Restore focus to the previously focused element
   * @returns {void}
   * @private
   */
  #restoreFocus() {
    const { previousElement } = this.#focus;

    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }

  /**
   * Observe changes to focusable elements within the sheet
   * @returns {void}
   * @private
   */
  #observeFocusableChanges() {
    if (this.#focus.mutationObserver) {
      return;
    }

    this.#focus.mutationObserver = new MutationObserver(() => {
      this.#updateFocusableElements();
    });

    this.#focus.mutationObserver.observe(this.#element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'hidden', 'aria-hidden'],
    });
  }

  /**
   * Disconnect the mutation observer for focusable elements
   * @returns {void}
   * @private
   */
  #disconnectFocusObserver() {
    if (this.#focus.mutationObserver) {
      this.#focus.mutationObserver.disconnect();
      this.#focus.mutationObserver = null;
    }
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
   * Animate shake effect for static backdrop
   * @returns {void}
   * @private
   */
  #shakeSheet() {
    this.#element.classList.add(CLASS_NAME.STATIC_SHAKE);

    setTimeout(() => {
      this.#element.classList.remove(CLASS_NAME.STATIC_SHAKE);
    }, this.#config.animationDuration);
  }

  // ==================== Private Methods: Gestures ====================

  /**
   * Attach gesture event handlers
   * @returns {void}
   * @private
   */
  #attachGestureHandlers() {
    const dragHandle = this.#element.querySelector(SELECTOR.DRAG_HANDLE);

    if (!dragHandle) {
      return;
    }

    this.#handlers.pointerDown = (event) => this.#onPointerDown(event);
    this.#handlers.pointerMove = (event) => this.#onPointerMove(event);
    this.#handlers.pointerUp = (event) => this.#onPointerUp(event);

    dragHandle.addEventListener('pointerdown', this.#handlers.pointerDown, { passive: false });
    document.addEventListener('pointermove', this.#handlers.pointerMove);
    document.addEventListener('pointerup', this.#handlers.pointerUp);
    document.addEventListener('pointercancel', this.#handlers.pointerUp);
  }

  /**
   * Detach gesture event handlers
   * @returns {void}
   * @private
   */
  #detachGestureHandlers() {
    const dragHandle = this.#element.querySelector(SELECTOR.DRAG_HANDLE);

    if (dragHandle && this.#handlers.pointerDown) {
      dragHandle.removeEventListener('pointerdown', this.#handlers.pointerDown);
    }

    document.removeEventListener('pointermove', this.#handlers.pointerMove);
    document.removeEventListener('pointerup', this.#handlers.pointerUp);
    document.removeEventListener('pointercancel', this.#handlers.pointerUp);

    this.#handlers.pointerDown = null;
    this.#handlers.pointerMove = null;
    this.#handlers.pointerUp = null;
  }

  /**
   * Handle pointer down event to start dragging
   * @param {PointerEvent} event - The pointerdown event
   * @returns {void}
   * @private
   */
  #onPointerDown(event) {
    event.preventDefault();

    const now = performance.now();

    this.#state.isDragging = true;
    this.#gesture.startY = event.clientY;
    this.#gesture.currentY = event.clientY;
    this.#gesture.lastY = event.clientY;
    this.#gesture.startTime = now;
    this.#gesture.lastTime = now;
    this.#gesture.velocity = 0;
    this.#gesture.startTranslateY = getTranslateY(this.#element);

    if (this.#backdrop) {
      this.#backdrop.style.transition = 'none';
    }

    this.#element.classList.add(CLASS_NAME.DRAGGING);

    try {
      event.target?.setPointerCapture?.(event.pointerId);
    } catch (error) {
      console.warn('Failed to capture pointer:', error);
    }
  }

  /**
   * Handle pointer move event to update dragging
   * @param {PointerEvent} event - The pointermove event
   * @returns {void}
   * @private
   */
  #onPointerMove(event) {
    if (!this.#state.isDragging || !this.#state.isShown) {
      return;
    }

    this.#gesture.currentY = event.clientY;

    const now = performance.now();
    const deltaTime = now - this.#gesture.lastTime;

    if (deltaTime > 0) {
      this.#gesture.velocity = (this.#gesture.currentY - this.#gesture.lastY) / deltaTime;
    }

    this.#gesture.lastY = this.#gesture.currentY;
    this.#gesture.lastTime = now;

    this.#schedulePositionUpdate();
  }

  /**
   * Schedule position update on next animation frame
   * @returns {void}
   * @private
   */
  #schedulePositionUpdate() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }

    this.#animationFrame = requestAnimationFrame(() => {
      const deltaY = this.#gesture.currentY - this.#gesture.startY;
      this.#updateDragPosition(deltaY);
    });
  }

  /**
   * Update sheet position during drag
   * @param {number} deltaY - Raw Y delta from gesture start position
   * @fires EVENT.SLIDE
   * @returns {void}
   * @private
   */
  #updateDragPosition(deltaY) {
    const adjustedY = this.#calculateResistantPosition(deltaY);

    this.#element.style.transform = `translateY(${adjustedY}px)`;

    const ratio = 1 - (this.#gesture.sheetHeight ? adjustedY / this.#gesture.sheetHeight : 0);

    this.#updateBackdropOpacity(clamp(ratio, 0, 1));

    this.#triggerEvent(EVENT.SLIDE, {
      velocity: this.#gesture.velocity,
      adjustedY,
      deltaY,
      ratio,
    });
  }

  /**
   * Calculate the adjusted position based on drag resistance
   * @param {number} deltaY - Raw Y delta from gesture start position
   * @returns {number} Adjusted absolute translateY position
   * @private
   */
  #calculateResistantPosition(deltaY) {
    if (deltaY === 0) {
      return this.#gesture.startTranslateY;
    }

    const scale = this.#gesture.sheetHeight * 0.25;
    const resistance = deltaY < 0 ? this.#config.dragResistanceUp : this.#config.dragResistanceDown;
    const adjustedDelta = (deltaY * scale) / (scale + resistance * Math.abs(deltaY));

    return this.#gesture.startTranslateY + adjustedDelta;
  }

  /**
   * Handle pointer up event to end dragging
   * @param {PointerEvent} event - The pointerup event
   * @returns {void}
   * @private
   */
  #onPointerUp(event) {
    if (!this.#state.isDragging) {
      return;
    }

    this.#state.isDragging = false;
    this.#element.classList.remove(CLASS_NAME.DRAGGING);

    try {
      event.target?.releasePointerCapture?.(event.pointerId);
    } catch (error) {
      console.warn('Failed to release pointer:', error);
    }

    if (this.#backdrop) {
      this.#backdrop.style.transition = `opacity ${this.#config.animationDuration}ms`;
    }

    this.#handleDragEnd();
  }

  /**
   * Handle drag end and determine final position
   * @returns {void}
   * @private
   */
  #handleDragEnd() {
    const deltaY = this.#gesture.currentY - this.#gesture.startY;
    const velocity = this.#gesture.velocity || 0;

    // Project movement based on velocity
    const projectedDelta = deltaY + velocity * this.#config.projectionTime;

    if (deltaY < 0) {
      // Pulling up - return to initial position
      this.#animateToPosition(0);
    } else {
      // Determine if sheet should close
      const threshold = Math.max(
        this.#config.swipeThreshold,
        this.#gesture.sheetHeight * this.#config.closeThresholdRatio,
      );

      const shouldClose =
        projectedDelta > threshold ||
        (Math.abs(velocity) > this.#config.velocityThreshold &&
          deltaY > this.#config.minCloseDistance);

      if (shouldClose) {
        this.#animateToPosition(this.#gesture.sheetHeight, () => this.hide());
      } else {
        this.#animateToPosition(0);
      }
    }
  }

  /**
   * Animate sheet to target position. Uses easeOutCubic timing function.
   * @param {number} targetY - Target translateY position
   * @param {Function} onComplete - Optional callback when animation completes
   * @returns {void}
   * @private
   */
  #animateToPosition(targetY, onComplete) {
    const startY = getTranslateY(this.#element);
    const distance = targetY - startY;
    const duration = this.#config.animationDuration;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentY = startY + distance * eased;

      this.#element.style.transform = `translateY(${currentY}px)`;

      const ratio = 1 - (this.#gesture.sheetHeight ? currentY / this.#gesture.sheetHeight : 0);

      this.#updateBackdropOpacity(ratio);

      if (progress < 1) {
        this.#animationFrame = requestAnimationFrame(animate);
      } else {
        this.#animationFrame = null;
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    };

    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }

    this.#animationFrame = requestAnimationFrame(animate);
  }

  // ==================== Private Methods: Utilities ====================

  /**
   * Cancel all pending animations
   * @returns {void}
   * @private
   */
  #cancelAnimations() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
  }

  /**
   * Abort current drag operation
   * @returns {void}
   * @private
   */
  #abortDrag() {
    if (!this.#state.isDragging) {
      return;
    }

    this.#state.isDragging = false;

    if (this.#backdrop) {
      this.#backdrop.style.transition = `opacity ${this.#config.animationDuration}ms`;
    }

    this.#cancelAnimations();
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
    this.#state.isDragging = false;

    // Cancel timeouts
    if (typeof this.#openTimeout === 'function') {
      this.#openTimeout();
      this.#openTimeout = null;
    }

    if (typeof this.#closeTimeout === 'function') {
      this.#closeTimeout();
      this.#closeTimeout = null;
    }

    this.#resetBodyPadding();
    this.#removeBackdrop();
    this.#detachEventHandlers();
    this.#cancelAnimations();
    this.#disconnectFocusObserver();
    this.#removeInert();
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
  const mergedConfig = { ...Default, ...sheetConfig, ...triggerConfig };
  const sheetInstance = BootstrapSheet.getOrCreateInstance(sheetElement, mergedConfig);

  sheetInstance.toggle();
});

// ==================== Export ====================

export default BootstrapSheet;

if (typeof window !== 'undefined') {
  window.BootstrapSheet = BootstrapSheet;
}
