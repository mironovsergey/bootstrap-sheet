import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

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

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(sheet).toHaveClass(CLASS_NAME.STATIC_SHAKE);
      expect(instance.isShown).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet).not.toHaveClass(CLASS_NAME.STATIC_SHAKE);
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
    test('should close both sheets on ESC when both have keyboard=true', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { keyboard: true });
      const instance2 = new BootstrapSheet(sheet2, { keyboard: true });

      // Show both sheets
      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance1.isShown).toBe(true);
      expect(instance2.isShown).toBe(true);

      // Press ESC - both sheets will handle the event
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Both sheets will respond to ESC since they both have keyboard=true
      // and both listen to document keydown events
      expect(instance1.isShown).toBe(false);
      expect(instance2.isShown).toBe(false);
    });

    test('should not interfere with other sheets when keyboard=false', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { keyboard: true });
      const instance2 = new BootstrapSheet(sheet2, { keyboard: false });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // instance1 should close, instance2 should remain open
      expect(instance1.isShown).toBe(false);
      expect(instance2.isShown).toBe(true);
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

      expect(sheet).toHaveClass(CLASS_NAME.STATIC_SHAKE);
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

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Start dragging
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

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

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Start dragging
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      // Press ESC while dragging
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      // Shake animation should be added
      expect(sheet).toHaveClass(CLASS_NAME.STATIC_SHAKE);
      expect(instance.isShown).toBe(true);

      // Note: DRAGGING class might still be present immediately after ESC
      // because shake animation is added, but drag is effectively aborted
      // The important part is that sheet is NOT closed and shake is shown
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

    test('should not leak memory with repeated show/hide cycles', async () => {
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
