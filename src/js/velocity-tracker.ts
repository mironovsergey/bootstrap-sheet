/**
 * Sample recorded by the velocity tracker
 */
interface VelocitySample {
  timestamp: number;
  position: number;
}

/**
 * Windowed velocity tracker for touch/pointer gestures.
 *
 * iOS's UIPanGestureRecognizer computes velocity from recent touch samples
 * rather than the full gesture history. This class replicates that approach
 * by maintaining a sliding window of {timestamp, position} samples and
 * computing velocity from the oldest and newest entries within the window.
 *
 * Key behaviors:
 * - Only samples within the last `windowMs` milliseconds are considered
 * - If the gesture pauses (gap > windowMs before release), velocity is 0
 * - Guards against division by zero from identical timestamps
 * - Uses event.timeStamp (backed by performance.now) for microsecond precision
 */
export default class VelocityTracker {
  /** Recorded samples within the sliding window */
  #samples: VelocitySample[] = [];

  /** Window size in milliseconds */
  #windowMs: number;

  /**
   * @param windowMs - Time window for velocity calculation (ms)
   */
  constructor(windowMs = 100) {
    this.#windowMs = windowMs;
  }

  /**
   * Record a position sample at the given timestamp.
   *
   * Old samples (older than 2× the window) are pruned to prevent
   * unbounded memory growth during long drag gestures.
   *
   * @param timestamp - Event timestamp in ms (use event.timeStamp)
   * @param position - Current position in px
   */
  addSample(timestamp: number, position: number): void {
    this.#samples.push({ timestamp, position });

    // Prune samples older than 2× window to bound memory
    const cutoff = timestamp - this.#windowMs * 2;
    this.#samples = this.#samples.filter((s) => s.timestamp > cutoff);
  }

  /**
   * Compute velocity from samples within the time window.
   *
   * Returns 0 if:
   * - Fewer than 2 samples exist within the window
   * - Time delta between first and last sample is 0 (identical timestamps)
   * - The gesture has paused (no recent samples)
   *
   * @param currentTimestamp - Current time in ms (from pointerup event)
   * @returns Velocity in px/ms (positive = downward movement)
   */
  getVelocity(currentTimestamp: number): number {
    const cutoff = currentTimestamp - this.#windowMs;
    const recent = this.#samples.filter((s) => s.timestamp >= cutoff);

    if (recent.length < 2) {
      return 0;
    }

    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.timestamp - first.timestamp;

    if (dt === 0) {
      return 0;
    }

    return (last.position - first.position) / dt;
  }

  /**
   * Clear all recorded samples. Call when a new gesture begins.
   */
  reset(): void {
    this.#samples = [];
  }
}
