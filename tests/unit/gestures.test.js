import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SCROLL_LOCK_TIMEOUT } from '../../src/js/constants';
import { VelocityTracker } from '../../src/js/utils';
import {
  createSheet,
  getTranslateY,
  advanceTimersAndFlush,
  simulatePointerEvent,
  startDrag,
  makeScrollable,
  DRAG_SLOP,
  TRANSITION_WAIT,
} from '../setup/test-utils';

describe('BootstrapSheet - Gestures', () => {
  describe('Gesture handlers initialization', () => {
    test('should attach gesture handlers when gestures=true', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');
      expect(handle).toBeInTheDocument();

      startDrag(handle);

      // If handlers are attached, sheet should have dragging class
      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not attach gesture handlers when gestures=false', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: false });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle);

      // Sheet should not have dragging class
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should drag from the sheet root when no drag handle exists', () => {
      const sheet = createSheet({ withDragHandle: false });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      expect(sheet.querySelector('.sheet-handle')).not.toBeInTheDocument();

      startDrag(sheet);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should drag from any element inside the sheet', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const title = sheet.querySelector('.sheet-title');

      startDrag(title);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should detach gesture handlers on hide', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle);

      // Should not respond after hide
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Drag state management', () => {
    test('should not set dragging state before the slop threshold is crossed', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      simulatePointerEvent(handle, 'pointerdown', { clientY: 100 });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);

      // Just short of the threshold: still a tap, not a drag
      simulatePointerEvent(document, 'pointermove', { clientY: 100 + DRAG_SLOP - 1 });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should set dragging state once the slop threshold is crossed', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle, { startY: 100 });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should clear dragging state on pointerup', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      simulatePointerEvent(document, 'pointerup', { clientY: originY });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('backdrop has no inline transition during drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle);

      expect(backdrop.style.transition).toBe('');
    });

    test('backdrop has no inline transition before and after drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { backdrop: true, gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const handle = sheet.querySelector('.sheet-handle');

      expect(backdrop.style.transition).toBe('');

      const originY = startDrag(handle);
      simulatePointerEvent(document, 'pointerup', { clientY: originY });

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

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 50 });

      jest.advanceTimersByTime(16); // Next frame

      const translateY = getTranslateY(sheet);
      expect(translateY).toBeGreaterThan(0);
    });

    test('should measure displacement from the slop crossing point', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      // The slop distance itself must not move the sheet
      const originY = startDrag(handle);
      jest.advanceTimersByTime(16);

      expect(getTranslateY(sheet)).toBe(0);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 50 });
      jest.advanceTimersByTime(16);

      expect(getTranslateY(sheet)).toBeCloseTo(50, 5);
    });

    test('should not move when pointermove at same position as the drag origin', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle, { startY: 50 });

      simulatePointerEvent(document, 'pointermove', { clientY: originY });
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

      const handle = sheet.querySelector('.sheet-handle');

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

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 100 });

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

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle, { startY: 100, direction: 'up' });

      simulatePointerEvent(document, 'pointermove', { clientY: originY - 50 });

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

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 50 });

      jest.advanceTimersByTime(16);

      const translateY = getTranslateY(sheet);
      // Should be positive (moving down) with minimal resistance
      expect(translateY).toBeCloseTo(50, 5);
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

      const handle = sheet.querySelector('.sheet-handle');

      // Create all events upfront at the same real timestamp to prevent velocity drift:
      // jsdom sets event.timeStamp from performance.now() at creation time, so creating
      // events before any dispatch keeps their timestamps nearly identical, giving
      // VelocityTracker dt≈0 → velocity=0 → projectedY=30 < 200 → snap-back (not dismiss).
      const downEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      // Crosses the slop threshold; the drag measures displacement from here
      const slopEvent = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: DRAG_SLOP,
        pointerId: 1,
      });
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: DRAG_SLOP + 30,
        pointerId: 1,
      });
      const upEvent = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: DRAG_SLOP + 30,
        pointerId: 1,
      });

      handle.dispatchEvent(downEvent);
      document.dispatchEvent(slopEvent);
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

      const handle = sheet.querySelector('.sheet-handle');

      // Drag past 50% midpoint (250px > 200px) - new engine dismisses via inertia projection
      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 250 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY + 250 });

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

      const handle = sheet.querySelector('.sheet-handle');

      const originY = startDrag(handle, { startY: 100, direction: 'up' });

      simulatePointerEvent(document, 'pointermove', { clientY: originY - 100 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY - 100 });

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

      const handle = sheet.querySelector('.sheet-handle');

      // Inject velocity 2 px/ms (2000 px/s) via spy so the projection formula is exercised.
      // projectDisplacement(2000, 0.998) ≈ 998px → projectedY = 50 + 998 = 1048 > 200 → dismiss.
      const getVelocitySpy = jest
        .spyOn(VelocityTracker.prototype, 'getVelocity')
        .mockReturnValue(2);

      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 50 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY + 50 });

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

      const handle = sheet.querySelector('.sheet-handle');

      // Drag 210px (52.5% of 400px) - exceeds 50% midpoint
      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 210 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY + 210 });

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

      const handle = sheet.querySelector('.sheet-handle');

      // Capture is taken by the sheet root, which owns the gesture
      const setPointerCaptureSpy = jest.spyOn(sheet, 'setPointerCapture');

      simulatePointerEvent(handle, 'pointerdown', { clientY: 0 });

      // Not captured until the gesture is known to be a drag
      expect(setPointerCaptureSpy).not.toHaveBeenCalled();

      simulatePointerEvent(document, 'pointermove', { clientY: DRAG_SLOP });

      expect(setPointerCaptureSpy).toHaveBeenCalledWith(1);
    });

    test('should release pointer on pointerup', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      // Mock releasePointerCapture
      const releasePointerCaptureSpy = jest.spyOn(sheet, 'releasePointerCapture');

      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointerup', { clientY: originY });

      expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    });

    test('should handle pointer capture errors gracefully', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      // Mock console.warn to suppress expected warning
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock setPointerCapture to throw
      sheet.setPointerCapture = jest.fn(() => {
        throw new Error('Capture failed');
      });

      // Should not crash
      expect(() => {
        startDrag(handle);
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

      const handle = sheet.querySelector('.sheet-handle');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originY = startDrag(handle);

      sheet.releasePointerCapture = jest.fn(() => {
        throw new Error('Release failed');
      });

      expect(() => {
        simulatePointerEvent(document, 'pointerup', { clientY: originY });
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

      const handle = sheet.querySelector('.sheet-handle');

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

      const handle = sheet.querySelector('.sheet-handle');

      // Create all events upfront to prevent real-time timestamp drift causing false dismiss
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      const slopMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: DRAG_SLOP,
        pointerId: 1,
      });
      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: DRAG_SLOP + 30,
        pointerId: 1,
      });
      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        clientY: DRAG_SLOP + 30,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);
      document.dispatchEvent(slopMove);
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

  describe('Gesture arbitration with scrollable content', () => {
    const setup = () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      return { sheet, instance, body: sheet.querySelector('.sheet-body') };
    };

    test('should leave the gesture to content scrolled away from its top', () => {
      const { sheet, body } = setup();

      makeScrollable(body, { scrollTop: 120 });

      startDrag(body);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should take a downward gesture when content is at its top', () => {
      const { sheet, body } = setup();

      makeScrollable(body, { scrollTop: 0 });

      startDrag(body, { direction: 'down' });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should leave an upward gesture to content at its top', () => {
      const { sheet, body } = setup();

      makeScrollable(body, { scrollTop: 0 });

      startDrag(body, { startY: 200, direction: 'up' });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should take an upward gesture when there is nothing to scroll', () => {
      const { sheet, body } = setup();

      startDrag(body, { startY: 200, direction: 'up' });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should ignore a gesture that follows a scroll too closely', () => {
      const { sheet, body } = setup();

      makeScrollable(body, { scrollTop: 0 });

      body.dispatchEvent(new Event('scroll'));

      startDrag(body);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should allow a drag once the scroll lock has expired', () => {
      const { sheet, body } = setup();

      makeScrollable(body, { scrollTop: 0 });

      body.dispatchEvent(new Event('scroll'));

      jest.advanceTimersByTime(SCROLL_LOCK_TIMEOUT + 1);

      startDrag(body);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Opt-out zones', () => {
    const showSheet = () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      return { sheet, body: sheet.querySelector('.sheet-body') };
    };

    test('should not drag from a data-bs-drag="false" subtree', () => {
      const { sheet, body } = showSheet();

      const zone = document.createElement('div');
      zone.setAttribute('data-bs-drag', 'false');
      zone.innerHTML = '<span>no drag here</span>';
      body.appendChild(zone);

      startDrag(zone.querySelector('span'));

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not drag from a range input', () => {
      const { sheet, body } = showSheet();

      const range = document.createElement('input');
      range.type = 'range';
      body.appendChild(range);

      startDrag(range);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not drag from editable content', () => {
      const { sheet, body } = showSheet();

      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      body.appendChild(editable);

      startDrag(editable);

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should drag from contenteditable="false" content', () => {
      const { sheet, body } = showSheet();

      const readonly = document.createElement('div');
      readonly.setAttribute('contenteditable', 'false');
      body.appendChild(readonly);

      startDrag(readonly);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should still drag from ordinary buttons after the slop threshold', () => {
      const { sheet, body } = showSheet();

      const button = document.createElement('button');
      body.appendChild(button);

      startDrag(button);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Gesture direction and multiple pointers', () => {
    const showSheet = () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      return sheet;
    };

    test('should abandon a predominantly horizontal gesture', () => {
      const sheet = showSheet();

      simulatePointerEvent(sheet, 'pointerdown', { clientX: 0, clientY: 0 });
      simulatePointerEvent(document, 'pointermove', {
        clientX: 60,
        clientY: DRAG_SLOP + 2,
      });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should track only the first pointer of a gesture', () => {
      const sheet = showSheet();

      simulatePointerEvent(sheet, 'pointerdown', { clientY: 0, pointerId: 1 });
      simulatePointerEvent(sheet, 'pointerdown', { clientY: 0, pointerId: 2 });

      // The second pointer must not be able to start or end a drag
      simulatePointerEvent(document, 'pointermove', { clientY: DRAG_SLOP, pointerId: 2 });

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);

      simulatePointerEvent(document, 'pointermove', { clientY: DRAG_SLOP, pointerId: 1 });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      simulatePointerEvent(document, 'pointerup', { clientY: DRAG_SLOP, pointerId: 2 });

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Deprecated drag handle attribute', () => {
    test('should warn once when data-bs-drag="sheet" is present', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const sheet = createSheet({ withDragHandle: true, legacyDragAttribute: true });

      new BootstrapSheet(sheet);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('data-bs-drag="sheet"'));
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });

    test('should not warn when the attribute is absent', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const sheet = createSheet({ withDragHandle: true });

      new BootstrapSheet(sheet);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    test('should drag from the root even when the legacy attribute is present', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const sheet = createSheet({ withDragHandle: true, legacyDragAttribute: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      startDrag(sheet.querySelector('.sheet-title'));

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    test('should handle pointercancel event', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      simulatePointerEvent(document, 'pointercancel', { clientY: DRAG_SLOP });

      // Should stop dragging
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should restore the resting position on pointercancel instead of dismissing', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      // Drag past the dismiss midpoint, then let the browser take the gesture
      const originY = startDrag(handle);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 300 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointercancel', { clientY: originY + 300 });

      await advanceTimersAndFlush(2000);

      // A cancelled gesture makes no release decision: the sheet stays open
      expect(instance.isShown).toBe(true);
      expect(getTranslateY(sheet)).toBe(0);
    });

    test('should handle rapid pointer events', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const handle = sheet.querySelector('.sheet-handle');

      simulatePointerEvent(handle, 'pointerdown', { clientY: 0 });

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

      const handle = sheet.querySelector('.sheet-handle');

      startDrag(handle);

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      // Call hide while dragging
      instance.hide();

      // Should stop dragging
      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });
});
