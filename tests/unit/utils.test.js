import {
  parseAttributeValue,
  extractDataAttributes,
  resolveElement,
  clamp,
  extractTargetSelector,
  getScrollbarWidth,
  getValueType,
  parseExpectedTypes,
  validateConfigTypes,
  getTranslateY,
  rubberBand,
  springParameters,
  isSpringSettled,
  projectDisplacement,
  solveSpring,
  VelocityTracker,
} from '../../src/js/utils';

describe('Utils - parseAttributeValue', () => {
  test('should parse "true" string to boolean true', () => {
    expect(parseAttributeValue('true')).toBe(true);
  });

  test('should parse "false" string to boolean false', () => {
    expect(parseAttributeValue('false')).toBe(false);
  });

  test('should parse "null" string to null', () => {
    expect(parseAttributeValue('null')).toBe(null);
  });

  test('should parse integer strings to numbers', () => {
    expect(parseAttributeValue('123')).toBe(123);
    expect(parseAttributeValue('0')).toBe(0);
    expect(parseAttributeValue('-456')).toBe(-456);
  });

  test('should parse float strings to numbers', () => {
    expect(parseAttributeValue('45.67')).toBe(45.67);
    expect(parseAttributeValue('0.5')).toBe(0.5);
    expect(parseAttributeValue('-12.34')).toBe(-12.34);
  });

  test('should handle numbers with whitespace', () => {
    expect(parseAttributeValue('  123  ')).toBe(123);
    expect(parseAttributeValue('  45.67  ')).toBe(45.67);
  });

  test('should return string for non-parseable values', () => {
    expect(parseAttributeValue('hello')).toBe('hello');
    expect(parseAttributeValue('static')).toBe('static');
    expect(parseAttributeValue('some string')).toBe('some string');
  });

  test('should handle empty strings', () => {
    expect(parseAttributeValue('')).toBe('');
  });

  test('should handle special strings', () => {
    expect(parseAttributeValue('undefined')).toBe('undefined');
    expect(parseAttributeValue('NaN')).toBe('NaN');
    expect(parseAttributeValue('Infinity')).toBe('Infinity');
  });

  test('should not parse numbers with letters', () => {
    expect(parseAttributeValue('123abc')).toBe('123abc');
    expect(parseAttributeValue('abc123')).toBe('abc123');
  });
});

describe('Utils - extractDataAttributes', () => {
  test('should extract data attributes with bs prefix', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs-backdrop', 'true');
    element.setAttribute('data-bs-keyboard', 'false');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      backdrop: true,
      keyboard: false,
    });
  });

  test('should convert data attribute keys to camelCase', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs-spring-damping-ratio', '0.8');
    element.setAttribute('data-bs-spring-response', '0.3');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      springDampingRatio: 0.8,
      springResponse: 0.3,
    });
  });

  test('should ignore data attributes without prefix', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs-backdrop', 'true');
    element.setAttribute('data-other-value', 'ignored');
    element.setAttribute('data-test', 'also-ignored');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      backdrop: true,
    });
  });

  test('should handle custom prefix', () => {
    const element = document.createElement('div');
    element.setAttribute('data-custom-option', 'value');
    element.setAttribute('data-custom-other', '123');

    const result = extractDataAttributes(element, 'custom');

    expect(result).toEqual({
      option: 'value',
      other: 123,
    });
  });

  test('should return empty object for non-Element', () => {
    expect(extractDataAttributes(null)).toEqual({});
    expect(extractDataAttributes(undefined)).toEqual({});
    expect(extractDataAttributes({})).toEqual({});
  });

  test('should return empty object for element without dataset', () => {
    const element = document.createElement('div');
    delete element.dataset;

    const result = extractDataAttributes(element);

    expect(result).toEqual({});
  });

  test('should ignore attributes with only prefix', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs', 'value');

    const result = extractDataAttributes(element);

    expect(result).toEqual({});
  });

  test('should handle case-insensitive prefix matching', () => {
    const element = document.createElement('div');
    element.setAttribute('data-BS-value', 'test');
    element.setAttribute('data-Bs-other', '123');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      value: 'test',
      other: 123,
    });
  });

  test('should parse all value types correctly', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs-boolean', 'true');
    element.setAttribute('data-bs-null', 'null');
    element.setAttribute('data-bs-number', '42');
    element.setAttribute('data-bs-float', '3.14');
    element.setAttribute('data-bs-string', 'hello');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      boolean: true,
      null: null,
      number: 42,
      float: 3.14,
      string: 'hello',
    });
  });
});

describe('Utils - resolveElement', () => {
  test('should return element when passed element', () => {
    const element = document.createElement('div');
    expect(resolveElement(element)).toBe(element);
  });

  test('should return element when passed valid selector', () => {
    const element = document.createElement('div');
    element.id = 'testElement';
    document.body.appendChild(element);

    expect(resolveElement('#testElement')).toBe(element);

    element.remove();
  });

  test('should return null for non-existent selector', () => {
    expect(resolveElement('#nonExistent')).toBeNull();
  });

  test('should return null for invalid selector', () => {
    expect(resolveElement('###invalid')).toBeNull();
  });

  test('should return null for null input', () => {
    expect(resolveElement(null)).toBeNull();
  });

  test('should return null for undefined input', () => {
    expect(resolveElement(undefined)).toBeNull();
  });

  test('should return null for invalid types', () => {
    expect(resolveElement(123)).toBeNull();
    expect(resolveElement({})).toBeNull();
    expect(resolveElement([])).toBeNull();
  });

  test('should work with custom context', () => {
    const container = document.createElement('div');
    const child = document.createElement('span');
    child.id = 'childElement';
    container.appendChild(child);
    document.body.appendChild(container);

    expect(resolveElement('#childElement', container)).toBe(child);

    container.remove();
  });

  test('should handle complex selectors', () => {
    const element = document.createElement('div');
    element.className = 'test-class';
    element.setAttribute('data-test', 'value');
    document.body.appendChild(element);

    expect(resolveElement('.test-class')).toBe(element);
    expect(resolveElement('[data-test="value"]')).toBe(element);

    element.remove();
  });
});

describe('Utils - clamp', () => {
  test('should clamp value between min and max', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(15, 1, 10)).toBe(10);
  });

  test('should handle negative numbers', () => {
    expect(clamp(-5, -10, 0)).toBe(-5);
    expect(clamp(-15, -10, 0)).toBe(-10);
    expect(clamp(5, -10, 0)).toBe(0);
  });

  test('should handle floats', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
  });

  test('should handle same min and max', () => {
    expect(clamp(5, 10, 10)).toBe(10);
    expect(clamp(15, 10, 10)).toBe(10);
  });

  test('should handle edge values', () => {
    expect(clamp(1, 1, 10)).toBe(1);
    expect(clamp(10, 1, 10)).toBe(10);
  });

  test('should work with very large numbers', () => {
    expect(clamp(1e10, 0, 1e6)).toBe(1e6);
    expect(clamp(-1e10, -1e6, 0)).toBe(-1e6);
  });
});

describe('Utils - extractTargetSelector', () => {
  test('should extract selector from data-bs-target', () => {
    const element = document.createElement('button');
    element.setAttribute('data-bs-target', '#mySheet');

    expect(extractTargetSelector(element)).toBe('#mySheet');
  });

  test('should extract selector from href', () => {
    const element = document.createElement('a');
    element.setAttribute('href', '#mySheet');

    expect(extractTargetSelector(element)).toBe('#mySheet');
  });

  test('should prioritize data-bs-target over href', () => {
    const element = document.createElement('a');
    element.setAttribute('data-bs-target', '#targetSheet');
    element.setAttribute('href', '#hrefSheet');

    expect(extractTargetSelector(element)).toBe('#targetSheet');
  });

  test('should extract hash from full URL', () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'https://example.com/page#mySheet');

    expect(extractTargetSelector(element)).toBe('#mySheet');
  });

  test('should return null for empty hash', () => {
    const element = document.createElement('a');
    element.setAttribute('href', '#');

    expect(extractTargetSelector(element)).toBeNull();
  });

  test('should return null for URL without hash', () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'https://example.com/page');

    expect(extractTargetSelector(element)).toBeNull();
  });

  test('should return null for invalid URL', () => {
    const element = document.createElement('a');
    element.setAttribute('href', ':::invalid:::');

    expect(extractTargetSelector(element)).toBeNull();
  });

  test('should return null when URL constructor throws', () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'non-hash-url');

    const OrigURL = global.URL;
    global.URL = function () {
      throw new TypeError('Invalid URL');
    };

    expect(extractTargetSelector(element)).toBeNull();

    global.URL = OrigURL;
  });

  test('should return null for non-Element', () => {
    expect(extractTargetSelector(null)).toBeNull();
    expect(extractTargetSelector(undefined)).toBeNull();
  });

  test('should return null when no target or href', () => {
    const element = document.createElement('button');

    expect(extractTargetSelector(element)).toBeNull();
  });

  test('should handle relative URLs with hash', () => {
    const element = document.createElement('a');
    element.setAttribute('href', '/path/page#section');

    expect(extractTargetSelector(element)).toBe('#section');
  });

  test('should return null for single # character', () => {
    const element = document.createElement('a');
    element.setAttribute('data-bs-target', '#');

    expect(extractTargetSelector(element)).toBeNull();
  });
});

describe('Utils - getScrollbarWidth', () => {
  test('should return scrollbar width', () => {
    const width = getScrollbarWidth();

    expect(typeof width).toBe('number');
    expect(width).toBeGreaterThanOrEqual(0);
  });

  test('should clean up temporary element', () => {
    const initialChildCount = document.body.children.length;

    getScrollbarWidth();

    expect(document.body.children.length).toBe(initialChildCount);
  });

  test('should return 0 if document.body is null', () => {
    const originalBody = document.body;
    Object.defineProperty(document, 'body', {
      configurable: true,
      value: null,
    });

    const width = getScrollbarWidth();

    expect(width).toBe(0);

    Object.defineProperty(document, 'body', {
      configurable: true,
      value: originalBody,
    });
  });

  test('should calculate width from offsetWidth and clientWidth difference', () => {
    const width = getScrollbarWidth();

    // Scrollbar width is typically between 0 and 20px
    expect(width).toBeGreaterThanOrEqual(0);
    expect(width).toBeLessThanOrEqual(20);
  });
});

describe('Utils - getValueType', () => {
  test('should return correct type for primitives', () => {
    expect(getValueType(123)).toBe('number');
    expect(getValueType('hello')).toBe('string');
    expect(getValueType(true)).toBe('boolean');
    expect(getValueType(null)).toBe('null');
    expect(getValueType(undefined)).toBe('undefined');
  });

  test('should return correct type for objects', () => {
    expect(getValueType({})).toBe('object');
    expect(getValueType([])).toBe('array');
    expect(getValueType(new Date())).toBe('date');
    expect(getValueType(/regex/)).toBe('regexp');
  });

  test('should return correct type for functions', () => {
    expect(getValueType(() => {})).toBe('function');
    expect(getValueType(function () {})).toBe('function');
  });

  test('should handle special values', () => {
    expect(getValueType(NaN)).toBe('number');
    expect(getValueType(Infinity)).toBe('number');
    expect(getValueType(Symbol('test'))).toBe('symbol');
  });
});

describe('Utils - parseExpectedTypes', () => {
  test('should parse single type', () => {
    expect(parseExpectedTypes('string')).toEqual(['string']);
    expect(parseExpectedTypes('number')).toEqual(['number']);
    expect(parseExpectedTypes('boolean')).toEqual(['boolean']);
  });

  test('should parse multiple types with pipe', () => {
    expect(parseExpectedTypes('string|number')).toEqual(['string', 'number']);
    expect(parseExpectedTypes('boolean|string')).toEqual(['boolean', 'string']);
  });

  test('should parse types with parentheses', () => {
    expect(parseExpectedTypes('(string|number)')).toEqual(['string', 'number']);
    expect(parseExpectedTypes('(boolean|string|null)')).toEqual(['boolean', 'string', 'null']);
  });

  test('should remove whitespace', () => {
    expect(parseExpectedTypes('string | number')).toEqual(['string', 'number']);
    expect(parseExpectedTypes('  boolean  |  string  ')).toEqual(['boolean', 'string']);
  });

  test('should handle empty string', () => {
    expect(parseExpectedTypes('')).toEqual([]);
  });

  test('should filter out empty values', () => {
    expect(parseExpectedTypes('string||number')).toEqual(['string', 'number']);
  });

  test('should handle complex type definitions', () => {
    expect(parseExpectedTypes('(array|object|null)')).toEqual(['array', 'object', 'null']);
  });
});

describe('Utils - validateConfigTypes', () => {
  test('should not throw for valid types', () => {
    const config = {
      backdrop: true,
      keyboard: false,
    };

    const configTypes = {
      backdrop: 'boolean',
      keyboard: 'boolean',
    };

    expect(() => {
      validateConfigTypes('TestComponent', config, configTypes);
    }).not.toThrow();
  });

  test('should throw TypeError for invalid types', () => {
    const config = {
      backdrop: 'yes',
    };

    const configTypes = {
      backdrop: 'boolean',
    };

    expect(() => {
      validateConfigTypes('TestComponent', config, configTypes);
    }).toThrow(TypeError);

    expect(() => {
      validateConfigTypes('TestComponent', config, configTypes);
    }).toThrow(
      '[TestComponent] Option "backdrop" has invalid type: expected boolean, but received string',
    );
  });

  test('should accept multiple valid types', () => {
    const config1 = { value: true };
    const config2 = { value: 'static' };

    const configTypes = {
      value: '(boolean|string)',
    };

    expect(() => {
      validateConfigTypes('Test', config1, configTypes);
    }).not.toThrow();

    expect(() => {
      validateConfigTypes('Test', config2, configTypes);
    }).not.toThrow();
  });

  test('should ignore undefined values', () => {
    const config = {
      backdrop: undefined,
      keyboard: true,
    };

    const configTypes = {
      backdrop: 'boolean',
      keyboard: 'boolean',
    };

    expect(() => {
      validateConfigTypes('Test', config, configTypes);
    }).not.toThrow();
  });

  test('should ignore unknown config properties', () => {
    const config = {
      backdrop: true,
      unknownOption: 'value',
    };

    const configTypes = {
      backdrop: 'boolean',
    };

    expect(() => {
      validateConfigTypes('Test', config, configTypes);
    }).not.toThrow();
  });

  test('should handle empty config', () => {
    expect(() => {
      validateConfigTypes('Test', {}, { backdrop: 'boolean' });
    }).not.toThrow();
  });

  test('should handle empty configTypes', () => {
    expect(() => {
      validateConfigTypes('Test', { backdrop: true }, {});
    }).not.toThrow();
  });

  test('should validate complex types correctly', () => {
    const config = {
      value: null,
    };

    const configTypes = {
      value: '(boolean|string|null)',
    };

    expect(() => {
      validateConfigTypes('Test', config, configTypes);
    }).not.toThrow();
  });
});

describe('Utils - getTranslateY', () => {
  test('should return translateY value from transform', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(100px)';

    expect(getTranslateY(element)).toBe(100);
  });

  test('should return negative translateY', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(-50px)';

    expect(getTranslateY(element)).toBe(-50);
  });

  test('should return 0 for no transform', () => {
    const element = document.createElement('div');

    expect(getTranslateY(element)).toBe(0);
  });

  test('should return 0 for transform: none', () => {
    const element = document.createElement('div');
    element.style.transform = 'none';

    expect(getTranslateY(element)).toBe(0);
  });

  test('should return 0 for non-Element', () => {
    expect(getTranslateY(null)).toBe(0);
    expect(getTranslateY(undefined)).toBe(0);
  });

  test('should handle floats', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(45.67px)';

    expect(getTranslateY(element)).toBe(45.67);
  });

  test('should extract translateY from matrix', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(75px)';

    // Mock DOMMatrix behavior
    const result = getTranslateY(element);

    expect(result).toBe(75);
  });

  test('should handle transform without unit', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(100)';

    expect(getTranslateY(element)).toBe(100);
  });

  test('should return 0 for invalid transform', () => {
    const element = document.createElement('div');
    element.style.transform = 'invalid';

    expect(getTranslateY(element)).toBe(0);
  });

  test('should return 0 when DOMMatrix throws', () => {
    const element = document.createElement('div');
    element.style.transform = 'translateY(50px)';

    const OrigDOMMatrix = window.DOMMatrix;
    window.DOMMatrix = function () {
      throw new Error('DOMMatrix not supported');
    };

    expect(getTranslateY(element)).toBe(0);

    window.DOMMatrix = OrigDOMMatrix;
  });
});

describe('Utils - rubberBand', () => {
  test('should return 0 for zero offset', () => {
    expect(rubberBand(0, 400, 0.55)).toBe(0);
  });

  test('should return 0 for zero dimension', () => {
    expect(rubberBand(100, 0, 0.55)).toBe(0);
  });

  test('should return a value less than the raw offset (resistance effect)', () => {
    const result = rubberBand(100, 400, 0.55);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  test('should return a value less than the dimension (asymptotic bound)', () => {
    expect(rubberBand(100, 400, 0.55)).toBeLessThan(400);
    expect(rubberBand(10000, 400, 0.55)).toBeLessThan(400);
  });

  test('should return correct value for known input', () => {
    // (1 - 1 / ((100 * 0.55) / 400 + 1)) * 400 ≈ 48.35
    expect(rubberBand(100, 400, 0.55)).toBeCloseTo(48.35, 1);
  });

  test('should increase monotonically with offset', () => {
    const r1 = rubberBand(50, 400, 0.55);
    const r2 = rubberBand(100, 400, 0.55);
    const r3 = rubberBand(200, 400, 0.55);

    expect(r1).toBeLessThan(r2);
    expect(r2).toBeLessThan(r3);
  });

  test('should scale proportionally with dimension', () => {
    const r1 = rubberBand(100, 400, 0.55);
    const r2 = rubberBand(200, 800, 0.55);

    expect(r2).toBeCloseTo(r1 * 2, 5);
  });

  test('should increase resistance with higher coefficient', () => {
    const lowResistance = rubberBand(100, 400, 0.3);
    const highResistance = rubberBand(100, 400, 0.8);

    expect(highResistance).toBeGreaterThan(lowResistance);
  });
});

describe('Utils - springParameters', () => {
  test('should return stiffness, damping, and mass', () => {
    const params = springParameters(1.0, 0.4);

    expect(params).toHaveProperty('stiffness');
    expect(params).toHaveProperty('damping');
    expect(params).toHaveProperty('mass');
  });

  test('should always return mass of 1', () => {
    expect(springParameters(1.0, 0.4).mass).toBe(1);
    expect(springParameters(0.5, 0.2).mass).toBe(1);
  });

  test('should return correct stiffness for response=0.4', () => {
    // stiffness = (2π / 0.4)² ≈ 246.74
    expect(springParameters(1.0, 0.4).stiffness).toBeCloseTo(246.74, 1);
  });

  test('should return correct damping for dampingRatio=1.0, response=0.4', () => {
    // damping = 4π * 1.0 / 0.4 ≈ 31.42
    expect(springParameters(1.0, 0.4).damping).toBeCloseTo(31.42, 1);
  });

  test('should return correct damping for dampingRatio=0.8, response=0.4', () => {
    // damping = 4π * 0.8 / 0.4 ≈ 25.13
    expect(springParameters(0.8, 0.4).damping).toBeCloseTo(25.13, 1);
  });

  test('stiffness should not depend on dampingRatio', () => {
    const p1 = springParameters(1.0, 0.4);
    const p2 = springParameters(0.5, 0.4);

    expect(p1.stiffness).toBeCloseTo(p2.stiffness, 10);
  });

  test('larger response should produce lower stiffness (slower spring)', () => {
    const fast = springParameters(1.0, 0.2);
    const slow = springParameters(1.0, 0.8);

    expect(fast.stiffness).toBeGreaterThan(slow.stiffness);
  });

  test('higher dampingRatio should produce higher damping', () => {
    const low = springParameters(0.5, 0.4);
    const high = springParameters(1.0, 0.4);

    expect(high.damping).toBeGreaterThan(low.damping);
  });

  test('minimum springResponse = 0.1 should produce very high stiffness', () => {
    const params = springParameters(0.8, 0.1);
    // stiffness = (2π / 0.1)² ≈ 3947.8
    expect(params.stiffness).toBeCloseTo(3947.8, 0);
    // damping = 4π * 0.8 / 0.1 ≈ 100.5
    expect(params.damping).toBeCloseTo(100.5, 0);
    expect(params.mass).toBe(1);
  });

  test('maximum springResponse = 1.0 should produce low stiffness (slow spring)', () => {
    const params = springParameters(1.0, 1.0);
    // stiffness = (2π / 1)² ≈ 39.48
    expect(params.stiffness).toBeCloseTo(39.48, 1);
    // damping = 4π * 1.0 / 1.0 ≈ 12.57
    expect(params.damping).toBeCloseTo(12.57, 1);
  });

  test('dampingRatio > 1 should produce overdamped system (damping > critical)', () => {
    const params = springParameters(2.0, 0.4);
    const criticalDamping = 2 * Math.sqrt(params.stiffness * params.mass);
    expect(params.damping).toBeGreaterThan(criticalDamping);
  });

  test('dampingRatio < 1 should produce underdamped system (damping < critical)', () => {
    const params = springParameters(0.2, 0.4);
    const criticalDamping = 2 * Math.sqrt(params.stiffness * params.mass);
    expect(params.damping).toBeLessThan(criticalDamping);
  });
});

describe('Utils - solveSpring', () => {
  const underdampedParams = springParameters(0.8, 0.4); // default
  const criticalParams = springParameters(1.0, 0.4); // critically damped
  const overdampedParams = springParameters(1.5, 0.4); // overdamped

  test('should not change state at equilibrium', () => {
    const state = { position: 0, velocity: 0 };
    const result = solveSpring(state, 0, underdampedParams, 0.016);
    expect(result.position).toBeCloseTo(0, 10);
    expect(result.velocity).toBeCloseTo(0, 10);
  });

  test('should not mutate input state', () => {
    const state = { position: 100, velocity: 0 };
    solveSpring(state, 0, underdampedParams, 0.016);
    expect(state.position).toBe(100);
    expect(state.velocity).toBe(0);
  });

  test('should return correct state at dt = 0', () => {
    const state = { position: 100, velocity: -50 };
    const result = solveSpring(state, 0, underdampedParams, 0);
    expect(result.position).toBeCloseTo(100, 6);
    expect(result.velocity).toBeCloseTo(-50, 6);
  });

  test('should move position toward target (underdamped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = solveSpring(state, 0, underdampedParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
  });

  test('should move position toward target (critically damped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = solveSpring(state, 0, criticalParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
    expect(result.position).toBeGreaterThan(0);
  });

  test('should move position toward target (overdamped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = solveSpring(state, 0, overdampedParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
    expect(result.position).toBeGreaterThan(0);
  });

  test('should converge underdamped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = solveSpring(state, 0, underdampedParams, 0.016);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should converge critically damped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = solveSpring(state, 0, criticalParams, 0.016);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should converge overdamped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = solveSpring(state, 0, overdampedParams, 0.016);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should converge with aggressive springResponse = 0.1 in a single 60fps step', () => {
    // Key regression: numerical Euler integration diverges here (ω₀·dt ≈ 1.05),
    // but solveSpring is exact and stable regardless of stiffness.
    const aggressiveParams = springParameters(0.8, 0.1);
    let state = { position: 500, velocity: 0 };
    for (let i = 0; i < 60; i++) {
      state = solveSpring(state, 0, aggressiveParams, 1 / 60);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should work with a non-zero target', () => {
    let state = { position: 0, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = solveSpring(state, 300, underdampedParams, 0.016);
    }
    expect(isSpringSettled(state, 300)).toBe(true);
  });

  test('should incorporate initial velocity toward target into trajectory', () => {
    const atRest = solveSpring({ position: 100, velocity: 0 }, 0, underdampedParams, 0.016);
    const withVel = solveSpring({ position: 100, velocity: -500 }, 0, underdampedParams, 0.016);
    expect(withVel.position).toBeLessThan(atRest.position);
  });

  test('should handle initial velocity away from target', () => {
    // Velocity pushes position further from target first, then spring pulls back.
    // This mirrors gesture release with downward velocity (spring snaps back upward).
    const result = solveSpring({ position: 100, velocity: 500 }, 0, underdampedParams, 0.016);
    // One frame away: position moves further from target before spring wins
    expect(result.position).toBeGreaterThan(100);
    // But over many frames it must still converge
    let state = { position: 100, velocity: 500 };
    for (let i = 0; i < 300; i++) {
      state = solveSpring(state, 0, underdampedParams, 0.016);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should return near-settled state for very large dt (unique advantage over numerical integration)', () => {
    // A 2-second dt would cause numerical methods to explode,
    // but solveSpring computes the exact position at t+2s.
    const result = solveSpring({ position: 500, velocity: 0 }, 0, underdampedParams, 2);
    expect(isSpringSettled(result, 0)).toBe(true);
  });

  test('should converge for very bouncy spring (ζ = 0.1, slider minimum)', () => {
    const bouncyParams = springParameters(0.1, 0.4);
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 600; i++) {
      state = solveSpring(state, 0, bouncyParams, 0.016);
    }
    expect(isSpringSettled(state, 0)).toBe(true);
  });

  test('should produce numerically accurate result for critically damped spring', () => {
    // Hand-computed: ω₀ = 2π/0.4 ≈ 15.708, dt = 0.1
    // rateCoeff = 0 + 15.708 * 100 = 1570.8
    // envelope  = e^(-15.708 * 0.1) ≈ 0.20788
    // newDisplacement = (100 + 1570.8 * 0.1) * 0.20788 ≈ 53.44
    // newVelocity     = (1570.8 - 15.708 * 257.08) * 0.20788 ≈ -513.2
    const result = solveSpring({ position: 100, velocity: 0 }, 0, criticalParams, 0.1);
    expect(result.position).toBeCloseTo(53.44, 1);
    expect(result.velocity).toBeCloseTo(-513.2, 0);
  });

  test('should produce numerically accurate result for underdamped spring', () => {
    // ω₀ ≈ 15.708, ζ = 0.8, ωd = 9.4248, dt = 0.1
    // sineCoeff = (0 + 0.8 * 15.708 * 100) / 9.4248 ≈ 133.33
    // envelope  = e^(-0.8 * 15.708 * 0.1) ≈ 0.2844
    // cos(0.94248) ≈ 0.5878,  sin(0.94248) ≈ 0.8090
    // newDisplacement ≈ 47.4,  newVelocity ≈ -602.8
    const result = solveSpring({ position: 100, velocity: 0 }, 0, underdampedParams, 0.1);
    expect(result.position).toBeCloseTo(47.4, 0);
    expect(result.velocity).toBeCloseTo(-602.8, 0);
  });
});

describe('Utils - isSpringSettled', () => {
  test('should return true when at exact target with zero velocity', () => {
    expect(isSpringSettled({ position: 0, velocity: 0 }, 0)).toBe(true);
  });

  test('should return true when within default position threshold', () => {
    expect(isSpringSettled({ position: 0.49, velocity: 0 }, 0)).toBe(true);
    expect(isSpringSettled({ position: -0.49, velocity: 0 }, 0)).toBe(true);
  });

  test('should return false when outside default position threshold', () => {
    expect(isSpringSettled({ position: 0.5, velocity: 0 }, 0)).toBe(false);
    expect(isSpringSettled({ position: 1, velocity: 0 }, 0)).toBe(false);
  });

  test('should return true when within default velocity threshold', () => {
    expect(isSpringSettled({ position: 0, velocity: 0.49 }, 0)).toBe(true);
    expect(isSpringSettled({ position: 0, velocity: -0.49 }, 0)).toBe(true);
  });

  test('should return false when outside default velocity threshold', () => {
    expect(isSpringSettled({ position: 0, velocity: 0.5 }, 0)).toBe(false);
    expect(isSpringSettled({ position: 0, velocity: -1 }, 0)).toBe(false);
  });

  test('should return false when both position and velocity are outside threshold', () => {
    expect(isSpringSettled({ position: 1, velocity: 1 }, 0)).toBe(false);
  });

  test('should measure position relative to target', () => {
    expect(isSpringSettled({ position: 100.3, velocity: 0 }, 100)).toBe(true);
    expect(isSpringSettled({ position: 100.6, velocity: 0 }, 100)).toBe(false);
  });

  test('should respect custom thresholds', () => {
    expect(isSpringSettled({ position: 1.5, velocity: 1.5 }, 0, 2, 2)).toBe(true);
    expect(isSpringSettled({ position: 2, velocity: 0 }, 0, 2, 2)).toBe(false);
    expect(isSpringSettled({ position: 0, velocity: 2 }, 0, 2, 2)).toBe(false);
  });
});

describe('Utils - projectDisplacement', () => {
  test('should return 0 for zero velocity', () => {
    expect(projectDisplacement(0, 0.998)).toBe(0);
  });

  test('should return positive displacement for positive velocity', () => {
    expect(projectDisplacement(1000, 0.998)).toBeGreaterThan(0);
  });

  test('should return negative displacement for negative velocity', () => {
    expect(projectDisplacement(-1000, 0.998)).toBeLessThan(0);
  });

  test('should be symmetric: negative velocity mirrors positive', () => {
    const positive = projectDisplacement(1000, 0.998);
    const negative = projectDisplacement(-1000, 0.998);

    expect(positive).toBeCloseTo(-negative, 10);
  });

  test('should return correct displacement for velocity=1000 and rate=0.998', () => {
    // (1000 / 1000 * 0.998) / (1 - 0.998) = 0.998 / 0.002 = 499
    expect(projectDisplacement(1000, 0.998)).toBeCloseTo(499, 1);
  });

  test('should scale linearly with velocity', () => {
    const d1 = projectDisplacement(1000, 0.998);
    const d2 = projectDisplacement(2000, 0.998);

    expect(d2).toBeCloseTo(d1 * 2, 5);
  });

  test('should return less displacement with lower deceleration rate (faster stop)', () => {
    const fast = projectDisplacement(1000, 0.99);
    const slow = projectDisplacement(1000, 0.998);

    expect(fast).toBeLessThan(slow);
  });

  test('should return correct displacement for rate=0.99', () => {
    // (1000 / 1000 * 0.99) / (1 - 0.99) = 0.99 / 0.01 = 99
    expect(projectDisplacement(1000, 0.99)).toBeCloseTo(99, 1);
  });
});

describe('VelocityTracker', () => {
  describe('getVelocity - basic behavior', () => {
    test('should return 0 with no samples', () => {
      const tracker = new VelocityTracker();

      expect(tracker.getVelocity(100)).toBe(0);
    });

    test('should return 0 with only one sample', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 0);

      expect(tracker.getVelocity(50)).toBe(0);
    });

    test('should calculate velocity from two samples', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 0);
      tracker.addSample(50, 100);

      // 100px over 50ms = 2 px/ms
      expect(tracker.getVelocity(50)).toBeCloseTo(2, 5);
    });

    test('should return negative velocity for upward movement', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 100);
      tracker.addSample(50, 0);

      // -100px over 50ms = -2 px/ms
      expect(tracker.getVelocity(100)).toBeCloseTo(-2, 5);
    });

    test('should return 0 for identical timestamps', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(100, 0);
      tracker.addSample(100, 50);

      expect(tracker.getVelocity(150)).toBe(0);
    });

    test('should use oldest and newest sample within window', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 0);
      tracker.addSample(25, 50);
      tracker.addSample(50, 100);
      tracker.addSample(75, 150);

      // oldest in window: t=0, p=0; newest: t=75, p=150
      // velocity = 150/75 = 2 px/ms
      expect(tracker.getVelocity(100)).toBeCloseTo(2, 5);
    });
  });

  describe('getVelocity - window behavior', () => {
    test('should return 0 when all samples are outside the window', () => {
      const tracker = new VelocityTracker(100);
      tracker.addSample(0, 0);
      tracker.addSample(50, 100);

      // At t=200, window is [100, 200] - both samples (t=0, t=50) are outside
      expect(tracker.getVelocity(200)).toBe(0);
    });

    test('should return 0 after a pause (no recent samples)', () => {
      const tracker = new VelocityTracker(100);
      tracker.addSample(0, 0);
      tracker.addSample(20, 50);

      // User pauses, releases 200ms later
      expect(tracker.getVelocity(220)).toBe(0);
    });

    test('should respect custom window size', () => {
      const tracker = new VelocityTracker(200);
      tracker.addSample(0, 0);
      tracker.addSample(150, 300);

      // Both in window [0-200] → velocity = 300/150 = 2 px/ms
      expect(tracker.getVelocity(200)).toBeCloseTo(2, 5);
    });

    test('should exclude samples outside window even if others are inside', () => {
      const tracker = new VelocityTracker(100);
      tracker.addSample(0, 0); // outside window at t=150 (cutoff=50)
      tracker.addSample(60, 60);
      tracker.addSample(120, 120);

      // At t=150, cutoff=50: samples at t=60 and t=120 are in window
      // velocity = (120-60)/(120-60) = 1 px/ms
      expect(tracker.getVelocity(150)).toBeCloseTo(1, 5);
    });
  });

  describe('reset', () => {
    test('should clear all samples', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 0);
      tracker.addSample(50, 100);

      tracker.reset();

      expect(tracker.getVelocity(100)).toBe(0);
    });

    test('should allow new samples after reset', () => {
      const tracker = new VelocityTracker();
      tracker.addSample(0, 0);
      tracker.addSample(50, 100);
      tracker.reset();
      tracker.addSample(0, 0);
      tracker.addSample(50, 200);

      expect(tracker.getVelocity(50)).toBeCloseTo(4, 5);
    });
  });

  describe('addSample - pruning', () => {
    test('should prune samples older than 2x window to prevent memory growth', () => {
      const tracker = new VelocityTracker(100);
      tracker.addSample(0, 0); // will be pruned when t=300 is added
      tracker.addSample(50, 50); // will be pruned when t=300 is added
      tracker.addSample(300, 300); // cutoff = 300 - 200 = 100; t=0 and t=50 are pruned

      // Only {t=300} remains; window at t=350 is [250-350], t=300 is inside but alone
      expect(tracker.getVelocity(350)).toBe(0);
    });

    test('should keep samples within 2x window after pruning', () => {
      const tracker = new VelocityTracker(100);
      tracker.addSample(150, 150);
      tracker.addSample(200, 200); // cutoff = 200 - 200 = 0; t=150 > 0, kept

      // Both in window at t=250 (cutoff=150): t=150 >= 150, t=200 >= 150
      expect(tracker.getVelocity(250)).toBeCloseTo(1, 5);
    });
  });
});
