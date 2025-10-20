import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, getTranslateY, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Gestures', () => {
  describe('Gesture handlers initialization', () => {
    test('should attach gesture handlers when gestures=true and drag handle exists', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      expect(handle).toBeInTheDocument();

      // Check if pointerdown listener is attached (can't directly test, but we can trigger)
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      // If handler is attached, sheet should have dragging class
      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not attach gesture handlers when gestures=false', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: false });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      // Sheet should not have dragging class
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not attach gesture handlers when no drag handle exists', () => {
      const sheet = createSheet({ withDragHandle: false });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      expect(handle).not.toBeInTheDocument();

      // No crash should occur
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should detach gesture handlers on hide', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      // Should not respond after hide
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Drag state management', () => {
    test('should set dragging state on pointerdown', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should clear dragging state on pointerup', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should remove backdrop transition during drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(backdrop.style.transition).toBe('none');
    });

    test('should restore backdrop transition on pointerup', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      expect(backdrop.style.transition).toBe('opacity 300ms');
    });
  });

  describe('Position updates during drag', () => {
    test('should update sheet position on pointermove', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      // Mock sheet height
      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16); // Next frame

      const translateY = getTranslateY(sheet);
      expect(translateY).toBeGreaterThan(0);
    });

    test('should not update position if not dragging', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const translateY = getTranslateY(sheet);
      expect(translateY).toBe(0);
    });

    test('should not update position if sheet is not shown', () => {
      const sheet = createSheet({ withDragHandle: true });
      // eslint-disable-next-line no-unused-vars
      const instance = new BootstrapSheet(sheet, { gestures: true });

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const translateY = getTranslateY(sheet);
      expect(translateY).toBe(0);
    });

    test('should update backdrop opacity during drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.opacity).toBe('1');

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const opacity = parseFloat(backdrop.style.opacity);
      expect(opacity).toBeLessThan(1);
      expect(opacity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Drag resistance', () => {
    test('should apply resistance when dragging up', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        dragResistanceUp: 0.75,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50, // Move up
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const translateY = getTranslateY(sheet);
      // Should be negative (moving up) but with resistance
      expect(translateY).toBeLessThan(0);
      // With resistance, should move less than raw delta (-50)
      expect(Math.abs(translateY)).toBeLessThan(50);
    });

    test('should apply less resistance when dragging down', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        dragResistanceDown: 0.01,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50, // Move down
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const translateY = getTranslateY(sheet);
      // Should be positive (moving down) with minimal resistance
      expect(translateY).toBeGreaterThan(0);
    });
  });

  describe('Drag end behavior', () => {
    test('should snap back to initial position on small drag down', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        swipeThreshold: 100,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Small drag
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 30, // Less than threshold
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 30,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      // Wait for animation
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should snap back to 0
      const translateY = getTranslateY(sheet);
      expect(translateY).toBe(0);
      expect(instance.isShown).toBe(true);
    });

    test('should close on large drag down', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        swipeThreshold: 50,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Large drag
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 150, // More than threshold
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      // Wait for animation + hide
      await advanceTimersAndFlush(TRANSITION_WAIT * 2);

      expect(instance.isShown).toBe(false);
    });

    test('should always snap back when dragging up', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Drag up
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 0, // Move up
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should snap back
      const translateY = getTranslateY(sheet);
      expect(translateY).toBe(0);
      expect(instance.isShown).toBe(true);
    });

    test('should close on high velocity drag', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        velocityThreshold: 0.5,
        minCloseDistance: 30,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Fast swipe
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      // Multiple quick moves to simulate velocity
      for (let i = 1; i <= 5; i++) {
        const pointerMove = new PointerEvent('pointermove', {
          bubbles: true,
          clientY: i * 20,
          pointerId: 1,
        });
        document.dispatchEvent(pointerMove);
        jest.advanceTimersByTime(10); // Very short time = high velocity
      }

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      await advanceTimersAndFlush(TRANSITION_WAIT * 2);

      // Should close due to high velocity
      expect(instance.isShown).toBe(false);
    });

    test('should respect closeThresholdRatio', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        closeThresholdRatio: 0.5, // 50% of height
        swipeThreshold: 0,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Drag 51% of height
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 210, // 52.5% of 400px
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 210,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      await advanceTimersAndFlush(TRANSITION_WAIT * 2);

      // Should close
      expect(instance.isShown).toBe(false);
    });
  });

  describe('Pointer capture', () => {
    test('should capture pointer on pointerdown', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Mock setPointerCapture
      const setPointerCaptureSpy = jest.spyOn(handle, 'setPointerCapture');

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(setPointerCaptureSpy).toHaveBeenCalledWith(1);
    });

    test('should release pointer on pointerup', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Mock releasePointerCapture
      const releasePointerCaptureSpy = jest.spyOn(handle, 'releasePointerCapture');

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      // Dispatch on handle to trigger releasePointerCapture
      Object.defineProperty(pointerUp, 'target', {
        value: handle,
        writable: false,
      });

      document.dispatchEvent(pointerUp);

      expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    });

    test('should handle pointer capture errors gracefully', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Mock console.warn to suppress expected warning
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock setPointerCapture to throw
      handle.setPointerCapture = jest.fn(() => {
        throw new Error('Capture failed');
      });

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      // Should not crash
      expect(() => {
        handle.dispatchEvent(pointerDown);
      }).not.toThrow();

      // Verify console.warn was called with expected message
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to capture pointer:', expect.any(Error));

      // Should still enter dragging state
      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Animation and timing', () => {
    test('should use easeOutCubic for snap back animation', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        animationDuration: 300,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      // Check position at different points in animation
      // This tests the easing function indirectly

      jest.advanceTimersByTime(100); // 1/3 of duration
      const translateY1 = getTranslateY(sheet);

      jest.advanceTimersByTime(100); // 2/3 of duration
      const translateY2 = getTranslateY(sheet);

      jest.advanceTimersByTime(100); // Complete
      const translateY3 = getTranslateY(sheet);

      // With easeOutCubic, movement should slow down
      // More movement in first third than last third
      const firstThirdMovement = Math.abs(translateY1 - 50);
      const lastThirdMovement = Math.abs(translateY3 - translateY2);

      expect(firstThirdMovement).toBeGreaterThan(lastThirdMovement);
    });

    test('should respect custom animation duration', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const customDuration = 500;
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        animationDuration: customDuration,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(customDuration + 50);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 30,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 30,
        pointerId: 1,
      });
      document.dispatchEvent(pointerUp);

      // Animation should not complete before custom duration
      jest.advanceTimersByTime(customDuration - 100);
      expect(getTranslateY(sheet)).not.toBe(0);

      // Should complete after custom duration
      jest.advanceTimersByTime(200);
      expect(getTranslateY(sheet)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle pointercancel event', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      const pointerCancel = new PointerEvent('pointercancel', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      document.dispatchEvent(pointerCancel);

      // Should stop dragging
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should handle rapid pointer events', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      // Rapid moves
      for (let i = 1; i <= 10; i++) {
        const pointerMove = new PointerEvent('pointermove', {
          bubbles: true,
          clientY: i * 5,
          pointerId: 1,
        });
        document.dispatchEvent(pointerMove);
        jest.advanceTimersByTime(1);
      }

      // Should not crash
      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should ignore pointerup when not dragging', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      // Should not crash
      expect(() => {
        document.dispatchEvent(pointerUp);
      }).not.toThrow();
    });

    test('should abort drag on hide()', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      // Call hide while dragging
      instance.hide();

      // Should stop dragging
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });
});
