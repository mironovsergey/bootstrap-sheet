export const NAME = 'sheet';
export const DATA_KEY = `bs.${NAME}`;
export const EVENT_KEY = `.${DATA_KEY}`;

/**
 * Event names dispatched by BootstrapSheet
 */
export const EVENT = {
  /** Fired immediately when show() is called */
  SHOW: `show${EVENT_KEY}`,

  /** Fired when the sheet is fully shown */
  SHOWN: `shown${EVENT_KEY}`,

  /** Fired immediately when hide() is called */
  HIDE: `hide${EVENT_KEY}`,

  /** Fired when the sheet is fully hidden */
  HIDDEN: `hidden${EVENT_KEY}`,

  /** Fired continuously during drag/slide */
  SLIDE: `slide${EVENT_KEY}`,
};

/**
 * Class names used by BootstrapSheet
 */
export const CLASS_NAME = {
  /** Applied when sheet is visible */
  SHOW: 'show',

  /** Applied during show transition */
  SHOWING: 'showing',

  /** Applied during hide transition */
  HIDING: 'hiding',

  /** Applied during drag operation */
  DRAGGING: 'dragging',

  /** Applied during spring animation */
  ANIMATING: 'animating',

  /** Backdrop element class */
  BACKDROP: 'sheet-backdrop',
};

/**
 * CSS selectors for declarative API
 */
export const SELECTOR = {
  /** Selector for toggle triggers */
  DATA_TOGGLE: '[data-bs-toggle="sheet"]',

  /** Selector for dismiss triggers */
  DATA_DISMISS: '[data-bs-dismiss="sheet"]',

  /** Selector for drag handle area */
  DRAG_HANDLE: '[data-bs-drag="sheet"]',
};

/**
 * Selector for all focusable elements
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

/**
 * Apple's rubber band coefficient (reverse-engineered from UIScrollView).
 * Controls overscroll resistance when dragging past boundaries.
 * @see {@link https://gist.github.com/originell/6961057}
 */
export const RUBBER_BAND_COEFFICIENT = 0.55;

/**
 * Apple's deceleration rate for velocity projection (UIScrollView.DecelerationRate.normal).
 * Used to project where the sheet would come to rest after release.
 */
export const DECELERATION_RATE = 0.998;

/**
 * Default configuration options for BootstrapSheet
 */
export const Default = {
  // ==================== UI ====================

  /** Enable/disable backdrop. Can be true, false, or 'static' */
  backdrop: true,

  /** Enable/disable keyboard (ESC) support */
  keyboard: true,

  /** Enable/disable focus trap */
  focus: true,

  // ==================== Gestures ====================

  /** Enable/disable swipe gestures */
  gestures: true,

  // ==================== Spring animation ====================

  /**
   * Damping ratio for spring animation.
   * - 1.0 = critically damped (no bounce, fastest convergence)
   * - 0.8 = slight overshoot (recommended for gesture-driven snaps)
   * - < 1.0 = underdamped (bouncy)
   * @since 0.2.0
   */
  springDampingRatio: 0.8,

  /**
   * Response time for spring animation in seconds.
   * Controls how fast the spring reaches its target (analogous to duration).
   * Converted to stiffness via: stiffness = (2π / response)²
   * @since 0.2.0
   */
  springResponse: 0.4,
};

/**
 * Types of configuration options for validation
 */
export const DefaultType = {
  backdrop: '(boolean|string)',
  keyboard: 'boolean',
  focus: 'boolean',
  gestures: 'boolean',
  springDampingRatio: 'number',
  springResponse: 'number',
};
