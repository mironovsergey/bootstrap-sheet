import { solveSpring, isSpringSettled } from './utils';
import type { SpringParams, SpringState } from './utils';

export type { SpringParams } from './utils';

/**
 * Options for a single spring animation run
 */
export interface SpringAnimationOptions {
  /** Starting position (px) */
  from: number;

  /** Target position (px) */
  to: number;

  /** Velocity at animation start (px/s), enables seamless gesture handoff */
  initialVelocity?: number;

  /** Physical spring constants */
  params: SpringParams;

  /** Called every frame with the current position */
  onFrame: (position: number) => void;

  /** Called once when the spring settles at the target */
  onSettle?: () => void;
}

/**
 * Spring animation driver for BootstrapSheet.
 *
 * Runs a requestAnimationFrame loop around the analytical spring solution.
 * Unlike easing-based animation, the spring has no fixed duration - it runs
 * until position and velocity settle below threshold. The initial velocity
 * enables seamless handoff from a gesture: the spring starts moving at the
 * same speed the finger was moving at release.
 *
 * The driver is DOM-agnostic: it only produces positions via `onFrame`;
 * applying them (transform, backdrop opacity, class names) is the caller's
 * responsibility.
 */
export default class SpringAnimator {
  /** Pending animation frame ID (null when idle) */
  #frame: number | null = null;

  /**
   * Start a spring animation, canceling any previous one
   * @param options - Animation parameters and callbacks
   */
  start(options: SpringAnimationOptions): void {
    const { from, to, initialVelocity = 0, params, onFrame, onSettle } = options;

    this.cancel();

    let state: SpringState = {
      position: from,
      velocity: initialVelocity,
    };

    let lastTime: number | null = null;

    const animate = (currentTime: number): void => {
      if (lastTime === null) {
        lastTime = currentTime;
      }

      // Cap dt so a long pause (tab switch) resumes smoothly rather than teleporting.
      const dt = Math.min((currentTime - lastTime) / 1000, 1 / 30);
      lastTime = currentTime;

      state = solveSpring(state, to, params, dt);

      onFrame(state.position);

      if (isSpringSettled(state, to)) {
        this.#frame = null;
        onSettle?.();
      } else {
        this.#frame = requestAnimationFrame(animate);
      }
    };

    this.#frame = requestAnimationFrame(animate);
  }

  /**
   * Cancel the running animation (no-op when idle)
   */
  cancel(): void {
    if (this.#frame !== null) {
      cancelAnimationFrame(this.#frame);
      this.#frame = null;
    }
  }
}
