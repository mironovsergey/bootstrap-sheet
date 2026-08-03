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

  /**
   * Selector for the legacy explicit drag handle
   * @deprecated since 0.4.0 - the whole sheet is draggable; removed in 0.5.0
   */
  DRAG_HANDLE: '[data-bs-drag="sheet"]',

  /** Selector for subtrees the sheet must not be dragged from */
  DRAG_OPT_OUT: '[data-bs-drag="false"]',
};

/**
 * Elements that own a drag gesture of their own, treated as implicit
 * `data-bs-drag="false"` zones so authors do not have to opt each one out.
 */
export const DRAG_OPT_OUT_SELECTOR = [
  '[data-bs-drag="false"]',
  'input[type="range"]',
  '[contenteditable]:not([contenteditable="false"])',
  '[draggable="true"]',
].join(', ');

/**
 * Distance in pixels the pointer must travel before a gesture counts as a
 * drag. Below this threshold nothing moves and clicks land normally, which is
 * what makes a fully draggable sheet compatible with interactive content.
 */
export const DRAG_SLOP = 8;

/**
 * How long after a content scroll a drag gesture stays disabled (ms).
 * Prevents a momentum scroll that lands at the top of the content from
 * immediately becoming a dismiss drag.
 */
export const SCROLL_LOCK_TIMEOUT = 100;

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
 * Public configuration options for BootstrapSheet
 */
export interface BootstrapSheetOptions {
  /** Includes a backdrop element. Use 'static' for a backdrop that doesn't close the sheet */
  backdrop?: boolean | 'static';

  /** Closes the sheet when the Escape key is pressed */
  keyboard?: boolean;

  /** Puts focus on the sheet when shown and traps focus within it */
  focus?: boolean;

  /** Enables swipe gestures */
  gestures?: boolean;

  /**
   * Damping ratio for spring animation.
   * - 1.0 = critically damped (no bounce, fastest convergence)
   * - 0.8 = slight overshoot (recommended for gesture-driven snaps)
   * - < 1.0 = underdamped (bouncy)
   * @since 0.2.0
   */
  springDampingRatio?: number;

  /**
   * Response time for spring animation in seconds.
   * Controls how fast the spring reaches its target (analogous to duration).
   * Converted to stiffness via: stiffness = (2π / response)²
   * @since 0.2.0
   */
  springResponse?: number;
}

/**
 * Configuration with every option resolved (defaults merged with user input)
 */
export type ResolvedSheetOptions = Required<BootstrapSheetOptions>;

/**
 * Default configuration options for BootstrapSheet
 */
export const Default: ResolvedSheetOptions = {
  backdrop: true,
  keyboard: true,
  focus: true,
  gestures: true,
  springDampingRatio: 0.8,
  springResponse: 0.4,
};

/**
 * Types of configuration options for validation
 */
export const DefaultType: Record<keyof BootstrapSheetOptions, string> = {
  backdrop: '(boolean|string)',
  keyboard: 'boolean',
  focus: 'boolean',
  gestures: 'boolean',
  springDampingRatio: 'number',
  springResponse: 'number',
};
