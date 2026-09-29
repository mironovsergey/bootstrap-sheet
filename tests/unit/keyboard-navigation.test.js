import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import {
  createSheet,
  advanceTimersAndFlush,
  startDrag,
  TRANSITION_WAIT,
} from '../setup/test-utils';

describe('BootstrapSheet - Keyboard Navigation', () => {
  describe('ESC key behavior', () => {
    test('should close sheet on ESC when keyboard=true', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should not close sheet on ESC when keyboard=false', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
    });

    test('should trigger shake animation on ESC with static backdrop', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        backdrop: 'static',
      });

      const animateSpy = jest.fn();
      sheet.animate = animateSpy;

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(animateSpy).toHaveBeenCalled();
      expect(instance.isShown).toBe(true);
    });

    test('should only respond to Escape key, not other keys', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Try various keys
      const keys = ['Enter', 'Space', 'Tab', 'ArrowDown', 'q', 'x'];

      for (const key of keys) {
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }

      await advanceTimersAndFlush(100);

      expect(instance.isShown).toBe(true);
    });

    test('should handle ESC on keydown event, not keyup or keypress', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Try keyup
      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(keyupEvent);

      expect(instance.isShown).toBe(true);

      // Try keypress
      const keypressEvent = new KeyboardEvent('keypress', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(keypressEvent);

      expect(instance.isShown).toBe(true);

      // Try keydown (should work)
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(keydownEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should clean up ESC handler on hide', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      // Try to dispatch ESC after hide - should not cause any errors
      expect(() => {
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();

      // Should remain hidden (no action taken)
      expect(instance.isShown).toBe(false);
    });

    test('should clean up ESC handler on dispose', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      instance.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should not attach ESC handler when keyboard=false', () => {
      const sheet = createSheet();
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      const instance = new BootstrapSheet(sheet, { keyboard: false });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      // Check that keydown listener was not added
      const keydownCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'keydown');

      expect(keydownCalls.length).toBe(0);
    });

    test('should handle rapid ESC key presses', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Press ESC multiple times rapidly
      for (let i = 0; i < 5; i++) {
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        document.dispatchEvent(escapeEvent);
      }

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should close only once
      expect(instance.isShown).toBe(false);
    });
  });

  describe('Multiple sheet instances', () => {
    /**
     * Show a lower and an upper sheet, one after the other
     * @param {Object} upperConfig - Config of the sheet shown last
     * @returns {Promise<{ lower: BootstrapSheet, upper: BootstrapSheet }>}
     */
    const openTwoSheets = async (upperConfig = {}) => {
      const lower = new BootstrapSheet(createSheet({ id: 'lower' }), { keyboard: true });
      const upper = new BootstrapSheet(createSheet({ id: 'upper' }), {
        keyboard: true,
        ...upperConfig,
      });

      lower.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      upper.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      return { lower, upper };
    };

    /**
     * Press Escape on the document and let any animation settle
     */
    const pressEscape = async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await advanceTimersAndFlush(TRANSITION_WAIT);
    };

    test('should close only the topmost sheet on ESC', async () => {
      const { lower, upper } = await openTwoSheets();

      await pressEscape();

      expect(upper.isShown).toBe(false);
      expect(lower.isShown).toBe(true);
    });

    test('should close the next sheet down on the following ESC', async () => {
      const { lower } = await openTwoSheets();

      await pressEscape();
      await pressEscape();

      expect(lower.isShown).toBe(false);
    });

    test('should not close a sheet underneath one with keyboard=false', async () => {
      const { lower, upper } = await openTwoSheets({ keyboard: false });

      await pressEscape();

      expect(upper.isShown).toBe(true);
      expect(lower.isShown).toBe(true);
    });

    test('should skip a sheet removed from the page while open', async () => {
      const { lower } = await openTwoSheets();

      document.getElementById('upper').remove();

      await pressEscape();

      expect(lower.isShown).toBe(false);
    });
  });

  describe('ESC handled elsewhere', () => {
    test('should ignore ESC already handled inside the sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });
      const input = document.createElement('input');

      sheet.querySelector('.sheet-body').appendChild(input);
      input.addEventListener('keydown', (event) => event.preventDefault());

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
    });

    test('should ignore ESC while text is being composed', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }),
      );
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
    });

    describe('while non-modal', () => {
      /**
       * Show a sheet resting at an undimmed detent
       * @returns {Promise<{ sheet: HTMLElement, instance: BootstrapSheet }>}
       */
      const openNonModal = async () => {
        const sheet = createSheet();
        const instance = new BootstrapSheet(sheet, {
          keyboard: true,
          detents: [0.4, 1],
          undimmedDetent: 0.4,
        });

        instance.show();
        await advanceTimersAndFlush(TRANSITION_WAIT);

        return { sheet, instance };
      };

      test('should ignore ESC pressed on the page', async () => {
        const outside = document.createElement('button');

        document.body.appendChild(outside);

        const { instance } = await openNonModal();

        outside.focus();
        outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await advanceTimersAndFlush(TRANSITION_WAIT);

        expect(instance.isShown).toBe(true);
      });

      test('should close on ESC pressed inside the sheet', async () => {
        const { sheet, instance } = await openNonModal();
        const button = sheet.querySelector('.btn-close');

        button.focus();
        button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await advanceTimersAndFlush(TRANSITION_WAIT);

        expect(instance.isShown).toBe(false);
      });
    });
  });

  describe('Interaction with dismiss buttons', () => {
    test('should work alongside dismiss button clicks', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);

      // Click dismiss button
      dismissBtn.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);

      // Show again
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Now use ESC key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should focus dismiss button after ESC with focus=true', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        focus: true,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should be inside sheet
      expect(document.activeElement).not.toBe(button);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should be restored to original button
      expect(document.activeElement).toBe(button);

      button.remove();
    });
  });

  describe('ESC during transitions', () => {
    test('should ignore ESC during show transition', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();

      // Try ESC immediately during transition
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      // Should still be shown (transition not complete)
      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(true);
    });

    test('should ignore ESC during hide transition', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();

      // Try ESC immediately during hide transition
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(instance.isTransitioning).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });
  });

  describe('ESC with backdrop variants', () => {
    test('should close sheet on ESC with backdrop=true', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        backdrop: true,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should show shake animation on ESC with backdrop=static', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        backdrop: 'static',
      });

      const animateSpy = jest.fn();
      sheet.animate = animateSpy;

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.dataset.bsStatic).toBe('');

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(animateSpy).toHaveBeenCalled();
      expect(instance.isShown).toBe(true);
      expect(backdrop).toBeInTheDocument();
    });

    test('should close sheet on ESC with backdrop=false', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        backdrop: false,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });
  });

  describe('ESC with gestures', () => {
    test('should abort drag and close on ESC', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        gestures: true,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      // Start dragging
      startDrag(handle, { startY: 0, pointerId: 1 });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      // Press ESC while dragging
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
      expect(instance.isShown).toBe(false);
    });

    test('should show shake animation on ESC with static backdrop during drag', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        keyboard: true,
        gestures: true,
        backdrop: 'static',
      });

      const animateSpy = jest.fn();
      sheet.animate = animateSpy;

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle, { startY: 0, pointerId: 1 });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(animateSpy).toHaveBeenCalled();
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Keyboard event propagation', () => {
    test('should allow ESC event to bubble', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      let bubbled = false;
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          bubbled = true;
        }
      });

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(bubbled).toBe(true);
    });

    test('should not prevent default on ESC', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      // ESC handler should not prevent default
      expect(escapeEvent.defaultPrevented).toBe(false);
    });
  });

  describe('Keyboard configuration changes', () => {
    test('should handle keyboard option change via data attribute', async () => {
      const sheet = createSheet();
      sheet.setAttribute('data-bs-keyboard', 'false');

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should not close because data-bs-keyboard="false"
      expect(instance.isShown).toBe(true);
    });

    test('should prioritize constructor config over data attribute', async () => {
      const sheet = createSheet();
      sheet.setAttribute('data-bs-keyboard', 'false');

      // Constructor config should override data attribute
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should close because constructor config keyboard=true
      expect(instance.isShown).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle ESC on already hidden sheet gracefully', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      // Sheet is not shown
      expect(instance.isShown).toBe(false);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      expect(() => {
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();
    });

    test('should handle ESC after dispose gracefully', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.dispose();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      expect(() => {
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();
    });

    test('should handle ESC with special keyboard layouts', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Simulate ESC with different properties
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should handle ESC with modifier keys', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // ESC with Shift
      const shiftEscEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(shiftEscEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should still close (modifiers don't prevent ESC)
      expect(instance.isShown).toBe(false);
    });

    test('should work correctly after repeated show/hide cycles', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { keyboard: true });

      // Perform multiple show/hide cycles
      for (let i = 0; i < 5; i++) {
        instance.show();
        await advanceTimersAndFlush(TRANSITION_WAIT);

        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        document.dispatchEvent(escapeEvent);

        await advanceTimersAndFlush(TRANSITION_WAIT);

        expect(instance.isShown).toBe(false);
      }

      // No errors should occur
      expect(instance.isShown).toBe(false);
    });
  });
});
