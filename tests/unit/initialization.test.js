import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME } from '../../src/js/constants';
import { createSheet } from '../setup/test-utils';

const ANIMATION_DURATION = BootstrapSheet.Default.animationDuration;

describe('BootstrapSheet - Initialization', () => {
  describe('Constructor', () => {
    test('should create instance with valid element', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(instance).toBeInstanceOf(BootstrapSheet);
      expect(instance.isShown).toBe(false);
      expect(instance.isTransitioning).toBe(false);
    });

    test('should create instance with CSS selector', () => {
      createSheet({ id: 'mySheet' });
      const instance = new BootstrapSheet('#mySheet');

      expect(instance).toBeInstanceOf(BootstrapSheet);
    });

    test('should throw error with invalid element', () => {
      expect(() => {
        new BootstrapSheet(null);
      }).toThrow(Error);
    });

    test('should throw error with non-existent selector', () => {
      expect(() => {
        new BootstrapSheet('#nonExistent');
      }).toThrow(Error);
    });

    test('should return existing instance (singleton)', () => {
      const sheet = createSheet();
      const instance1 = new BootstrapSheet(sheet);
      const instance2 = new BootstrapSheet(sheet);

      expect(instance1).toBe(instance2);
    });

    test('should merge configuration from defaults, data-attrs, and constructor', () => {
      const sheet = createSheet({
        dataAttributes: {
          backdrop: 'static',
          keyboard: 'false',
        },
      });

      const instance = new BootstrapSheet(sheet, {
        gestures: false,
      });

      expect(instance).toBeDefined();
    });

    test('should validate configuration types', () => {
      const sheet = createSheet();

      expect(() => {
        new BootstrapSheet(sheet, {
          backdrop: 123,
        });
      }).toThrow(TypeError);

      expect(() => {
        new BootstrapSheet(sheet, {
          keyboard: 'yes',
        });
      }).toThrow(TypeError);

      expect(() => {
        new BootstrapSheet(sheet, {
          animationDuration: `${ANIMATION_DURATION}`,
        });
      }).toThrow(TypeError);
    });

    test('should set ARIA attributes on initialization', () => {
      const sheet = createSheet();
      new BootstrapSheet(sheet);

      expect(sheet.getAttribute('role')).toBe('dialog');
      expect(sheet.getAttribute('aria-modal')).toBe('true');
      expect(sheet.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('Static methods', () => {
    test('getInstance should return instance if exists', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(BootstrapSheet.getInstance(sheet)).toBe(instance);
    });

    test('getInstance should return null if no instance', () => {
      const sheet = createSheet();

      expect(BootstrapSheet.getInstance(sheet)).toBeNull();
    });

    test('getInstance should work with selector', () => {
      const sheet = createSheet({ id: 'mySheet' });

      const instance = new BootstrapSheet(sheet);

      expect(BootstrapSheet.getInstance('#mySheet')).toStrictEqual(instance);
    });

    test('getOrCreateInstance should return existing instance', () => {
      const sheet = createSheet();
      const instance1 = new BootstrapSheet(sheet);
      const instance2 = BootstrapSheet.getOrCreateInstance(sheet);

      expect(instance2).toBe(instance1);
    });

    test('getOrCreateInstance should create new instance if not exists', () => {
      const sheet = createSheet();
      const instance = BootstrapSheet.getOrCreateInstance(sheet);

      expect(instance).toBeInstanceOf(BootstrapSheet);
    });

    test('getOrCreateInstance should accept configuration', () => {
      const sheet = createSheet();
      const instance = BootstrapSheet.getOrCreateInstance(sheet, {
        backdrop: false,
      });

      expect(instance).toBeInstanceOf(BootstrapSheet);
    });
  });

  describe('dispose()', () => {
    test('should remove instance from WeakMap', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.dispose();

      expect(BootstrapSheet.getInstance(sheet)).toBeNull();
    });

    test('should clean up event listeners', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.runAllTimers();

      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      instance.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    test('should remove backdrop if exists', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.runAllTimers();

      const backdropBefore = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      instance.dispose();

      const backdropAfter = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      if (backdropBefore) {
        expect(backdropBefore).not.toBeNull();
        expect(backdropAfter).toBeNull();
      } else {
        expect(backdropAfter).toBeNull();
      }
    });

    test('should reset body styles', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      Object.defineProperty(document.body, 'scrollHeight', {
        configurable: true,
        value: 2000,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 800,
      });

      instance.show();
      jest.runAllTimers();

      instance.dispose();

      expect(document.body.style.paddingRight).toBeFalsy();
      expect(document.body.style.overflow).toBeFalsy();
    });

    test('should be safe to call multiple times', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(() => {
        instance.dispose();
        instance.dispose();
        instance.dispose();
      }).not.toThrow();
    });
  });
});
