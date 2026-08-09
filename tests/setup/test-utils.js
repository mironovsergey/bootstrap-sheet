/**
 * Timer budget for show/hide animations in tests.
 * The spring with default params settles well within this window.
 */
export const TRANSITION_WAIT = 350;

/**
 * Distance the pointer must travel before a gesture counts as a drag.
 * Mirrors DRAG_SLOP in src/js/constants.ts.
 */
export const DRAG_SLOP = 8;

/**
 * Create a basic sheet element
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} Sheet element
 */
export function createSheet(options = {}) {
  const {
    id = 'testSheet',
    withHeader = true,
    withBody = true,
    withFooter = false,
    withDragHandle = false,
    legacyDragAttribute = false,
    dataAttributes = {},
  } = options;

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.id = id;

  // Apply data attributes
  Object.entries(dataAttributes).forEach(([key, value]) => {
    sheet.setAttribute(`data-bs-${key}`, value);
  });

  if (withHeader) {
    const header = document.createElement('div');
    header.className = 'sheet-header';

    if (withDragHandle) {
      const handle = document.createElement('div');
      handle.className = 'sheet-handle';

      // Deprecated since 0.4.0: kept only for tests covering the warning
      if (legacyDragAttribute) {
        handle.setAttribute('data-bs-drag', 'sheet');
      }

      header.appendChild(handle);
    }

    const title = document.createElement('h5');
    title.className = 'sheet-title';
    title.textContent = 'Test Sheet';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'sheet');
    closeBtn.setAttribute('aria-label', 'Close');
    header.appendChild(closeBtn);

    sheet.appendChild(header);
  }

  if (withBody) {
    const body = document.createElement('div');
    body.className = 'sheet-body';
    body.innerHTML = '<p>Test content</p>';
    sheet.appendChild(body);
  }

  if (withFooter) {
    const footer = document.createElement('div');
    footer.className = 'sheet-footer';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.setAttribute('data-bs-dismiss', 'sheet');
    closeBtn.textContent = 'Close';
    footer.appendChild(closeBtn);

    sheet.appendChild(footer);
  }

  document.body.appendChild(sheet);
  return sheet;
}

/**
 * Create a trigger button for a sheet
 * @param {string} targetId - Target sheet ID
 * @param {Object} dataAttributes - Additional data attributes
 * @returns {HTMLElement} Button element
 */
export function createTrigger(targetId, dataAttributes = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-primary';
  button.setAttribute('data-bs-toggle', 'sheet');
  button.setAttribute('data-bs-target', `#${targetId}`);
  button.textContent = 'Open Sheet';

  Object.entries(dataAttributes).forEach(([key, value]) => {
    button.setAttribute(`data-bs-${key}`, value);
  });

  document.body.appendChild(button);
  return button;
}

/**
 * Create focusable elements inside a container
 * @param {HTMLElement} container - Container element
 * @param {number} count - Number of focusable elements
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function createFocusableElements(container, count = 3) {
  const elements = [];

  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.id = `input-${i}`;
    container.appendChild(input);
    elements.push(input);
  }

  return elements;
}

/**
 * Wait for CSS transitions to complete
 * @param {HTMLElement} element - Element to wait for
 * @param {number} duration - Expected duration in ms
 * @returns {Promise<void>}
 */
export async function waitForTransition(element, duration = 300) {
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.target === element) {
        element.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    element.addEventListener('transitionend', handler);

    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('transitionend', handler);
      resolve();
    }, duration + 100);
  });
}

/**
 * Simulate pointer events for gesture testing
 * @param {HTMLElement} element - Target element
 * @param {Object} options - Event options
 */
export function simulatePointerEvent(element, type, options = {}) {
  const { clientX = 0, clientY = 0, pointerId = 1 } = options;

  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId,
    pointerType: 'touch',
  });

  element.dispatchEvent(event);
  return event;
}

/**
 * Make an element look scrollable to the drag controller.
 *
 * jsdom performs no layout, so scrollHeight and clientHeight are always 0
 * and have to be defined explicitly.
 *
 * @param {HTMLElement} element - Element to turn into a scroll container
 * @param {Object} options - Scroll geometry
 */
export function makeScrollable(element, options = {}) {
  const { scrollHeight = 1000, clientHeight = 300, scrollTop = 0 } = options;

  element.style.overflowY = 'auto';

  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    writable: true,
    value: scrollTop,
  });
}

/**
 * Set the height the sheet reports, as jsdom performs no layout
 * @param {HTMLElement} element - Sheet element
 * @param {number} height - Height in pixels
 */
export function setSheetHeight(element, height) {
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
}

/**
 * Run every live ResizeObserver callback, as jsdom never fires them
 */
export function triggerResize() {
  for (const observer of [...ResizeObserver.instances]) {
    observer.callback([], observer);
  }
}

/**
 * Begin a drag by crossing the slop threshold.
 *
 * A gesture only becomes a drag once the pointer has travelled DRAG_SLOP on
 * the Y axis, and displacement is then measured from that crossing point.
 * Tests therefore need two moves to start moving the sheet; this helper does
 * the first one and reports the coordinate the drag measures from.
 *
 * @param {HTMLElement} element - Element to start the gesture on
 * @param {Object} options - Gesture options
 * @returns {number} Y coordinate the drag measures displacement from
 */
export function startDrag(element, options = {}) {
  const { startY = 0, clientX = 0, direction = 'down', pointerId = 1 } = options;

  simulatePointerEvent(element, 'pointerdown', { clientX, clientY: startY, pointerId });

  const originY = startY + (direction === 'up' ? -DRAG_SLOP : DRAG_SLOP);

  simulatePointerEvent(document, 'pointermove', { clientX, clientY: originY, pointerId });

  return originY;
}

/**
 * Simulate a complete swipe gesture.
 *
 * The pointer additionally travels the slop distance before the drag begins,
 * so the sheet is displaced by exactly `endY - startY`.
 *
 * @param {HTMLElement} element - Element to start the gesture on
 * @param {Object} options - Gesture options
 */
export function simulateSwipe(element, options = {}) {
  const { startY = 0, endY = 100, duration = 300, steps = 10 } = options;

  const deltaY = endY - startY;
  const direction = deltaY < 0 ? 'up' : 'down';

  // Start drag past the slop threshold
  const originY = startDrag(element, { startY, direction });

  // Move in steps
  const stepSize = deltaY / steps;

  for (let i = 1; i <= steps; i++) {
    const currentY = originY + stepSize * i;
    simulatePointerEvent(document, 'pointermove', { clientY: currentY });
    jest.advanceTimersByTime(duration / steps);
  }

  // End drag
  simulatePointerEvent(document, 'pointerup', { clientY: originY + deltaY });
}

/**
 * Get computed transform translateY value
 * @param {HTMLElement} element - Element to check
 * @returns {number} TranslateY value in pixels
 */
export function getTranslateY(element) {
  const transform = element.style.transform;
  if (!transform || transform === 'none') return 0;

  const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)(px)?\)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Create an event spy
 * @param {HTMLElement} element - Element to spy on
 * @param {string} eventName - Event name
 * @returns {Object} Spy object with calls array
 */
export function spyOnEvent(element, eventName) {
  const calls = [];
  const handler = (event) => {
    calls.push({
      event,
      detail: event.detail,
      defaultPrevented: event.defaultPrevented,
    });
  };

  element.addEventListener(eventName, handler);

  return {
    calls,
    remove: () => element.removeEventListener(eventName, handler),
    reset: () => {
      calls.length = 0;
    },
  };
}

/**
 * Check if element has scroll
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export function hasScroll(element) {
  return element.scrollHeight > element.clientHeight;
}

/**
 * Mock scrollbar width
 * @param {number} width - Scrollbar width to mock
 */
export function mockScrollbarWidth(width = 15) {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 100 - width,
  });
}

/**
 * Advance timers and flush promises
 * @param {number} ms - Time to advance in milliseconds
 * @returns {Promise<void>}
 */
export async function advanceTimersAndFlush(ms) {
  jest.advanceTimersByTime(ms);
  await Promise.resolve();
  await Promise.resolve();
}
