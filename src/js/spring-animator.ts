/**
 * Physical spring constants (produced by `SpringAnimator.physicalParameters`)
 */
export interface SpringParams {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Current spring state
 */
export interface SpringState {
  position: number;
  velocity: number;
}

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
   * Convert designer-friendly spring parameters to physical constants.
   *
   * Apple introduced this parameterization at WWDC 2018 ("Designing Fluid Interfaces"):
   * - `dampingRatio` controls bounce (1.0 = no bounce, <1.0 = bouncy)
   * - `response` controls speed (lower = faster, analogous to duration)
   *
   * Conversion assumes mass = 1:
   * - `stiffness = (2π / response)²`
   * - `damping = 4π · dampingRatio / response`
   *
   * @param dampingRatio - Damping ratio (1.0 = critically damped, 0.8 = slight bounce)
   * @param response - Response time in seconds (0.4 is a good default)
   * @returns Physical spring constants
   */
  static physicalParameters(dampingRatio: number, response: number): SpringParams {
    return {
      stiffness: Math.pow((2 * Math.PI) / response, 2),
      damping: (4 * Math.PI * dampingRatio) / response,
      mass: 1,
    };
  }

  /**
   * Advance spring state by dt using the exact analytical solution.
   *
   * Unconditionally stable for any dt, stiffness, or damping - no sub-stepping
   * or numerical integration required. Solves the ODE exactly:
   * m·x'' + c·x' + k·(x − target) = 0
   *
   * Three regimes, determined by the damping ratio ζ = c / (2√km):
   *   ζ < 1  underdamped  - oscillatory exponential decay
   *   ζ ≈ 1  critically damped - fastest non-oscillatory convergence
   *   ζ > 1  overdamped  - two real exponentials, slower than critical
   *
   * @param state - Current state
   * @param target - Target position the spring pulls toward
   * @param params - Spring constants
   * @param dt - Time step in seconds (any positive value is stable)
   * @returns Exact state at t + dt
   */
  static solve(state: SpringState, target: number, params: SpringParams, dt: number): SpringState {
    const { position, velocity } = state;
    const { stiffness, damping, mass } = params;

    // Initial conditions
    const d0 = position - target;
    const v0 = velocity;

    // Canonical parameters
    const omega0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    // Common exponential decay
    const expDecay = Math.exp(-zeta * omega0 * dt);

    // Wider critical band for numerical stability
    const EPS = 1e-4;

    let d, v;

    if (zeta > 1 - EPS && zeta < 1 + EPS) {
      // Critically damped: d(t) = (A + B·t)·e^(−ω₀t)
      const B = v0 + omega0 * d0;
      d = (d0 + B * dt) * expDecay;
      v = (B - omega0 * (d0 + B * dt)) * expDecay;
    } else if (zeta < 1) {
      // Underdamped: d(t) = e^(−ζω₀t)·[A·cos(ωd·t) + B·sin(ωd·t)]
      const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
      const B = (v0 + zeta * omega0 * d0) / omegaD;
      const cosT = Math.cos(omegaD * dt);
      const sinT = Math.sin(omegaD * dt);
      d = expDecay * (d0 * cosT + B * sinT);
      v =
        expDecay *
        ((-zeta * omega0 * d0 + omegaD * B) * cosT + (-zeta * omega0 * B - omegaD * d0) * sinT);
    } else {
      // Overdamped: d(t) = A·e^(r₁t) + B·e^(r₂t), r₁,r₂ = −ζω₀ ± γ
      const gamma = omega0 * Math.sqrt(zeta * zeta - 1);
      const r1 = -zeta * omega0 + gamma;
      const r2 = -zeta * omega0 - gamma;
      const A = (v0 - r2 * d0) / (2 * gamma);
      const B = d0 - A;
      const e1 = Math.exp(r1 * dt);
      const e2 = Math.exp(r2 * dt);
      d = A * e1 + B * e2;
      v = r1 * A * e1 + r2 * B * e2;
    }

    return { position: target + d, velocity: v };
  }

  /**
   * Check whether a spring animation has settled (converged to target).
   *
   * The animation is considered settled when both the distance from the target
   * and the velocity are below the given threshold. Using 0.5px as the default
   * threshold matches Apple's behavior - sub-pixel movements are imperceptible.
   *
   * @param state - Current spring state
   * @param target - Target position
   * @param positionThreshold - Maximum distance from target (px)
   * @param velocityThreshold - Maximum velocity (px/s)
   * @returns True if the spring has settled
   */
  static isSettled(
    state: SpringState,
    target: number,
    positionThreshold = 0.5,
    velocityThreshold = 0.5,
  ): boolean {
    return (
      Math.abs(state.position - target) < positionThreshold &&
      Math.abs(state.velocity) < velocityThreshold
    );
  }

  /** Whether an animation is currently in flight */
  get isRunning(): boolean {
    return this.#frame !== null;
  }

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

      state = SpringAnimator.solve(state, to, params, dt);

      onFrame(state.position);

      if (SpringAnimator.isSettled(state, to)) {
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
