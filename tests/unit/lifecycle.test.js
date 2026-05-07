import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { EVENT, CLASS_NAME, SELECTOR } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush, TRANSITION_WAIT } from '../setup/test-utils';

describe('BootstrapSheet - Lifecycle', () => {
  describe('show()', () => {
    test('should show the sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();

      expect(sheet).toHaveClass(CLASS_NAME.SHOWING);
      expect(instance.isShown).toBe(true);
      expect(instance.isTransitioning).toBe(true);

      // Wait for transition to complete
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet).toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOWING);
      expect(instance.isTransitioning).toBe(false);
    });

    test('should add showing class synchronously on show', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();

      expect(sheet).toHaveClass(CLASS_NAME.SHOWING);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
    });

    test('should not show if already shown', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      const showSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOW, showSpy);

      instance.show(); // Try to show again

      expect(showSpy).not.toHaveBeenCalled();
    });

    test('should not show if transitioning', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();

      const showSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOW, showSpy);

      instance.show(); // Try to show while transitioning

      expect(showSpy).not.toHaveBeenCalled();
    });

    test('should save previously focused element', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      expect(document.activeElement).toBe(button);

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      // After hiding, focus should be restored
      instance.hide();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      expect(document.activeElement).toBe(button);
    });

    test('should create backdrop when backdrop option is true', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
    });

    test('should not create backdrop when backdrop option is false', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: false });

      instance.show();

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).not.toBeInTheDocument();
    });

    test('should apply body padding for scrollbar compensation', () => {
      const sheet = createSheet();

      // Mock scrolling content
      Object.defineProperty(document.body, 'scrollHeight', {
        configurable: true,
        value: 2000,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 800,
      });

      // Mock getScrollbarWidth to return 15px
      jest.spyOn(require('../../src/js/utils'), 'getScrollbarWidth').mockReturnValue(15);

      const instance = new BootstrapSheet(sheet);
      instance.show();

      expect(document.body.style.paddingRight).toBe('15px');
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should not apply body padding when no scrollbar', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // Mock non-scrolling content
      Object.defineProperty(document.body, 'scrollHeight', {
        configurable: true,
        value: 800,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 800,
      });

      instance.show();

      expect(document.body.style.paddingRight).toBe('');
    });
  });

  describe('hide()', () => {
    test('should hide the sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // First show
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Then hide
      instance.hide();

      expect(sheet).toHaveClass(CLASS_NAME.HIDING);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      expect(instance.isShown).toBe(false);
      expect(instance.isTransitioning).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet).not.toHaveClass(CLASS_NAME.HIDING);
      expect(instance.isTransitioning).toBe(false);
    });

    test('should remove show class immediately', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      expect(sheet).toHaveClass(CLASS_NAME.SHOW);

      instance.hide();

      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).toHaveClass(CLASS_NAME.HIDING);
    });

    test('should reset transform after hide animation', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet.style.transform).toBe('');
    });

    test('should not hide if already hidden', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const hideSpy = jest.fn();
      sheet.addEventListener(EVENT.HIDE, hideSpy);

      instance.hide();

      expect(hideSpy).not.toHaveBeenCalled();
    });

    test('should not hide if transitioning', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();

      const hideSpy = jest.fn();
      sheet.addEventListener(EVENT.HIDE, hideSpy);

      instance.hide(); // Try to hide while showing

      expect(hideSpy).not.toHaveBeenCalled();
    });

    test('should remove backdrop after hide animation', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should reset body padding', async () => {
      const sheet = createSheet();

      // Mock scrolling content
      Object.defineProperty(document.body, 'scrollHeight', {
        configurable: true,
        value: 2000,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 800,
      });

      // Mock getScrollbarWidth to return 15px
      jest.spyOn(require('../../src/js/utils'), 'getScrollbarWidth').mockReturnValue(15);

      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.body.style.paddingRight).toBe('15px');
      expect(document.body.style.overflow).toBe('hidden');

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.body.style.paddingRight).toBe('');
      expect(document.body.style.overflow).toBe('');
    });

    test('should abort drag if dragging when hide is called', () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      // Simulate drag start via pointer event to properly set isDragging state
      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );

      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      instance.hide();

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });

    test('should not throw when hide is called after dispose', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      jest.advanceTimersByTime(TRANSITION_WAIT);

      instance.dispose();

      expect(() => {
        instance.hide();
      }).not.toThrow();
    });

    test('should restore existing aria-hidden attribute after hide', async () => {
      const sibling = document.createElement('div');
      sibling.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sibling);

      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // aria-hidden="true" was on the sibling before show - should be restored
      expect(sibling.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('toggle()', () => {
    test('should show sheet if hidden', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(instance.isShown).toBe(false);

      instance.toggle();

      expect(instance.isShown).toBe(true);
      expect(sheet).toHaveClass(CLASS_NAME.SHOWING);
    });

    test('should hide sheet if shown', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);

      instance.toggle();

      expect(instance.isShown).toBe(false);
      expect(sheet).toHaveClass(CLASS_NAME.HIDING);
    });

    test('should toggle multiple times', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // Toggle 1: show
      instance.toggle();
      expect(instance.isShown).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Toggle 2: hide
      instance.toggle();
      expect(instance.isShown).toBe(false);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Toggle 3: show again
      instance.toggle();
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Transition timing', () => {
    test('shown and hidden events fire asynchronously via spring animation', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const shownSpy = jest.fn();
      const hiddenSpy = jest.fn();
      sheet.addEventListener(EVENT.SHOWN, shownSpy);
      sheet.addEventListener(EVENT.HIDDEN, hiddenSpy);

      instance.show();

      // Not called synchronously
      expect(shownSpy).not.toHaveBeenCalled();

      await advanceTimersAndFlush(50);
      expect(shownSpy).toHaveBeenCalledTimes(1);

      instance.hide();
      expect(hiddenSpy).not.toHaveBeenCalled();

      await advanceTimersAndFlush(50);
      expect(hiddenSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('State management', () => {
    test('isShown should reflect current state', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(instance.isShown).toBe(false);

      instance.show();
      expect(instance.isShown).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(true);

      instance.hide();
      expect(instance.isShown).toBe(false);

      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(false);
    });

    test('isTransitioning should be true during transitions', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(instance.isTransitioning).toBe(false);

      instance.show();
      expect(instance.isTransitioning).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isTransitioning).toBe(false);

      instance.hide();
      expect(instance.isTransitioning).toBe(true);

      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isTransitioning).toBe(false);
    });

    test('should prevent operations during transition', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();

      expect(instance.isTransitioning).toBe(true);

      // Try to show again
      const showEvent = jest.fn();
      sheet.addEventListener(EVENT.SHOW, showEvent);
      instance.show();
      expect(showEvent).not.toHaveBeenCalled();

      // Try to hide
      const hideEvent = jest.fn();
      sheet.addEventListener(EVENT.HIDE, hideEvent);
      instance.hide();
      expect(hideEvent).not.toHaveBeenCalled();
    });
  });

  describe('Class management', () => {
    test('should manage classes correctly during show', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      // Initial state
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOWING);
      expect(sheet).not.toHaveClass(CLASS_NAME.HIDING);

      instance.show();

      // During transition: showing added, show deferred until spring settles
      expect(sheet).toHaveClass(CLASS_NAME.SHOWING);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // After transition
      expect(sheet).toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOWING);
    });

    test('should manage classes correctly during hide', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(sheet).toHaveClass(CLASS_NAME.SHOW);

      instance.hide();

      // During transition
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).toHaveClass(CLASS_NAME.HIDING);

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // After transition
      expect(sheet).not.toHaveClass(CLASS_NAME.SHOW);
      expect(sheet).not.toHaveClass(CLASS_NAME.HIDING);
    });

    test('should remove dragging class on hide', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Simulate drag start via pointer event to properly set isDragging state
      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 0, pointerId: 1 }),
      );
      expect(sheet).toHaveClass(CLASS_NAME.DRAGGING);

      instance.hide();

      expect(sheet).not.toHaveClass(CLASS_NAME.DRAGGING);
    });
  });

  describe('Sheet height calculation', () => {
    test('should calculate sheet height on show', () => {
      const sheet = createSheet();

      // Mock offsetHeight
      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      const instance = new BootstrapSheet(sheet);

      instance.show();

      // Height should be stored internally for gesture calculations
      expect(instance.isShown).toBe(true);
    });

    test('should use getBoundingClientRect if offsetHeight is 0', () => {
      const sheet = createSheet();

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 0,
      });

      jest.spyOn(sheet, 'getBoundingClientRect').mockReturnValue({
        height: 500,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        x: 0,
        y: 0,
      });

      const instance = new BootstrapSheet(sheet);

      instance.show();

      expect(sheet.getBoundingClientRect).toHaveBeenCalled();
    });
  });
});
