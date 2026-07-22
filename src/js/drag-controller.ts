import { RUBBER_BAND_COEFFICIENT, DECELERATION_RATE } from './constants';
import { rubberBand, projectDisplacement, VelocityTracker } from './utils';

/**
 * Movement data for a single animation-frame-batched drag update
 */
export interface DragMoveFrame {
  /** Adjusted absolute translateY position after rubber band resistance (px) */
  adjustedY: number;

  /** Raw Y delta from the gesture start position (px) */
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
  /** Element that initiates the drag gesture */
  handle: HTMLElement;

  /** Returns the current sheet translateY (px), read at gesture start */
  getPosition: () => number;

  /** Returns the total sheet height (px) for resistance and projection */
  getSheetHeight: () => number;

  /** Whether drag processing is currently allowed */
  isEnabled: () => boolean;

  /** Called when a drag gesture starts (pointer down) */
  onDragStart: () => void;

  /** Called synchronously on each move so a drag takes over a running animation */
  onTakeover: () => void;

  /** Called on each animation-frame-batched move */
  onMove: (frame: DragMoveFrame) => void;

  /** Called when the gesture ends (release or abort), before any release decision */
  onDragEnd: () => void;

  /** Called with the snap/dismiss decision after release */
  onRelease: (release: DragRelease) => void;
}

/**
 * Drag controller for BootstrapSheet.
 *
 * Owns pointer input and gesture physics: event listeners, animation-frame
 * batching of moves, windowed velocity tracking, rubber band resistance and
 * the snap/dismiss decision on release. DOM side effects (transform, backdrop
 * opacity, class names, events, animations) are delegated to the caller via
 * callbacks. This module is the foundation for whole-root dragging and
 * detents in upcoming releases.
 */
export default class DragController {
  /** Configuration object */
  #config: DragControllerConfig;

  /** Whether a drag gesture is in progress */
  #dragging = false;

  /** Pending animation frame ID for batched move updates */
  #frame: number | null = null;

  /** Windowed velocity tracker for gesture measurement */
  #velocityTracker = new VelocityTracker(100);

  /** Initial Y coordinate when the drag starts */
  #startY = 0;

  /** Current Y coordinate during the drag */
  #currentY = 0;

  /** Initial translateY value when the drag starts */
  #startTranslateY = 0;

  constructor(config: DragControllerConfig) {
    this.#config = config;
  }

  /**
   * Whether a drag gesture is currently in progress
   */
  get isDragging(): boolean {
    return this.#dragging;
  }

  /**
   * Attach pointer event listeners
   */
  attach(): void {
    this.#config.handle.addEventListener('pointerdown', this.#onPointerDown, {
      passive: false,
    });

    document.addEventListener('pointermove', this.#onPointerMove);
    document.addEventListener('pointerup', this.#onPointerUp);
    document.addEventListener('pointercancel', this.#onPointerUp);
  }

  /**
   * Detach pointer event listeners and cancel any pending frame
   */
  detach(): void {
    this.#config.handle.removeEventListener('pointerdown', this.#onPointerDown);

    document.removeEventListener('pointermove', this.#onPointerMove);
    document.removeEventListener('pointerup', this.#onPointerUp);
    document.removeEventListener('pointercancel', this.#onPointerUp);

    this.#cancelPendingFrame();
  }

  /**
   * Abort the current drag gesture without a release decision
   */
  abort(): void {
    if (!this.#dragging) {
      return;
    }

    this.#dragging = false;
    this.#cancelPendingFrame();
    this.#config.onDragEnd();
  }

  /**
   * Handle pointer down to start dragging
   */
  #onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();

    this.#dragging = true;
    this.#startY = event.clientY;
    this.#currentY = event.clientY;
    this.#startTranslateY = this.#config.getPosition();

    this.#velocityTracker.reset();
    this.#velocityTracker.addSample(event.timeStamp, event.clientY);

    this.#config.onDragStart();

    try {
      if (event.target instanceof Element) {
        event.target.setPointerCapture(event.pointerId);
      }
    } catch (error) {
      console.warn('Failed to capture pointer:', error);
    }
  };

  /**
   * Handle pointer move to update the drag
   */
  #onPointerMove = (event: PointerEvent): void => {
    if (!this.#dragging || !this.#config.isEnabled()) {
      return;
    }

    this.#currentY = event.clientY;

    this.#velocityTracker.addSample(event.timeStamp, event.clientY);

    this.#scheduleMoveFrame();
  };

  /**
   * Handle pointer up (or cancel) to end the drag
   */
  #onPointerUp = (event: PointerEvent): void => {
    if (!this.#dragging) {
      return;
    }

    this.#dragging = false;
    this.#cancelPendingFrame();
    this.#config.onDragEnd();

    const velocity = this.#velocityTracker.getVelocity(event.timeStamp);

    try {
      if (event.target instanceof Element) {
        event.target.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      console.warn('Failed to release pointer:', error);
    }

    this.#release(velocity);
  };

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
   * @param deltaY - Raw Y delta from the gesture start position
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
   * @param deltaY - Raw Y delta from the gesture start position
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
   * Cancel the pending batched move frame, if any
   */
  #cancelPendingFrame(): void {
    if (this.#frame !== null) {
      cancelAnimationFrame(this.#frame);
      this.#frame = null;
    }
  }
}
