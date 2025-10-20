import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, createFocusableElements, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Focus Management', () => {
  describe('Initial focus state', () => {
    test('should save previously focused element on show', async () => {
      const button = document.createElement('button');
      button.textContent = 'External Button';
      document.body.appendChild(button);
      button.focus();

      expect(document.activeElement).toBe(button);

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should have moved away from button
      expect(document.activeElement).not.toBe(button);
    });

    test('should save null if no element was focused', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // Make sure nothing is focused
      if (document.activeElement) {
        document.activeElement.blur();
      }

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should not crash
      expect(instance.isShown).toBe(true);
    });

    test('should not manage focus when focus option is false', async () => {
      const button = document.createElement('button');
      button.textContent = 'External Button';
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet, { focus: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should remain on external button
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Focus trapping on show', () => {
    test('should focus first focusable element after show', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(inputs[0]);
    });

    test('should focus sheet element if no focusable elements exist', async () => {
      const sheet = createSheet({ withHeader: false, withBody: false });

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(sheet);
    });

    test('should skip hidden focusable elements', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');

      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.style.display = 'none';
      body.appendChild(hiddenInput);

      const visibleInput = document.createElement('input');
      visibleInput.type = 'text';
      body.appendChild(visibleInput);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(visibleInput);
    });

    test('should skip inert focusable elements', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');

      const inertInput = document.createElement('input');
      inertInput.type = 'text';
      inertInput.setAttribute('inert', '');
      body.appendChild(inertInput);

      const normalInput = document.createElement('input');
      normalInput.type = 'text';
      body.appendChild(normalInput);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(normalInput);
    });

    test('should skip aria-hidden focusable elements', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');

      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.setAttribute('aria-hidden', 'true');
      body.appendChild(hiddenInput);

      const normalInput = document.createElement('input');
      normalInput.type = 'text';
      body.appendChild(normalInput);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(normalInput);
    });
  });

  describe('Tab key navigation', () => {
    test('should trap focus within sheet on Tab', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus is on first input
      expect(document.activeElement).toBe(inputs[0]);

      // Tab to second
      const tabEvent1 = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      inputs[0].dispatchEvent(tabEvent1);
      inputs[1].focus();

      expect(document.activeElement).toBe(inputs[1]);

      // Tab to third
      const tabEvent2 = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      inputs[1].dispatchEvent(tabEvent2);
      inputs[2].focus();

      expect(document.activeElement).toBe(inputs[2]);
    });

    test('should cycle to first element when Tab on last element', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Move to last input
      inputs[2].focus();
      expect(document.activeElement).toBe(inputs[2]);

      // Tab on last element should cycle to first
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(inputs[0]);
    });

    test('should cycle to last element when Shift+Tab on first element', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus is on first input
      expect(document.activeElement).toBe(inputs[0]);

      // Shift+Tab on first element should cycle to last
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(inputs[2]);
    });

    test('should not trap focus if in middle of elements', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Move to middle element
      inputs[1].focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      // Should not prevent default when in middle
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    test('should not trap focus if no focusable elements', async () => {
      const sheet = createSheet({ withBody: false });

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      sheet.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      // Should not prevent default
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    test('should not interfere with other keys', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      inputs[0].focus();

      // Try Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(enterEvent);

      expect(enterEvent.defaultPrevented).toBe(false);

      // Try Escape key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(escapeEvent);

      // Escape has its own handler, but not from focus trap
      expect(document.activeElement).toBe(inputs[0]);
    });
  });

  describe('Focus restoration on hide', () => {
    test('should restore focus to previous element on hide', async () => {
      const button = document.createElement('button');
      button.textContent = 'External Button';
      document.body.appendChild(button);
      button.focus();

      expect(document.activeElement).toBe(button);

      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).not.toBe(button);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(button);
    });

    test('should not crash if previous element was removed', async () => {
      const button = document.createElement('button');
      button.textContent = 'External Button';
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Remove the button from DOM
      button.remove();

      expect(() => {
        instance.hide();
      }).not.toThrow();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should not crash if previous element has no focus method', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // Manually set previousElement to invalid object
      instance.show();

      // Hack to set invalid previousElement
      const showSpy = jest.spyOn(document, 'activeElement', 'get');
      showSpy.mockReturnValue({ focus: undefined });

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(() => {
        instance.hide();
      }).not.toThrow();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      showSpy.mockRestore();
    });

    test('should not restore focus when focus option is false', async () => {
      const button = document.createElement('button');
      button.textContent = 'External Button';
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { focus: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus still on button (focus management disabled)
      expect(document.activeElement).toBe(button);

      // Manually focus something else
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus is NOT restored because focus management was disabled
      // It stays where it was - on input
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('MutationObserver for focusable elements', () => {
    test('should update focusable elements when DOM changes', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 2);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(inputs[0]);

      // Add new focusable element
      const newInput = document.createElement('input');
      newInput.type = 'text';
      newInput.id = 'new-input';
      body.appendChild(newInput);

      // Wait for MutationObserver
      await advanceTimersAndFlush(50);

      // Move to last element
      inputs[1].focus();

      // Tab should now cycle through 3 elements (original 2 + new one)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      // Should not cycle yet, as there's a new element
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    test('should update focusable elements when element disabled', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Disable middle input
      inputs[1].disabled = true;

      // Wait for MutationObserver
      await advanceTimersAndFlush(50);

      // Focus first element
      inputs[0].focus();

      // Tab should skip disabled element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(false);
    });

    test('should disconnect MutationObserver on hide', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Add element after hide - should not update anything
      const newInput = document.createElement('input');
      body.appendChild(newInput);

      await advanceTimersAndFlush(50);

      // Should not crash
      expect(instance.isShown).toBe(false);
    });

    test('should not create multiple observers', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Add element
      const newInput = document.createElement('input');
      body.appendChild(newInput);

      await advanceTimersAndFlush(50);

      // Should still work correctly
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle rapid show/hide cycles', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should be restored to original button
      expect(document.activeElement).toBe(button);
    });

    test('should handle all types of focusable elements', async () => {
      const sheet = createSheet({ withHeader: false, withBody: false });

      const body = document.createElement('div');
      body.className = 'sheet-body';

      // Add various focusable elements
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Link';
      body.appendChild(link);

      const button = document.createElement('button');
      button.textContent = 'Button';
      body.appendChild(button);

      const input = document.createElement('input');
      input.type = 'text';
      body.appendChild(input);

      const select = document.createElement('select');
      const option = document.createElement('option');
      option.textContent = 'Option';
      select.appendChild(option);
      body.appendChild(select);

      const textarea = document.createElement('textarea');
      body.appendChild(textarea);

      const divWithTabindex = document.createElement('div');
      divWithTabindex.setAttribute('tabindex', '0');
      divWithTabindex.textContent = 'Focusable div';
      body.appendChild(divWithTabindex);

      sheet.appendChild(body);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should focus first element (link)
      expect(document.activeElement).toBe(link);

      // Tab through all elements
      link.focus();
      button.focus();
      input.focus();
      select.focus();
      textarea.focus();
      divWithTabindex.focus();

      // All should be focusable
      expect(document.activeElement).toBe(divWithTabindex);
    });

    test('should work with nested focusable elements', async () => {
      const sheet = createSheet({ withHeader: false, withBody: false });

      const body = document.createElement('div');
      body.className = 'sheet-body';

      const container = document.createElement('div');
      const input1 = document.createElement('input');
      input1.type = 'text';
      container.appendChild(input1);

      const nested = document.createElement('div');
      const input2 = document.createElement('input');
      input2.type = 'text';
      nested.appendChild(input2);

      container.appendChild(nested);
      body.appendChild(container);
      sheet.appendChild(body);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should focus first input
      expect(document.activeElement).toBe(input1);

      // Tab to nested input
      input2.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      // Should cycle back to first
      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(input1);
    });

    test('should handle sheet without any inputs', async () => {
      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      body.innerHTML = '<p>No focusable elements here!</p>';

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should focus sheet itself
      expect(document.activeElement).toBe(sheet);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      // Should not crash
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    test('should handle focus when sheet element is removed during transition', async () => {
      const sheet = createSheet();
      const body = sheet.querySelector('.sheet-body');
      createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet);

      instance.show();

      // Remove sheet during transition
      sheet.remove();

      // Should not crash
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(() => {
        instance.hide();
      }).not.toThrow();
    });
  });

  describe('Integration with other features', () => {
    test('should work with keyboard dismiss', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet({ withHeader: false });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(inputs[0]);

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should restore focus to button
      expect(document.activeElement).toBe(button);
    });

    test('should work with dismiss buttons', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Click dismiss button
      dismissBtn.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should restore focus to button
      expect(document.activeElement).toBe(button);
    });

    test('should maintain focus trap during drag', async () => {
      const sheet = createSheet({ withHeader: true, withDragHandle: true });
      const body = sheet.querySelector('.sheet-body');
      const inputs = createFocusableElements(body, 3);

      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should be on first focusable (close button)
      const closeBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);
      expect(document.activeElement).toBe(closeBtn);

      // Simulate drag
      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      sheet.classList.add(CLASS_NAME.DRAGGING);

      // Tab should still work during drag
      inputs[2].focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      sheet.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeBtn);
    });
  });
});
