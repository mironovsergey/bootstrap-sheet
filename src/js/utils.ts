/**
 * Value produced by parsing a data attribute
 */
export type AttributeValue = boolean | null | number | string;

/**
 * Physical spring constants (produced by `springParameters`)
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
 * Parse data attribute value to appropriate JavaScript type
 * @param value - The attribute value to parse
 * @returns The parsed value
 * @example
 * parseAttributeValue('true'); // returns true (boolean)
 * parseAttributeValue('false'); // returns false (boolean)
 * parseAttributeValue('null'); // returns null
 * parseAttributeValue('123'); // returns 123 (number)
 * parseAttributeValue('45.67'); // returns 45.67 (number)
 * parseAttributeValue('some string'); // returns 'some string' (string)
 */
export const parseAttributeValue = (value: string): AttributeValue => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (value === 'null') {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }

  return value;
};

/**
 * Extract data attributes from an element with a given prefix
 * @param element - The DOM element to extract data attributes from
 * @param prefix - The data attribute prefix (without 'data-')
 * @returns Object with camelCase keys and parsed values
 * @example
 * // Given an element <div data-bs-backdrop="true"></div>
 * extractDataAttributes(element);
 * // Returns: { backdrop: true }
 */
export const extractDataAttributes = (
  element: unknown,
  prefix = 'bs',
): Record<string, AttributeValue> => {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
    return {};
  }

  const { dataset } = element;

  const attributes: Record<string, AttributeValue> = {};
  const normalizedPrefix = prefix.toLowerCase();
  const prefixLength = normalizedPrefix.length;

  for (const [dataKey, dataValue] of Object.entries(dataset)) {
    if (dataValue === undefined || !dataKey.toLowerCase().startsWith(normalizedPrefix)) {
      continue;
    }

    const suffix = dataKey.slice(prefixLength);

    if (!suffix) {
      continue;
    }

    const propertyName = suffix.charAt(0).toLowerCase() + suffix.slice(1);

    attributes[propertyName] = parseAttributeValue(dataValue);
  }

  return attributes;
};

/**
 * Resolve an element from a selector or an element reference
 * @param elementOrSelector - Element or CSS selector
 * @param context - Context for querySelector
 * @returns Resolved element or null
 * @example
 * resolveElement('#myElement'); // returns the element with ID 'myElement'
 * resolveElement(someElement); // returns someElement if it's an Element
 */
export const resolveElement = (
  elementOrSelector: Element | string | null | undefined,
  context: Document | Element = document,
): Element | null => {
  if (!elementOrSelector) {
    return null;
  }

  if (elementOrSelector instanceof Element) {
    return elementOrSelector;
  }

  if (typeof elementOrSelector === 'string') {
    try {
      return context.querySelector(elementOrSelector);
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Clamp a number between a minimum and maximum value
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 * @example
 * clamp(5, 1, 10); // returns 5
 * clamp(0, 1, 10); // returns 1
 * clamp(15, 1, 10); // returns 10
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Extract target selector from trigger element
 * @param element - The trigger element
 * @returns Target selector or null
 * @example
 * // Given an element <a data-bs-target="#mySheet"></a>
 * extractTargetSelector(element); // returns '#mySheet'
 * // Given an element <a href="#mySheet"></a>
 * extractTargetSelector(element); // returns '#mySheet'
 * // Given an element <a href="https://example.com/page#mySheet"></a>
 * extractTargetSelector(element); // returns '#mySheet'
 * // Given an element <a href="https://example.com/page"></a>
 * extractTargetSelector(element); // returns null
 */
export const extractTargetSelector = (element: unknown): string | null => {
  if (!(element instanceof Element)) {
    return null;
  }

  // Prioritize data-bs-target over href
  const targetValue = element.getAttribute('data-bs-target') || element.getAttribute('href');

  if (!targetValue || targetValue === '#') {
    return null;
  }

  if (targetValue.startsWith('#')) {
    return targetValue.length > 1 ? targetValue : null;
  }

  try {
    const url = new URL(targetValue, window.location.href);
    const hash = url.hash;

    return hash && hash.length > 1 ? hash : null;
  } catch {
    return null;
  }
};

/**
 * Calculate scrollbar width by creating a temporary element
 * @returns Scrollbar width in pixels
 * @example
 * const scrollbarWidth = getScrollbarWidth(); // e.g., returns 15
 */
export const getScrollbarWidth = (): number => {
  if (!document.body) {
    return 0;
  }

  const scrollDiv = document.createElement('div');

  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';
  scrollDiv.style.width = '50px';
  scrollDiv.style.height = '50px';
  scrollDiv.style.overflow = 'scroll';

  document.body.appendChild(scrollDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
};

/**
 * Get the type of a value as a lowercase string
 * @param value - Any value
 * @returns Type name (e.g. 'string', 'number', 'array')
 * @example
 * getValueType(123); // returns 'number'
 * getValueType('hello'); // returns 'string'
 * getValueType([1, 2, 3]); // returns 'array'
 * getValueType({ key: 'value' }); // returns 'object'
 * getValueType(null); // returns 'null'
 * getValueType(undefined); // returns 'undefined'
 */
export const getValueType = (value: unknown): string => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

/**
 * Parse a type string into an array of allowed types
 * @param types - Type string like "(string|number)"
 * @returns Array of allowed type names
 * @example
 * parseExpectedTypes('(string|number)'); // returns ['string', 'number']
 * parseExpectedTypes('boolean'); // returns ['boolean']
 * parseExpectedTypes('(array|object|null)'); // returns ['array', 'object', 'null']
 * parseExpectedTypes(''); // returns []
 */
export const parseExpectedTypes = (types: string): string[] => {
  return types
    .replace(/\s+/g, '')
    .replace(/^\(|\)$/g, '')
    .split('|')
    .filter(Boolean);
};

/**
 * Validate configuration object against type definitions.
 *
 * Acts as an assertion function: when it returns without throwing, every
 * property listed in `configTypes` is runtime-proven to match its declared
 * type, so the config can be treated as `T` from that point on.
 *
 * @param componentName - Component name for error messages
 * @param config - Configuration object to validate
 * @param configTypes - Type definitions
 * @throws {TypeError} If a config property has an invalid type
 * @example
 * const config = { backdrop: true };
 * const configTypes = { backdrop: 'boolean' };
 * validateConfigTypes('Sheet', config, configTypes); // No error
 *
 * const invalidConfig = { backdrop: 'yes' };
 * validateConfigTypes('Sheet', invalidConfig, configTypes);
 * // Throws TypeError: [Sheet] Option "backdrop" has invalid type: expected boolean, but received string.
 */
export function validateConfigTypes<T>(
  componentName: string,
  config: Record<string, unknown> = {},
  configTypes: Record<string, string> = {},
): asserts config is Record<string, unknown> & T {
  for (const propertyName of Object.keys(configTypes)) {
    const expectedTypes = configTypes[propertyName];
    const actualValue = config[propertyName];

    if (actualValue === undefined) {
      continue;
    }

    const actualType = getValueType(actualValue);
    const allowedTypes = parseExpectedTypes(expectedTypes);
    const isValid = allowedTypes.some((allowedType) => actualType === allowedType);

    if (!isValid) {
      throw new TypeError(
        `[${componentName}] Option "${propertyName}" has invalid type: ` +
          `expected ${allowedTypes.join(' | ')}, but received ${actualType}.`,
      );
    }
  }
}

/**
 * Get the vertical translation (Y-axis) of a DOM element
 * @param element - The DOM element to measure
 * @returns The vertical translation in pixels
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix}
 * @example
 * // Given an element with transform: translateY(100px);
 * const translateY = getTranslateY(someElement); // returns 100
 *
 * // Given an element with no transform
 * const translateY = getTranslateY(someElement); // returns 0
 */
export const getTranslateY = (element: unknown): number => {
  if (!(element instanceof Element)) {
    return 0;
  }

  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.transform;

  if (!transform || transform === 'none') {
    return 0;
  }

  try {
    const matrix = new DOMMatrix(transform);
    return matrix.m42;
  } catch {
    return 0;
  }
};

/**
 * Apple's rubber band formula (reverse-engineered from UIScrollView).
 *
 * Attempt to move past a boundary results in diminishing returns:
 * the displayed offset asymptotically approaches `dimension` but never reaches it.
 * Initial slope equals `coefficient`, so the first few pixels of overscroll
 * move at (coefficient × 100)% of finger speed.
 *
 * Formula: b = (1 - 1 / (x * c / d + 1)) * d
 * Equivalent: b = (x * d * c) / (d + c * x)
 *
 * @param offset - How far past the boundary (must be >= 0)
 * @param dimension - Reference dimension (sheet height)
 * @param coefficient - Resistance coefficient (Apple uses 0.55)
 * @returns Displayed offset (always >= 0, always < dimension)
 * @see {@link https://gist.github.com/originell/6961057} Analysis of Apple's rubber band scrolling
 */
export const rubberBand = (offset: number, dimension: number, coefficient: number): number => {
  if (offset === 0 || dimension === 0) {
    return 0;
  }

  return (1.0 - 1.0 / ((offset * coefficient) / dimension + 1.0)) * dimension;
};

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
export const springParameters = (dampingRatio: number, response: number): SpringParams => {
  return {
    stiffness: Math.pow((2 * Math.PI) / response, 2),
    damping: (4 * Math.PI * dampingRatio) / response,
    mass: 1,
  };
};

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
export const isSpringSettled = (
  state: SpringState,
  target: number,
  positionThreshold = 0.5,
  velocityThreshold = 0.5,
): boolean => {
  return (
    Math.abs(state.position - target) < positionThreshold &&
    Math.abs(state.velocity) < velocityThreshold
  );
};

/**
 * Project how far a decelerating object will travel before stopping.
 *
 * This is Apple's formula from WWDC 2018 "Designing Fluid Interfaces".
 * Given a release velocity and a deceleration rate, it computes the total
 * displacement the object would cover if allowed to coast to a stop.
 *
 * UIScrollView uses two deceleration rates:
 * - 0.998 (UIScrollView.DecelerationRate.normal) - default, ~499px per 1000px/s
 * - 0.99  (UIScrollView.DecelerationRate.fast)   - snappier, ~99px per 1000px/s
 *
 * The exact integral formula is `-v₀ / (1000 · ln(d))`, which differs from
 * Apple's published approximation by less than 1%.
 *
 * @param velocity - Release velocity in px/s (positive = downward)
 * @param decelerationRate - Deceleration rate (0–1, higher = more coasting)
 * @returns Projected displacement in px (same sign as velocity)
 */
export const projectDisplacement = (velocity: number, decelerationRate: number): number => {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
};

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
export const solveSpring = (
  state: SpringState,
  target: number,
  params: SpringParams,
  dt: number,
): SpringState => {
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
};

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
export class VelocityTracker {
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
