import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush, TRANSITION_WAIT } from '../setup/test-utils';

describe('BootstrapSheet - Configuration Options', () => {
  describe('Static properties', () => {
    test('NAME should return component name', () => {
      expect(BootstrapSheet.NAME).toBe('sheet');
    });
  });

  describe('Deprecated options', () => {
    test('should warn when deprecated option is passed', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const sheet = createSheet();

      new BootstrapSheet(sheet, { swipeThreshold: 80 });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[sheet] Option "swipeThreshold" is deprecated'),
      );
      consoleWarnSpy.mockRestore();
    });
  });

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

    test('static backdrop click should trigger shake effect', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: 'static' });

      const animateSpy = jest.fn();
      sheet.animate = animateSpy;

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      backdrop.click();

      expect(animateSpy).toHaveBeenCalled();
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
    test('springDampingRatio and springResponse options should be accepted', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        gestures: true,
        springDampingRatio: 1.0,
        springResponse: 0.3,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      // Events upfront to prevent timestamp drift
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

      // Spring snap-back completes - sheet stays open
      await advanceTimersAndFlush(2000);
      expect(instance.isShown).toBe(true);
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
          'spring-damping-ratio': '0.8',
          'spring-response': '0.3',
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
        new BootstrapSheet(sheet1, { springDampingRatio: '0.8' });
      }).toThrow(TypeError);

      const sheet2 = createSheet();
      expect(() => {
        new BootstrapSheet(sheet2, { springResponse: true });
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
        new BootstrapSheet(sheet, { springDampingRatio: '0.8' });
      }).toThrow(
        '[sheet] Option "springDampingRatio" has invalid type: expected number, but received string',
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

  describe('Spring boundary values', () => {
    test('springResponse = 0.1 (minimum) should show and settle without flickering', async () => {
      const sheet = createSheet();
      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });
      const instance = new BootstrapSheet(sheet, {
        springDampingRatio: 0.8,
        springResponse: 0.1,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(false);
    });

    test('springResponse = 1.0 (slow) should show and settle', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        springDampingRatio: 1.0,
        springResponse: 1.0,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(false);
    });

    test('springDampingRatio = 2.0 (overdamped) should show and settle', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        springDampingRatio: 2.0,
        springResponse: 0.4,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(false);
    });

    test('springDampingRatio = 0.2 (bouncy) should show and eventually settle', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        springDampingRatio: 0.2,
        springResponse: 0.4,
      });

      instance.show();
      await advanceTimersAndFlush(3000);

      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(false);
    });

    test('extreme combination: response = 0.1 + dampingRatio = 0.2 should settle', async () => {
      const sheet = createSheet();
      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: 400 });
      const instance = new BootstrapSheet(sheet, {
        springDampingRatio: 0.2,
        springResponse: 0.1,
      });

      instance.show();
      await advanceTimersAndFlush(5000);

      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(false);
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
          springDampingRatio: 0,
          springResponse: 0.1,
        });
      }).not.toThrow();
    });

    test('should handle negative numbers', () => {
      const sheet = createSheet();
      expect(() => {
        new BootstrapSheet(sheet, {
          springDampingRatio: -1,
          springResponse: -0.1,
        });
      }).not.toThrow();
    });
  });
});
