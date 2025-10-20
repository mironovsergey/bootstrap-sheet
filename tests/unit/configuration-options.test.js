import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Configuration Options', () => {
  describe('Boolean options', () => {
    test('backdrop option should control backdrop creation', async () => {
      const sheet1 = createSheet();
      const instance1 = new BootstrapSheet(sheet1, { backdrop: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      instance1.dispose();

      const sheet2 = createSheet();
      const instance2 = new BootstrapSheet(sheet2, { backdrop: false });

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('backdrop option should accept "static" value', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: 'static' });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.dataset.bsStatic).toBe('');

      // Click backdrop should not close sheet
      backdrop.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
    });

    test('keyboard option should control ESC key behavior', async () => {
      const sheet1 = createSheet();
      const instance1 = new BootstrapSheet(sheet1, { keyboard: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent1 = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent1);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance1.isShown).toBe(false);

      instance1.dispose();

      const sheet2 = createSheet();
      const instance2 = new BootstrapSheet(sheet2, { keyboard: false });

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const escapeEvent2 = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent2);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance2.isShown).toBe(true);
    });

    test('focus option should control focus management', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const sheet1 = createSheet({ withHeader: false });
      const body1 = sheet1.querySelector('.sheet-body');
      const input1 = document.createElement('input');
      body1.appendChild(input1);

      const instance1 = new BootstrapSheet(sheet1, { focus: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(input1);

      instance1.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(button);

      instance1.dispose();

      button.focus();

      const sheet2 = createSheet({ withHeader: false });
      const body2 = sheet2.querySelector('.sheet-body');
      const input2 = document.createElement('input');
      body2.appendChild(input2);

      const instance2 = new BootstrapSheet(sheet2, { focus: false });

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(button);

      instance2.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.activeElement).toBe(button);
    });

    test('gestures option should control swipe functionality', async () => {
      const sheet1 = createSheet({ withDragHandle: true, withHeader: true });
      const instance1 = new BootstrapSheet(sheet1, { gestures: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle1 = sheet1.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown1 = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle1.dispatchEvent(pointerDown1);

      expect(sheet1).toHaveClass(CLASS_NAME.DRAGGING);

      instance1.dispose();

      const sheet2 = createSheet({ withDragHandle: true, withHeader: true });
      const instance2 = new BootstrapSheet(sheet2, { gestures: false });

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle2 = sheet2.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown2 = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle2.dispatchEvent(pointerDown2);

      expect(sheet2).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Number options', () => {
    test('swipeThreshold option should affect close threshold', async () => {
      const sheet = createSheet({ withDragHandle: true, withHeader: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        swipeThreshold: 200,
        closeThresholdRatio: 0,
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
        clientY: 150,
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

      await advanceTimersAndFlush(TRANSITION_WAIT * 2);

      // Should not close (150 < 200)
      expect(instance.isShown).toBe(true);
    });

    test('velocityThreshold option should affect velocity-based close', async () => {
      const sheet = createSheet({ withDragHandle: true, withHeader: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        velocityThreshold: 10,
        minCloseDistance: 20,
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

      await advanceTimersAndFlush(TRANSITION_WAIT * 2);

      // Should not close (velocity < 10)
      expect(instance.isShown).toBe(true);
    });

    test('animationDuration option should control transition timing', async () => {
      const customDuration = 500;
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        animationDuration: customDuration,
      });

      const shownSpy = jest.fn();
      sheet.addEventListener('shown.bs.sheet', shownSpy);

      instance.show();

      // Should not be called before custom duration
      jest.advanceTimersByTime(customDuration - 100);
      expect(shownSpy).not.toHaveBeenCalled();

      // Should be called after custom duration
      await advanceTimersAndFlush(200);
      expect(shownSpy).toHaveBeenCalled();
    });

    test('closeThresholdRatio option should affect close threshold', async () => {
      const sheet = createSheet({ withDragHandle: true, withHeader: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        closeThresholdRatio: 0.5,
        swipeThreshold: 0,
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

      // Drag 51% of height (should close)
      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 210,
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

      expect(instance.isShown).toBe(false);
    });

    test('dragResistanceUp option should affect upward drag resistance', async () => {
      const sheet = createSheet({ withDragHandle: true, withHeader: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        dragResistanceUp: 0.9,
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
        clientY: 100,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const transform = sheet.style.transform;
      const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)/);
      const translateY = match ? parseFloat(match[1]) : 0;

      // High resistance means less movement
      expect(Math.abs(translateY)).toBeLessThan(60);
    });

    test('dragResistanceDown option should affect downward drag resistance', async () => {
      const sheet = createSheet({ withDragHandle: true, withHeader: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        dragResistanceDown: 0.5,
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
        clientY: 100,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMove);

      jest.advanceTimersByTime(16);

      const transform = sheet.style.transform;
      const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)/);
      const translateY = match ? parseFloat(match[1]) : 0;

      // Medium resistance means some movement but not full
      expect(translateY).toBeGreaterThan(0);
      expect(translateY).toBeLessThan(100);
    });
  });

  describe('Data attribute parsing', () => {
    test('should parse boolean data attributes correctly', () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'false',
          keyboard: 'true',
          focus: 'false',
          gestures: 'true',
        },
      });

      const instance = new BootstrapSheet(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
    });

    test('should parse number data attributes correctly', () => {
      const sheet = createSheet({
        dataAttributes: {
          'swipe-threshold': '100',
          'velocity-threshold': '0.8',
          'animation-duration': '500',
          'close-threshold-ratio': '0.4',
        },
      });

      const instance = new BootstrapSheet(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
    });

    test('should parse string data attributes correctly', () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'static',
        },
      });

      const instance = new BootstrapSheet(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
    });
  });

  describe('Configuration priority', () => {
    test('should prioritize constructor config over data attributes', async () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'true',
        },
      });

      const instance = new BootstrapSheet(sheet, { backdrop: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Constructor config (false) should win over data-attr (true)
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should prioritize data attributes over defaults', async () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'false',
        },
      });

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Data-attr (false) should win over default (true)
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should merge configs correctly: defaults < data-attrs < constructor', async () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'true',
          keyboard: 'false',
        },
      });

      const instance = new BootstrapSheet(sheet, {
        keyboard: true, // Overrides data-attr
        focus: false,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // backdrop: true from data-attrs
      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.dataset.bsStatic).not.toBeDefined();

      // keyboard: true from constructor (overrides data-attr false)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });
  });

  describe('Type validation', () => {
    test('should throw TypeError for invalid backdrop type', () => {
      const sheet = createSheet();

      expect(() => {
        new BootstrapSheet(sheet, { backdrop: 123 });
      }).toThrow(TypeError);

      expect(() => {
        new BootstrapSheet(sheet, { backdrop: [] });
      }).toThrow(TypeError);
    });

    test('should accept valid backdrop types', () => {
      const sheet1 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet1, { backdrop: true });
      }).not.toThrow();

      const sheet2 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet2, { backdrop: false });
      }).not.toThrow();

      const sheet3 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet3, { backdrop: 'static' });
      }).not.toThrow();
    });

    test('should throw TypeError for invalid boolean options', () => {
      const sheet1 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet1, { keyboard: 'yes' });
      }).toThrow(TypeError);

      const sheet2 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet2, { focus: 1 });
      }).toThrow(TypeError);

      const sheet3 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet3, { gestures: 'true' });
      }).toThrow(TypeError);
    });

    test('should throw TypeError for invalid number options', () => {
      const sheet1 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet1, { swipeThreshold: '50' });
      }).toThrow(TypeError);

      const sheet2 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet2, { velocityThreshold: true });
      }).toThrow(TypeError);

      const sheet3 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet3, { animationDuration: '300' });
      }).toThrow(TypeError);

      const sheet4 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet4, { closeThresholdRatio: '0.3' });
      }).toThrow(TypeError);
    });

    test('should provide helpful error messages', () => {
      const sheet = createSheet();

      expect(() => {
        new BootstrapSheet(sheet, { keyboard: 'yes' });
      }).toThrow(
        '[sheet] Option "keyboard" has invalid type: expected boolean, but received string',
      );

      expect(() => {
        new BootstrapSheet(sheet, { animationDuration: '300' });
      }).toThrow(
        '[sheet] Option "animationDuration" has invalid type: expected number, but received string',
      );
    });

    test('should allow undefined values to use defaults', () => {
      const sheet = createSheet();

      expect(() => {
        new BootstrapSheet(sheet, {
          backdrop: undefined,
          keyboard: undefined,
        });
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    test('should handle empty config object', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, {});
      }).not.toThrow();
    });

    test('should handle null config', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, null);
      }).not.toThrow();
    });

    test('should ignore unknown config options', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, {
          backdrop: true,
          unknownOption: 'value',
          anotherUnknown: 123,
        });
      }).not.toThrow();
    });

    test('should handle extreme number values', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, {
          swipeThreshold: 0,
          velocityThreshold: 0,
          animationDuration: 1,
          closeThresholdRatio: 0,
          dragResistanceUp: 0,
          dragResistanceDown: 0,
        });
      }).not.toThrow();
    });

    test('should handle negative numbers', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, {
          swipeThreshold: -10,
          animationDuration: -100,
        });
      }).not.toThrow();
    });
  });
});
