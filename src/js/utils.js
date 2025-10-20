/**
 * Parse data attribute value to appropriate JavaScript type
 * @param {string} value - The attribute value to parse
 * @returns {boolean|null|number|string} The parsed value
 * @example
 * parseAttributeValue('true'); // returns true (boolean)
 * parseAttributeValue('false'); // returns false (boolean)
 * parseAttributeValue('null'); // returns null
 * parseAttributeValue('123'); // returns 123 (number)
 * parseAttributeValue('45.67'); // returns 45.67 (number)
 * parseAttributeValue('some string'); // returns 'some string' (string)
 */
export const parseAttributeValue = (value) => {
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
 * @param {Element} element - The DOM element to extract data attributes from
 * @param {string} [prefix='bs'] - The data attribute prefix (without 'data-')
 * @returns {Object} Object with camelCase keys and parsed values
 * @example
 * // Given an element <div data-bs-backdrop="true" data-bs-animation-duration="300"></div>
 * extractDataAttributes(element);
 * // Returns: { backdrop: true, animationDuration: 300 }
 */
export const extractDataAttributes = (element, prefix = 'bs') => {
  if (!(element instanceof Element)) {
    return {};
  }

  const { dataset } = element;

  if (!dataset) {
    return {};
  }

  const attributes = {};
  const normalizedPrefix = prefix.toLowerCase();
  const prefixLength = normalizedPrefix.length;

  for (const [dataKey, dataValue] of Object.entries(dataset)) {
    if (!dataKey.toLowerCase().startsWith(normalizedPrefix)) {
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
 * @param {Element|string} elementOrSelector - Element or CSS selector
 * @param {Document|Element} [context=document] - Context for querySelector
 * @throws {Error} If elementOrSelector is invalid
 * @returns {Element|null} Resolved element or null
 * @example
 * resolveElement('#myElement'); // returns the element with ID 'myElement'
 * resolveElement(someElement); // returns someElement if it's an Element
 */
export const resolveElement = (elementOrSelector, context = document) => {
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
 * Force a reflow/repaint of the element
 * @param {Element} element - The element to reflow
 * @returns {number} The element's offsetHeight
 * @see {@link https://gist.github.com/paulirish/5d52fb081b3570c81e3a}
 * @example
 * reflow(someElement); // forces reflow and returns offsetHeight
 */
export const reflow = (element) => {
  if (!(element instanceof Element)) {
    return 0;
  }

  return element.offsetHeight;
};

/**
 * Clamp a number between a minimum and maximum value
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} The clamped value
 * @example
 * clamp(5, 1, 10); // returns 5
 * clamp(0, 1, 10); // returns 1
 * clamp(15, 1, 10); // returns 10
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Extract target selector from trigger element
 * @param {Element} element - The trigger element
 * @returns {string|null} Target selector or null
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
export const extractTargetSelector = (element) => {
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
 * @returns {number} Scrollbar width in pixels
 * @example
 * const scrollbarWidth = getScrollbarWidth(); // e.g., returns 15
 */
export const getScrollbarWidth = () => {
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
 * @param {any} value - Any value
 * @returns {string} Type name (e.g., 'string', 'number', 'array')
 * @example
 * getValueType(123); // returns 'number'
 * getValueType('hello'); // returns 'string'
 * getValueType([1, 2, 3]); // returns 'array'
 * getValueType({ key: 'value' }); // returns 'object'
 * getValueType(null); // returns 'null'
 * getValueType(undefined); // returns 'undefined'
 */
export const getValueType = (value) => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

/**
 * Parse a type string into an array of allowed types
 * @param {string} types - Type string like "(string|number)"
 * @returns {string[]} Array of allowed type names
 * @example
 * parseExpectedTypes('(string|number)'); // returns ['string', 'number']
 * parseExpectedTypes('boolean'); // returns ['boolean']
 * parseExpectedTypes('(array|object|null)'); // returns ['array', 'object', 'null']
 * parseExpectedTypes(''); // returns []
 */
export const parseExpectedTypes = (types) => {
  return types
    .replace(/\s+/g, '')
    .replace(/^\(|\)$/g, '')
    .split('|')
    .filter(Boolean);
};

/**
 * Validate configuration object against type definitions
 * @param {string} componentName - Component name for error messages
 * @param {Object} config - Configuration object to validate
 * @param {Object} configTypes - Type definitions
 * @throws {TypeError} If a config property has an invalid type
 * @example
 * const config = { backdrop: true, animationDuration: 300 };
 * const configTypes = { backdrop: 'boolean', animationDuration: 'number' };
 * validateConfigTypes('Sheet', config, configTypes); // No error
 *
 * const invalidConfig = { backdrop: 'yes', animationDuration: 300 };
 * validateConfigTypes('Sheet', invalidConfig, configTypes);
 * // Throws TypeError: [Sheet] Option "backdrop" has invalid type: expected boolean, but received string.
 */
export const validateConfigTypes = (componentName, config = {}, configTypes = {}) => {
  for (const propertyName in configTypes) {
    if (!Object.prototype.hasOwnProperty.call(configTypes, propertyName)) {
      continue;
    }

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
};

/**
 * Execute callback after CSS transition completes or after a timeout
 * @param {Element} element - The DOM element to observe
 * @param {Function} callback - The callback function to execute
 * @param {number} [duration=300] - Expected transition duration in ms
 * @returns {Function} Cleanup function to cancel the callback
 * @example
 * const cleanup = executeAfterTransition(someElement, () => {
 *   console.log('Transition ended or timeout reached');
 * }, 500);
 *
 * // To cancel the callback before it executes:
 * cleanup();
 */
export const executeAfterTransition = (element, callback, duration = 300) => {
  if (!(element instanceof Element)) {
    callback();
    return () => {};
  }

  let isExecuted = false;
  let timeoutId = null;

  /**
   * Execute the callback once
   * @inner
   */
  const executeOnce = () => {
    if (isExecuted) {
      return;
    }

    isExecuted = true;
    cleanupListeners();

    try {
      callback();
    } catch (error) {
      console.error('Error in transition callback:', error);
    }
  };

  /**
   * Handle the transition end event
   * @param {TransitionEvent} event - The transition end event
   * @inner
   */
  const handleTransitionEnd = (event) => {
    if (event.target === element) {
      executeOnce();
    }
  };

  /**
   * Cleanup event listeners and timeout
   * @inner
   */
  const cleanupListeners = () => {
    element.removeEventListener('transitionend', handleTransitionEnd);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  element.addEventListener('transitionend', handleTransitionEnd);

  timeoutId = setTimeout(executeOnce, duration + 50);

  return () => {
    if (!isExecuted) {
      cleanupListeners();
      isExecuted = true;
    }
  };
};

/**
 * Get the vertical translation (Y-axis) of a DOM element
 * @param {Element} element - The DOM element to measure
 * @returns {number} The vertical translation in pixels
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix}
 * @example
 * // Given an element with transform: translateY(100px);
 * const translateY = getTranslateY(someElement); // returns 100
 *
 * // Given an element with no transform
 * const translateY = getTranslateY(someElement); // returns 0
 */
export const getTranslateY = (element) => {
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
