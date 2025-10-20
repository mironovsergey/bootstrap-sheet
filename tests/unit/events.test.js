import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { EVENT, CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Events', () => {
  describe(EVENT.SHOW, () => {
    test('should fire show event when show() is called', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const showSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOW, showSpy);

      instance.show();

      expect(showSpy).toHaveBeenCalledTimes(1);
    });

    test('should fire show event before sheet is visible', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const showSpy = jest.fn(() => {
        expect(instance.isShown).toBe(false);
        expect(instance.isTransitioning).toBe(false);
        expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      });

      sheet.addEventListener(EVENT.SHOW, showSpy);

      instance.show();

      expect(showSpy).toHaveBeenCalled();
    });

    test('should be cancelable via preventDefault', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      sheet.addEventListener(EVENT.SHOW, (event) => {
        event.preventDefault();
      });

      instance.show();

      expect(instance.isShown).toBe(false);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOWING);
    });

    test('should have correct event properties', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      let capturedEvent = null;
      sheet.addEventListener(EVENT.SHOW, (event) => {
        capturedEvent = event;
      });

      instance.show();

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.type).toBe(EVENT.SHOW);
      expect(capturedEvent.bubbles).toBe(true);
      expect(capturedEvent.cancelable).toBe(true);
      expect(capturedEvent.target).toBe(sheet);
    });
  });

  describe(EVENT.SHOWN, () => {
    test('should fire shown event after transition completes', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const shownSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOWN, shownSpy);

      instance.show();

      // Should not be called immediately
      expect(shownSpy).not.toHaveBeenCalled();

      // Should be called after transition
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(shownSpy).toHaveBeenCalledTimes(1);
    });

    test('should fire after sheet is fully visible', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const shownSpy = jest.fn(() => {
        expect(instance.isShown).toBe(true);
        expect(instance.isTransitioning).toBe(false);
        expect(sheet).toHaveClass(CLASS_NAME.SHOW);
        expect(sheet).not.toHaveClass(CLASS_NAME.SHOWING);
      });

      sheet.addEventListener(EVENT.SHOWN, shownSpy);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(shownSpy).toHaveBeenCalled();
    });

    test('should fire even if show is called multiple times', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const shownSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOWN, shownSpy);

      instance.show();
      instance.show(); // Second call should be ignored
      instance.show(); // Third call should be ignored

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(shownSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe(EVENT.HIDE, () => {
    test('should fire hide event when hide() is called', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hideSpy = jest.fn();
      sheet.addEventListener(EVENT.HIDE, hideSpy);

      instance.hide();

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    test('should fire hide event before sheet starts hiding', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hideSpy = jest.fn(() => {
        expect(instance.isShown).toBe(true);
        expect(instance.isTransitioning).toBe(false);
        expect(sheet).toHaveClass(CLASS_NAME.SHOW);
      });

      sheet.addEventListener(EVENT.HIDE, hideSpy);

      instance.hide();

      expect(hideSpy).toHaveBeenCalled();
    });

    test('should be cancelable via preventDefault', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      sheet.addEventListener(EVENT.HIDE, (event) => {
        event.preventDefault();
      });

      instance.hide();

      expect(instance.isShown).toBe(true);
      expect(sheet).toHaveClass(CLASS_NAME.SHOW);
    });

    test('should bubble up the DOM', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const bodySpy = jest.fn();
      document.body.addEventListener(EVENT.HIDE, bodySpy);

      instance.hide();

      expect(bodySpy).toHaveBeenCalled();

      document.body.removeEventListener(EVENT.HIDE, bodySpy);
    });
  });

  describe(EVENT.HIDDEN, () => {
    test('should fire hidden event after transition completes', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hiddenSpy = jest.fn();
      sheet.addEventListener(EVENT.HIDDEN, hiddenSpy);

      instance.hide();

      // Should not be called immediately
      expect(hiddenSpy).not.toHaveBeenCalled();

      // Should be called after transition
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(hiddenSpy).toHaveBeenCalledTimes(1);
    });

    test('should fire after sheet is fully hidden', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hiddenSpy = jest.fn(() => {
        expect(instance.isShown).toBe(false);
        expect(instance.isTransitioning).toBe(false);
        expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
        expect(sheet).not.toHaveClass(CLASS_NAME.HIDING);
      });

      sheet.addEventListener(EVENT.HIDDEN, hiddenSpy);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(hiddenSpy).toHaveBeenCalled();
    });

    test('should not be cancelable', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      sheet.addEventListener(EVENT.HIDDEN, (event) => {
        event.preventDefault();
      });

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should fire backdrop is removed', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hiddenSpy = jest.fn(() => {
        expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
      });

      sheet.addEventListener(EVENT.HIDDEN, hiddenSpy);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(hiddenSpy).toHaveBeenCalled();
    });
  });

  describe(EVENT.SLIDE, () => {
    test('should fire slide event during drag', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const slideSpy = jest.fn();
      sheet.addEventListener(EVENT.SLIDE, slideSpy);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Simulate drag
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

      jest.advanceTimersByTime(16); // Next animation frame

      expect(slideSpy).toHaveBeenCalled();
    });

    test('should include velocity in event detail', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      let capturedEvent = null;
      sheet.addEventListener(EVENT.SLIDE, (event) => {
        capturedEvent = event;
      });

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

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.detail).toHaveProperty('velocity');
      expect(capturedEvent.detail).toHaveProperty('adjustedY');
      expect(capturedEvent.detail).toHaveProperty('deltaY');
      expect(capturedEvent.detail).toHaveProperty('ratio');
    });

    test('should not fire if gestures are disabled', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: false });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const slideSpy = jest.fn();
      sheet.addEventListener(EVENT.SLIDE, slideSpy);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(slideSpy).not.toHaveBeenCalled();
    });

    test('should not be cancelable', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      sheet.addEventListener(EVENT.SLIDE, (event) => {
        event.preventDefault();
      });

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

      // Drag should continue despite preventDefault
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Event order', () => {
    test('should fire events in correct order during show', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const eventOrder = [];

      sheet.addEventListener(EVENT.SHOW, () => {
        eventOrder.push(EVENT.SHOW);
      });

      sheet.addEventListener(EVENT.SHOWN, () => {
        eventOrder.push(EVENT.SHOWN);
      });

      instance.show();

      expect(eventOrder).toEqual([EVENT.SHOW]);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(eventOrder).toEqual([EVENT.SHOW, EVENT.SHOWN]);
    });

    test('should fire events in correct order during hide', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const eventOrder = [];

      sheet.addEventListener(EVENT.HIDE, () => {
        eventOrder.push(EVENT.HIDE);
      });

      sheet.addEventListener(EVENT.HIDDEN, () => {
        eventOrder.push(EVENT.HIDDEN);
      });

      instance.hide();

      expect(eventOrder).toEqual([EVENT.HIDE]);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(eventOrder).toEqual([EVENT.HIDE, EVENT.HIDDEN]);
    });
  });

  describe('Event listeners cleanup', () => {
    test('should remove event listeners on dispose', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const showSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOW, showSpy);

      instance.dispose();

      // Try to trigger event manually
      const event = new CustomEvent(EVENT.SHOW, { bubbles: true });
      sheet.dispatchEvent(event);

      expect(showSpy).toHaveBeenCalledTimes(1); // Only the manual dispatch
    });

    test('should not fire events after dispose', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const showSpy = jest.fn();
      const shownSpy = jest.fn();

      sheet.addEventListener(EVENT.SHOW, showSpy);
      sheet.addEventListener(EVENT.SHOWN, shownSpy);

      instance.dispose();

      // These should not work after dispose
      expect(() => instance.show()).not.toThrow();

      expect(showSpy).not.toHaveBeenCalled();
      expect(shownSpy).not.toHaveBeenCalled();
    });
  });

  describe('Event detail data', () => {
    test('slide event ratio should be between 0 and 1', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      // Mock sheet height
      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      let capturedRatio = null;
      sheet.addEventListener(EVENT.SLIDE, (event) => {
        capturedRatio = event.detail.ratio;
      });

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

      expect(capturedRatio).not.toBeNull();
      expect(capturedRatio).toBeGreaterThanOrEqual(0);
      expect(capturedRatio).toBeLessThanOrEqual(1);
    });
  });
});
