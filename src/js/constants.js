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

  /** Backdrop element class */
  BACKDROP: 'sheet-backdrop',

  /** Applied during static shake animation */
  STATIC_SHAKE: 'sheet-static-shake',
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

  /** Minimum swipe distance in pixels to trigger close */
  swipeThreshold: 50,

  /** Minimum velocity (px/ms) to trigger close */
  velocityThreshold: 0.5,

  /** Minimum distance for velocity-based close */
  minCloseDistance: 50,

  /** Ratio of sheet height to trigger close (0-1) */
  closeThresholdRatio: 0.3,

  // ==================== Animation ====================

  /** Animation duration in milliseconds */
  animationDuration: 300,

  /** Time to project velocity in milliseconds */
  projectionTime: 200,

  // ==================== Drag resistance ====================

  /** Resistance when dragging up (0-1, higher = more resistance) */
  dragResistanceUp: 0.75,

  /** Resistance when dragging down (0-1, higher = more resistance) */
  dragResistanceDown: 0.01,
};

/**
 * Types of configuration options for validation
 */
export const DefaultType = {
  backdrop: '(boolean|string)',
  keyboard: 'boolean',
  focus: 'boolean',
  gestures: 'boolean',
  swipeThreshold: 'number',
  velocityThreshold: 'number',
  minCloseDistance: 'number',
  closeThresholdRatio: 'number',
  animationDuration: 'number',
  projectionTime: 'number',
  dragResistanceUp: 'number',
  dragResistanceDown: 'number',
};
