import {
  DRAG_OPT_OUT_SELECTOR,
  DRAG_SLOP,
  SCROLL_LOCK_TIMEOUT,
  RUBBER_BAND_COEFFICIENT,
  DECELERATION_RATE,
} from './constants';
import { rubberBand, projectDisplacement, VelocityTracker } from './utils';

/**
 * Who a gesture in progress belongs to.
 *
 * Resolved at `pointerdown` and, for `undecided`, at the moment the drag slop
 * threshold is crossed. Never revisited afterwards: the web cannot reclaim a
 * gesture the browser has already started scrolling, so the decision has to be
 * made up front and honored for the lifetime of the gesture.
 */
type GestureOwner = 'sheet' | 'content' | 'undecided';

/**
 * Movement data for a single animation-frame-batched drag update
 */
export interface DragMoveFrame {
  /** Adjusted absolute translateY position after rubber band resistance (px) */
  adjustedY: number;

  /** Y delta from the point where the drag began (px) */
  deltaY: number;

  /** Openness ratio: 1 fully open, 0 fully closed (not clamped) */
  ratio: number;

  /** Current gesture velocity (px/ms, positive = downward) */
  velocity: number;
}

/**
 * Release decision reported after the gesture ends
 */
export interface DragRelease {
  /** Whether the projected rest position passes the dismiss threshold */
  shouldDismiss: boolean;

  /** Release velocity (px/s, positive = downward) */
  velocity: number;
}

/**
 * Configuration for the drag controller
 */
export interface DragControllerConfig {
  /** Sheet root element: the whole sheet is draggable */
  element: HTMLElement;

  /** Returns the current sheet translateY (px), read when the drag begins */
  getPosition: () => number;

  /** Returns the total sheet height (px) for resistance and projection */
  getSheetHeight: () => number;

  /** Whether drag processing is currently allowed */
  isEnabled: () => boolean;

  /** Called when a drag gesture starts (slop threshold crossed) */
  onDragStart: () => void;

  /** Called synchronously on each move so a drag takes over a running animation */
  onTakeover: () => void;

  /** Called on each animation-frame-batched move */
  onMove: (frame: DragMoveFrame) => void;

  /** Called when the gesture ends (release, cancel or abort) */
  onDragEnd: () => void;

  /** Called with the snap/dismiss decision after release */
  onRelease: (release: DragRelease) => void;

  /** Called when the browser takes the gesture away, to restore the resting position */
  onAbort: () => void;
}

/**
 * Drag controller for BootstrapSheet.
 *
 * Owns pointer input and gesture physics: gesture arbitration against
 * scrollable content, drag slop, animation-frame batching of moves, windowed
 * velocity tracking, rubber band resistance and the snap/dismiss decision on
 * release. DOM side effects (transform, backdrop opacity, class names, events,
 * animations) are delegated to the caller via callbacks.
 *
 * The whole sheet is draggable. A gesture that starts inside a scrolled
 * container, inside an opt-out subtree, or too soon after a content scroll
 * belongs to the content instead; see `#resolveOwner` and `#decideOwner`.
 */
export default class DragController {
  /** Configuration object */
  #config: DragControllerConfig;

  /** Who the gesture in progress belongs to (`content` while idle) */
  #owner: GestureOwner = 'content';

  /** Pointer being tracked, or null when no gesture is in progress */
  #pointerId: number | null = null;

  /** Pending animation frame ID for batched move updates */
  #frame: number | null = null;

  /** Windowed velocity tracker for gesture measurement */
  #velocityTracker = new VelocityTracker(100);

  /** Pointer coordinates at `pointerdown`, used for slop and direction */
  #originX = 0;
  #originY = 0;

  /** Y coordinate where the drag began (the slop crossing point) */
  #startY = 0;

  /** Current Y coordinate during the drag */
  #currentY = 0;

  /** Sheet translateY when the drag began */
  #startTranslateY = 0;

  /** Scrollable ancestor of the gesture target within the sheet, if any */
  #scroller: Element | null = null;

  /** Whether the pointer is currently captured by the sheet */
  #captured = false;

  /** Timestamp of the last scroll inside the sheet */
  #lastScrollTime = Number.NEGATIVE_INFINITY;

  constructor(config: DragControllerConfig) {
    this.#config = config;
  }

  /**
   * Whether a drag gesture is currently in progress
   */
  get isDragging(): boolean {
    return this.#pointerId !== null && this.#owner === 'sheet';
  }

  /**
   * Attach event listeners
   */
  attach(): void {
    const { element } = this.#config;

    element.addEventListener('pointerdown', this.#onPointerDown);

    // Non-passive: this listener exists solely to preventDefault() the native
    // pan while the sheet owns the gesture.
    element.addEventListener('touchmove', this.#onTouchMove, { passive: false });

    // Scroll does not bubble, but capturing listeners still see it.
    element.addEventListener('scroll', this.#onScroll, { capture: true, passive: true });

    document.addEventListener('pointermove', this.#onPointerMove);
    document.addEventListener('pointerup', this.#onPointerUp);
    document.addEventListener('pointercancel', this.#onPointerCancel);
  }

  /**
   * Detach event listeners and cancel any pending frame
   */
  detach(): void {
    const { element } = this.#config;

    element.removeEventListener('pointerdown', this.#onPointerDown);
    element.removeEventListener('touchmove', this.#onTouchMove);
    element.removeEventListener('scroll', this.#onScroll, { capture: true });

    document.removeEventListener('pointermove', this.#onPointerMove);
    document.removeEventListener('pointerup', this.#onPointerUp);
    document.removeEventListener('pointercancel', this.#onPointerCancel);

    this.#resetGesture();
  }

  /**
   * Abort the current drag without a release decision or an abort callback.
   * Used when the sheet is going away on its own (hide, dispose).
   */
  abort(): void {
    if (!this.isDragging) {
      return;
    }

    this.#resetGesture();
    this.#config.onDragEnd();
  }

  /**
   * Handle pointer down: resolve who owns the gesture.
   *
   * Deliberately does not call preventDefault() - the whole sheet is
   * draggable, so suppressing the default action here would break every
   * button, link and form control inside it. The drag slop threshold is what
   * separates a tap from a drag.
   */
  #onPointerDown = (event: PointerEvent): void => {
    // Only the first pointer of a gesture is tracked
    if (this.#pointerId !== null || !this.#config.isEnabled()) {
      return;
    }

    const owner = this.#resolveOwner(event);

    if (owner === 'content') {
      return;
    }

    this.#pointerId = event.pointerId;
    this.#owner = owner;
    this.#originX = event.clientX;
    this.#originY = event.clientY;
  };

  /**
   * Handle pointer move: cross the slop threshold, then track the drag
   */
  #onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId || !this.#config.isEnabled()) {
      return;
    }

    if (this.#owner === 'undecided') {
      this.#decideOwner(event);
      return;
    }

    if (this.#owner !== 'sheet') {
      return;
    }

    this.#currentY = event.clientY;

    this.#velocityTracker.addSample(event.timeStamp, event.clientY);

    this.#scheduleMoveFrame();
  };

  /**
   * Handle pointer up: end the gesture and report the release decision
   */
  #onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId) {
      return;
    }

    const wasDragging = this.isDragging;
    const velocity = this.#velocityTracker.getVelocity(event.timeStamp);

    this.#releasePointerCapture(event.pointerId);
    this.#resetGesture();

    if (!wasDragging) {
      return;
    }

    this.#config.onDragEnd();
    this.#release(velocity);
  };

  /**
   * Handle pointer cancel: the browser took the gesture away.
   *
   * Unlike a release this makes no snap or dismiss decision - the user never
   * finished the gesture, so the sheet returns to where it was resting.
   */
  #onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId) {
      return;
    }

    const wasDragging = this.isDragging;

    this.#releasePointerCapture(event.pointerId);
    this.#resetGesture();

    if (!wasDragging) {
      return;
    }

    this.#config.onDragEnd();
    this.#config.onAbort();
  };

  /**
   * Suppress the native pan while the sheet owns the gesture
   */
  #onTouchMove = (event: TouchEvent): void => {
    if (this.isDragging && event.cancelable) {
      event.preventDefault();
    }
  };

  /**
   * Record when the content was last scrolled.
   *
   * Reads the clock rather than `event.timeStamp` so the value is comparable
   * with pointer event timestamps, which are on the same monotonic clock.
   */
  #onScroll = (): void => {
    this.#lastScrollTime = performance.now();
  };

  /**
   * Resolve gesture ownership from the state known at `pointerdown`.
   * @param event - The pointerdown event
   * @returns `content` to ignore the gesture, `undecided` to defer to direction
   */
  #resolveOwner(event: PointerEvent): GestureOwner {
    const target = event.target;

    if (!(target instanceof Element)) {
      return 'content';
    }

    // Opt-out subtrees, explicit and implicit
    if (target.closest(DRAG_OPT_OUT_SELECTOR)) {
      return 'content';
    }

    // A gesture that follows a scroll too closely is momentum, not intent
    if (event.timeStamp - this.#lastScrollTime < SCROLL_LOCK_TIMEOUT) {
      return 'content';
    }

    this.#scroller = this.#findScroller(target);

    // Content scrolled away from its top keeps the gesture
    if (this.#scroller !== null && this.#scroller.scrollTop > 0) {
      return 'content';
    }

    return 'undecided';
  }

  /**
   * Decide ownership once the pointer has travelled far enough to tell a drag
   * from a tap, a horizontal swipe, or a scroll of content sitting at its top.
   * @param event - The pointermove event that may cross the threshold
   */
  #decideOwner(event: PointerEvent): void {
    const deltaX = event.clientX - this.#originX;
    const deltaY = event.clientY - this.#originY;

    if (Math.abs(deltaY) < DRAG_SLOP) {
      return;
    }

    // A predominantly horizontal gesture belongs to the content
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.#owner = 'content';
      return;
    }

    // At the top of a scroller only a downward gesture is ours; an upward one
    // scrolls the content, which is the only thing it can still do there
    if (this.#scroller !== null && this.#scroller.scrollTop === 0 && deltaY < 0) {
      this.#owner = 'content';
      return;
    }

    this.#owner = 'sheet';

    this.#beginDrag(event);
  }

  /**
   * Start tracking a drag from the current pointer position.
   *
   * The drag origin is the slop crossing point rather than the touch-down
   * point, so the sheet starts moving from zero instead of jumping by the
   * slop distance.
   * @param event - The pointermove event that crossed the threshold
   */
  #beginDrag(event: PointerEvent): void {
    this.#startY = event.clientY;
    this.#currentY = event.clientY;
    this.#startTranslateY = this.#config.getPosition();

    this.#velocityTracker.reset();
    this.#velocityTracker.addSample(event.timeStamp, event.clientY);

    this.#config.onDragStart();

    try {
      this.#config.element.setPointerCapture(event.pointerId);
      this.#captured = true;
    } catch (error) {
      console.warn('Failed to capture pointer:', error);
    }
  }

  /**
   * Find the nearest scrollable ancestor of the target within the sheet
   * @param target - The element the gesture started on
   * @returns The scrollable element, or null when there is none
   */
  #findScroller(target: Element): Element | null {
    const root = this.#config.element;
    let node: Element | null = target;

    while (node !== null) {
      if (this.#isScrollable(node)) {
        return node;
      }

      if (node === root) {
        return null;
      }

      node = node.parentElement;
    }

    return null;
  }

  /**
   * Whether an element scrolls vertically and has content to scroll
   * @param node - The element to test
   */
  #isScrollable(node: Element): boolean {
    if (node.scrollHeight <= node.clientHeight) {
      return false;
    }

    const overflowY = window.getComputedStyle(node).getPropertyValue('overflow-y');

    return overflowY === 'auto' || overflowY === 'scroll';
  }

  /**
   * Schedule a move update on the next animation frame.
   * Notifies the caller first so a drag move takes over a running animation.
   */
  #scheduleMoveFrame(): void {
    this.#config.onTakeover();

    if (this.#frame !== null) {
      cancelAnimationFrame(this.#frame);
    }

    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;

      const deltaY = this.#currentY - this.#startY;
      this.#emitMoveFrame(deltaY);
    });
  }

  /**
   * Compute movement data for the current delta and report it
   * @param deltaY - Y delta from the point where the drag began
   */
  #emitMoveFrame(deltaY: number): void {
    const sheetHeight = this.#config.getSheetHeight();
    const adjustedY = this.#resistantPosition(deltaY);
    const ratio = 1 - (sheetHeight ? adjustedY / sheetHeight : 0);

    this.#config.onMove({
      adjustedY,
      deltaY,
      ratio,
      velocity: this.#velocityTracker.getVelocity(performance.now()),
    });
  }

  /**
   * Calculate the adjusted position based on Apple's rubber band formula.
   *
   * Three zones:
   * 1. Past top bound (rawPosition < 0): rubber band resistance
   * 2. Between bounds (0 <= rawPosition <= sheetHeight): track finger 1:1
   * 3. Past bottom (rawPosition > sheetHeight): clamped (shouldn't happen normally)
   *
   * @param deltaY - Y delta from the point where the drag began
   * @returns Adjusted absolute translateY position
   */
  #resistantPosition(deltaY: number): number {
    if (deltaY === 0) {
      return this.#startTranslateY;
    }

    const rawPosition = this.#startTranslateY + deltaY;

    // Past top bound: apply rubber band resistance
    if (rawPosition < 0) {
      const overscroll = -rawPosition;
      const resistedOverscroll = rubberBand(
        overscroll,
        this.#config.getSheetHeight(),
        RUBBER_BAND_COEFFICIENT,
      );
      return -resistedOverscroll;
    }

    // Within bounds or dragging down toward dismiss: track finger 1:1
    return rawPosition;
  }

  /**
   * Decide whether to snap back or dismiss after release.
   *
   * Uses Apple's velocity projection model: projects where the sheet would
   * come to rest after decelerating, then decides based on that projected
   * position. If the projection passes the midpoint of the sheet height,
   * the sheet is dismissed. Otherwise it snaps back to the open position.
   *
   * @param velocityPxPerMs - Release velocity from the tracker (px/ms)
   */
  #release(velocityPxPerMs: number): void {
    const deltaY = this.#currentY - this.#startY;
    const velocity = (velocityPxPerMs || 0) * 1000;

    // Dragging up: always snap back to the open position
    if (deltaY <= 0) {
      this.#config.onRelease({ shouldDismiss: false, velocity });
      return;
    }

    // Dragging down: project where the sheet would come to rest
    const currentY = this.#resistantPosition(deltaY);
    const displacement = projectDisplacement(velocity, DECELERATION_RATE);
    const projectedY = currentY + displacement;

    this.#config.onRelease({
      shouldDismiss: projectedY > this.#config.getSheetHeight() * 0.5,
      velocity,
    });
  }

  /**
   * Release the pointer, if this gesture ever captured one
   * @param pointerId - The pointer to release
   */
  #releasePointerCapture(pointerId: number): void {
    if (!this.#captured) {
      return;
    }

    this.#captured = false;

    try {
      this.#config.element.releasePointerCapture(pointerId);
    } catch (error) {
      console.warn('Failed to release pointer:', error);
    }
  }

  /**
   * Return to the idle state and drop any pending frame
   */
  #resetGesture(): void {
    this.#pointerId = null;
    this.#owner = 'content';
    this.#scroller = null;
    this.#captured = false;

    if (this.#frame !== null) {
      cancelAnimationFrame(this.#frame);
      this.#frame = null;
    }
  }
}
