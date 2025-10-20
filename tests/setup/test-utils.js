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
      handle.setAttribute('data-bs-drag', 'sheet');
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
 * Simulate a complete swipe gesture
 * @param {HTMLElement} handle - Drag handle element
 * @param {Object} options - Gesture options
 */
export function simulateSwipe(handle, options = {}) {
  const { startY = 0, endY = 100, duration = 300, steps = 10 } = options;

  // Start drag
  simulatePointerEvent(handle, 'pointerdown', { clientY: startY });

  // Move in steps
  const deltaY = endY - startY;
  const stepSize = deltaY / steps;

  for (let i = 1; i <= steps; i++) {
    const currentY = startY + stepSize * i;
    simulatePointerEvent(document, 'pointermove', { clientY: currentY });
    jest.advanceTimersByTime(duration / steps);
  }

  // End drag
  simulatePointerEvent(document, 'pointerup', { clientY: endY });
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
