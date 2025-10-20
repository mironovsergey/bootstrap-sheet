import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock PointerEvent
global.PointerEvent = class PointerEvent extends MouseEvent {
  constructor(type, params = {}) {
    super(type, params);
    this.pointerId = params.pointerId || 0;
    this.width = params.width || 0;
    this.height = params.height || 0;
    this.pressure = params.pressure || 0;
    this.tangentialPressure = params.tangentialPressure || 0;
    this.tiltX = params.tiltX || 0;
    this.tiltY = params.tiltY || 0;
    this.twist = params.twist || 0;
    this.pointerType = params.pointerType || '';
    this.isPrimary = params.isPrimary || false;
  }
};

// Mock DOMMatrix for transform calculations
global.DOMMatrix = class DOMMatrix {
  constructor(transform) {
    this.m42 = 0; // translateY value

    if (transform && transform !== 'none') {
      // Parse translateY from transform string
      const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)(px)?\)/);
      if (match) {
        this.m42 = parseFloat(match[1]);
      }
    }
  }
};

// Mock getComputedStyle to return transform values
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function (element) {
  const styles = originalGetComputedStyle(element);
  const transform = element.style.transform || 'none';

  return {
    ...styles,
    transform,
    getPropertyValue: (prop) => {
      if (prop === 'transform') return transform;
      return styles.getPropertyValue(prop);
    },
  };
};

// Helper to trigger transitionend event
global.triggerTransitionEnd = (element) => {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'target', { value: element, enumerable: true });
  element.dispatchEvent(event);
};

// Helper to wait for next tick
global.waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock offsetParent to always return true parent for visibility checks
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    // Return parent if element is not explicitly hidden
    if (this.style.display === 'none') {
      return null;
    }
    return this.parentElement || document.body;
  },
  configurable: true,
});

// Mock Pointer Capture API
HTMLElement.prototype.setPointerCapture = jest.fn();
HTMLElement.prototype.releasePointerCapture = jest.fn();
HTMLElement.prototype.hasPointerCapture = jest.fn(() => false);

// Setup and teardown
beforeEach(() => {
  // Clear document body
  document.body.innerHTML = '';

  // Reset any inline styles on body
  document.body.style.cssText = '';

  // Reset pointer capture mocks
  HTMLElement.prototype.setPointerCapture.mockClear();
  HTMLElement.prototype.releasePointerCapture.mockClear();
  HTMLElement.prototype.hasPointerCapture.mockClear();

  // Use fake timers
  jest.useFakeTimers();
});

afterEach(() => {
  // Restore timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();

  // Clear all mocks
  jest.clearAllMocks();
});
