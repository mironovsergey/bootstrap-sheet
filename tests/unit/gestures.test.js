import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { VelocityTracker } from '../../src/js/utils';
import {
  createSheet,
  getTranslateY,
  advanceTimersAndFlush,
  TRANSITION_WAIT,
} from '../setup/test-utils';

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

    test('backdrop has no inline transition during drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );

      expect(backdrop.style.transition).toBe('');
    });

    test('backdrop has no inline transition before and after drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      expect(backdrop.style.transition).toBe('');

      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 0, pointerId: 1 }),
      );

      expect(backdrop.style.transition).toBe('');
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

    test('should not move when pointermove at same position as pointerdown', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // pointerdown and pointermove at same clientY → deltaY = 0
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 50, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 50, pointerId: 1 }),
      );
      jest.advanceTimersByTime(16);

      expect(getTranslateY(sheet)).toBe(0);
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

    test('should track finger 1:1 when dragging down', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
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
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Create all events upfront at the same real timestamp to prevent velocity drift:
      // jsdom sets event.timeStamp from performance.now() at creation time, so creating
      // events before any dispatch keeps their timestamps nearly identical, giving
      // VelocityTracker dt≈0 → velocity=0 → projectedY=30 < 200 → snap-back (not dismiss).
      const downEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 30,
        pointerId: 1,
      });
      const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 30, pointerId: 1 });

      handle.dispatchEvent(downEvent);
      document.dispatchEvent(moveEvent);
      jest.advanceTimersByTime(16);
      document.dispatchEvent(upEvent);

      // Spring takes ~600ms to settle - advance enough to ensure it snaps to exact 0
      await advanceTimersAndFlush(2000);

      expect(getTranslateY(sheet)).toBe(0);
      expect(instance.isShown).toBe(true);
    });

    test('should close on large drag down', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Drag past 50% midpoint (250px > 200px) - new engine dismisses via inertia projection
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 250, pointerId: 1 }),
      );
      jest.advanceTimersByTime(16);
      document.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 250, pointerId: 1 }),
      );

      // Spring animates to sheetHeight, then triggers hide() - wait enough for spring + transition
      await advanceTimersAndFlush(2000);

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

      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 100, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      jest.advanceTimersByTime(16);
      document.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 0, pointerId: 1 }),
      );

      // Spring takes ~600ms to settle - advance enough to ensure it snaps to exact 0
      await advanceTimersAndFlush(2000);

      expect(getTranslateY(sheet)).toBe(0);
      expect(instance.isShown).toBe(true);
    });

    test('should close when projected position exceeds midpoint', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Inject velocity 2 px/ms (2000 px/s) via spy so the projection formula is exercised.
      // projectDisplacement(2000, 0.998) ≈ 998px → projectedY = 50 + 998 = 1048 > 200 → dismiss.
      const getVelocitySpy = jest
        .spyOn(VelocityTracker.prototype, 'getVelocity')
        .mockReturnValue(2);

      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 50, pointerId: 1 }),
      );
      jest.advanceTimersByTime(16);
      document.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 50, pointerId: 1 }),
      );

      getVelocitySpy.mockRestore();

      await advanceTimersAndFlush(2000);

      expect(instance.isShown).toBe(false);
    });

    test('should close when drag exceeds 50% of sheet height', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Drag 210px (52.5% of 400px) - exceeds 50% midpoint
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 210, pointerId: 1 }),
      );
      jest.advanceTimersByTime(16);
      document.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 210, pointerId: 1 }),
      );

      // Spring animates to sheetHeight, then triggers hide() - wait enough for spring + transition
      await advanceTimersAndFlush(2000);

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

    test('should handle release pointer capture errors gracefully', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );

      handle.releasePointerCapture = jest.fn(() => {
        throw new Error('Release failed');
      });

      const pointerUp = new PointerEvent('pointerup', { bubbles: true, clientY: 0, pointerId: 1 });
      Object.defineProperty(pointerUp, 'target', { value: handle, writable: false });

      expect(() => {
        document.dispatchEvent(pointerUp);
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to release pointer:', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Animation and timing', () => {
    test('should decelerate during snap back animation', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Events upfront: keeps timestamps nearly identical → velocity≈0 → snap-back (not dismiss)
      const downEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      });
      const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 50, pointerId: 1 });

      handle.dispatchEvent(downEvent);
      document.dispatchEvent(moveEvent);
      jest.advanceTimersByTime(16);
      document.dispatchEvent(upEvent);

      jest.advanceTimersByTime(100);
      const translateY1 = getTranslateY(sheet);

      jest.advanceTimersByTime(100);
      const translateY2 = getTranslateY(sheet);

      jest.advanceTimersByTime(100);
      const translateY3 = getTranslateY(sheet);

      // Spring physics decelerates: more movement in first 100ms than last 100ms
      const firstThirdMovement = Math.abs(translateY1 - 50);
      const lastThirdMovement = Math.abs(translateY3 - translateY2);

      expect(firstThirdMovement).toBeGreaterThan(lastThirdMovement);
    });

    test('should complete spring snap-back animation', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Create all events upfront to prevent real-time timestamp drift causing false dismiss
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 30,
        pointerId: 1,
      });
      const pointerUp = new PointerEvent('pointerup', { bubbles: true, clientY: 30, pointerId: 1 });

      handle.dispatchEvent(pointerDown);
      document.dispatchEvent(pointerMove);
      jest.advanceTimersByTime(16);
      document.dispatchEvent(pointerUp);

      // Spring animation is not instant - position should still be mid-flight right after release
      expect(getTranslateY(sheet)).not.toBe(0);

      // Spring settles within 2 seconds (default response=0.4s, damping=0.8)
      await advanceTimersAndFlush(2000);
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
