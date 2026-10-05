/**
 * Value produced by parsing a data attribute
 */
export type AttributeValue = boolean | null | number | string;

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
