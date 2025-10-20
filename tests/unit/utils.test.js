import {
  parseAttributeValue,
  extractDataAttributes,
  resolveElement,
  reflow,
  clamp,
  extractTargetSelector,
  getScrollbarWidth,
  getValueType,
  parseExpectedTypes,
  validateConfigTypes,
  executeAfterTransition,
  getTranslateY,
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
    element.setAttribute('data-bs-animation-duration', '300');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      backdrop: true,
      keyboard: false,
      animationDuration: 300,
    });
  });

  test('should convert data attribute keys to camelCase', () => {
    const element = document.createElement('div');
    element.setAttribute('data-bs-swipe-threshold', '50');
    element.setAttribute('data-bs-velocity-threshold', '0.5');
    element.setAttribute('data-bs-drag-resistance-up', '0.75');

    const result = extractDataAttributes(element);

    expect(result).toEqual({
      swipeThreshold: 50,
      velocityThreshold: 0.5,
      dragResistanceUp: 0.75,
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

describe('Utils - reflow', () => {
  test('should return offsetHeight for element', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'offsetHeight', {
      configurable: true,
      value: 100,
    });

    expect(reflow(element)).toBe(100);
  });

  test('should return 0 for non-Element', () => {
    expect(reflow(null)).toBe(0);
    expect(reflow(undefined)).toBe(0);
    expect(reflow({})).toBe(0);
  });

  test('should trigger reflow/repaint', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    Object.defineProperty(element, 'offsetHeight', {
      configurable: true,
      value: 150,
    });

    const result = reflow(element);

    expect(result).toBe(150);

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
      animationDuration: 300,
    };

    const configTypes = {
      backdrop: 'boolean',
      keyboard: 'boolean',
      animationDuration: 'number',
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

  test('should provide detailed error messages', () => {
    const config = {
      animationDuration: '300',
    };

    const configTypes = {
      animationDuration: 'number',
    };

    expect(() => {
      validateConfigTypes('Sheet', config, configTypes);
    }).toThrow(
      '[Sheet] Option "animationDuration" has invalid type: expected number, but received string',
    );
  });
});

describe('Utils - executeAfterTransition', () => {
  test('should execute callback after transitionend event', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const callback = jest.fn();

    executeAfterTransition(element, callback, 300);

    expect(callback).not.toHaveBeenCalled();

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);

    element.remove();
  });

  test('should execute callback after timeout if no transitionend', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const callback = jest.fn();

    executeAfterTransition(element, callback, 300);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(1);

    element.remove();
  });

  test('should execute callback only once', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const callback = jest.fn();

    executeAfterTransition(element, callback, 300);

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);
    element.dispatchEvent(event);

    jest.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(1);

    element.remove();
  });

  test('should ignore transitionend from child elements', () => {
    const element = document.createElement('div');
    const child = document.createElement('span');
    element.appendChild(child);
    document.body.appendChild(element);

    const callback = jest.fn();

    executeAfterTransition(element, callback, 300);

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'target', { value: child, enumerable: true });
    element.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(1);

    element.remove();
  });

  test('should return cleanup function', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const callback = jest.fn();

    const cleanup = executeAfterTransition(element, callback, 300);

    expect(typeof cleanup).toBe('function');

    cleanup();

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);

    jest.advanceTimersByTime(350);

    expect(callback).not.toHaveBeenCalled();

    element.remove();
  });

  test('should handle callback errors gracefully', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const callback = jest.fn(() => {
      throw new Error('Callback error');
    });

    executeAfterTransition(element, callback, 300);

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });

    expect(() => {
      element.dispatchEvent(event);
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in transition callback:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
    element.remove();
  });

  test('should execute callback immediately for non-Element', () => {
    const callback = jest.fn();

    const cleanup = executeAfterTransition(null, callback, 300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(typeof cleanup).toBe('function');
  });

  test('should clean up event listener and timeout', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const callback = jest.fn();
    const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

    const cleanup = executeAfterTransition(element, callback, 300);

    cleanup();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('transitionend', expect.any(Function));

    element.remove();
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
});
