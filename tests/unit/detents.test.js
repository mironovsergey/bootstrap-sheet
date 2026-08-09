import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { EVENT, CLASS_NAME } from '../../src/js/constants';
import DetentModel, { parseDetents } from '../../src/js/detents';
import {
  createSheet,
  getTranslateY,
  advanceTimersAndFlush,
  simulatePointerEvent,
  startDrag,
  setSheetHeight,
  triggerResize,
  TRANSITION_WAIT,
} from '../setup/test-utils';

const SHEET_HEIGHT = 400;

/**
 * Time budget for a spring that has to travel a detent's worth of distance.
 * The show transition of a partially open sheet is a real animation, unlike
 * the zero-length one a fully open sheet performs in jsdom.
 */
const SETTLE_WAIT = 2000;

/**
 * Make the page look scrollable with a 15 px scrollbar, which is what the
 * body scroll lock needs before it does anything at all
 */
function mockPageScrollbar() {
  Object.defineProperty(document.body, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

  jest.spyOn(require('../../src/js/utils'), 'getScrollbarWidth').mockReturnValue(15);
}

/**
 * Show a sheet with a known height and the given options
 */
async function showSheet(options = {}, sheetOptions = {}) {
  const sheet = createSheet(sheetOptions);

  setSheetHeight(sheet, SHEET_HEIGHT);

  const instance = new BootstrapSheet(sheet, options);

  instance.show();
  await advanceTimersAndFlush(SETTLE_WAIT);

  return { sheet, instance };
}

describe('BootstrapSheet - Detents', () => {
  describe('parseDetents', () => {
    test('should parse a comma-separated list', () => {
      expect(parseDetents('0.4,1')).toEqual([0.4, 1]);
      expect(parseDetents(' 0.25 , 0.5 , 1 ')).toEqual([0.25, 0.5, 1]);
    });

    test('should parse a JSON array', () => {
      expect(parseDetents('[0.4, 1]')).toEqual([0.4, 1]);
    });

    test('should pass non-strings through untouched', () => {
      const list = [0.4, 1];

      expect(parseDetents(list)).toBe(list);
      expect(parseDetents(null)).toBeNull();
    });

    test('should return malformed JSON unchanged so validation can reject it', () => {
      expect(parseDetents('[0.4, 1')).toBe('[0.4, 1');
    });
  });

  describe('DetentModel', () => {
    test('should sort and deduplicate', () => {
      expect(new DetentModel([1, 0.4, 1, 0.7]).list).toEqual([0.4, 0.7, 1]);
    });

    test('should expose the smallest and largest detent', () => {
      const model = new DetentModel([0.4, 1, 0.7]);

      expect(model.smallest).toBe(0.4);
      expect(model.largest).toBe(1);
      expect(model.isMultiDetent).toBe(true);
    });

    test('should reject values outside (0, 1]', () => {
      expect(() => new DetentModel([0])).toThrow(TypeError);
      expect(() => new DetentModel([1.5])).toThrow(TypeError);
      expect(() => new DetentModel([-0.5])).toThrow(TypeError);
      expect(() => new DetentModel([])).toThrow(TypeError);
      expect(() => new DetentModel(['0.5'])).toThrow(TypeError);
    });

    test('should convert a detent to a position', () => {
      const model = new DetentModel([0.4, 1]);

      expect(model.positionOf(1, 400)).toBe(0);
      expect(model.positionOf(0.4, 400)).toBeCloseTo(240, 5);
    });

    test('should report the detent above a given one', () => {
      const model = new DetentModel([0.3, 0.6, 1]);

      expect(model.above(0.3)).toBe(0.6);
      expect(model.above(0.6)).toBe(1);
      expect(model.above(1)).toBeNull();
    });

    describe('resolve', () => {
      test('should reproduce the midpoint rule for a single detent', () => {
        const model = new DetentModel([1]);

        // Exactly at the midpoint the sheet stays open, as before detents
        expect(model.resolve(200, 400)).toEqual({ detent: 1, position: 0 });
        expect(model.resolve(201, 400)).toEqual({ detent: null, position: 400 });
      });

      test('should snap to the nearest detent', () => {
        const model = new DetentModel([0.5, 1]);

        // Positions: detent 1 → 0, detent 0.5 → 200, closed → 400
        expect(model.resolve(40, 400).detent).toBe(1);
        expect(model.resolve(180, 400).detent).toBe(0.5);
        expect(model.resolve(260, 400).detent).toBe(0.5);
        expect(model.resolve(380, 400).detent).toBeNull();
      });

      test('should dismiss only below the smallest detent', () => {
        const model = new DetentModel([0.5, 1]);

        expect(model.resolve(299, 400).detent).toBe(0.5);
        expect(model.resolve(301, 400).detent).toBeNull();
      });
    });
  });

  describe('Configuration', () => {
    test('should default to a single fully open detent', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      expect(instance.currentDetent).toBe(1);
    });

    test('should open at the smallest detent by default', async () => {
      const { instance } = await showSheet({ detents: [0.4, 1] });

      expect(instance.currentDetent).toBe(0.4);
    });

    test('should open at initialDetent when configured', async () => {
      const { instance } = await showSheet({ detents: [0.4, 1], initialDetent: 1 });

      expect(instance.currentDetent).toBe(1);
    });

    test('should position the sheet at its initial detent', async () => {
      const { sheet } = await showSheet({ detents: [0.4, 1] });

      // 40 % visible of a 400 px sheet leaves it translated by 240 px
      expect(getTranslateY(sheet)).toBeCloseTo(240, 5);
    });

    test('should accept detents from a data attribute', async () => {
      const { instance } = await showSheet({}, { dataAttributes: { detents: '0.4,1' } });

      expect(instance.currentDetent).toBe(0.4);
    });

    test('should reject an initialDetent that is not configured', () => {
      const sheet = createSheet();

      expect(() => new BootstrapSheet(sheet, { detents: [0.4, 1], initialDetent: 0.7 })).toThrow(
        TypeError,
      );
    });

    test('should reject an undimmedDetent that is not configured', () => {
      const sheet = createSheet();

      expect(() => new BootstrapSheet(sheet, { detents: [0.4, 1], undimmedDetent: 0.7 })).toThrow(
        TypeError,
      );
    });

    test('should reject an undimmedDetent that leaves the sheet never modal', () => {
      const sheet = createSheet();

      expect(() => new BootstrapSheet(sheet, { detents: [0.4, 1], undimmedDetent: 1 })).toThrow(
        TypeError,
      );
    });
  });

  describe('setDetent()', () => {
    test('should animate to another detent and fire detentchange', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      const changeSpy = jest.fn();
      sheet.addEventListener(EVENT.DETENT_CHANGE, changeSpy);

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(instance.currentDetent).toBe(1);
      expect(getTranslateY(sheet)).toBe(0);
      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail).toEqual({ detent: 1, previousDetent: 0.4 });
    });

    test('should ignore a detent that is not configured', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { instance } = await showSheet({ detents: [0.4, 1] });

      instance.setDetent(0.7);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(instance.currentDetent).toBe(0.4);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('setDetent()'));

      consoleWarnSpy.mockRestore();
    });

    test('should do nothing when the sheet is closed', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { detents: [0.4, 1] });

      instance.setDetent(1);

      expect(instance.currentDetent).toBe(0.4);
    });

    test('should not fire detentchange when already at the detent', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      const changeSpy = jest.fn();
      sheet.addEventListener(EVENT.DETENT_CHANGE, changeSpy);

      instance.setDetent(0.4);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(changeSpy).not.toHaveBeenCalled();
    });

    test('should not fire detentchange when opening at the initial detent', async () => {
      const sheet = createSheet();
      setSheetHeight(sheet, SHEET_HEIGHT);

      const changeSpy = jest.fn();
      sheet.addEventListener(EVENT.DETENT_CHANGE, changeSpy);

      const instance = new BootstrapSheet(sheet, { detents: [0.4, 1] });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Dragging between detents', () => {
    test('should expand to the next detent when dragged up', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      const originY = startDrag(sheet, { startY: 300, direction: 'up' });

      simulatePointerEvent(document, 'pointermove', { clientY: originY - 150 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY - 150 });

      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(instance.currentDetent).toBe(1);
      expect(getTranslateY(sheet)).toBe(0);
    });

    test('should collapse to the smaller detent when dragged down', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1], initialDetent: 1 });

      const originY = startDrag(sheet);

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 150 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY + 150 });

      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(instance.currentDetent).toBe(0.4);
      expect(instance.isShown).toBe(true);
    });

    test('should dismiss when dragged below the smallest detent', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      const originY = startDrag(sheet, { startY: 300 });

      simulatePointerEvent(document, 'pointermove', { clientY: originY + 120 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY + 120 });

      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should fire detentchange after a drag settles on another detent', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      const changeSpy = jest.fn();
      sheet.addEventListener(EVENT.DETENT_CHANGE, changeSpy);

      const originY = startDrag(sheet, { startY: 300, direction: 'up' });

      simulatePointerEvent(document, 'pointermove', { clientY: originY - 150 });
      jest.advanceTimersByTime(16);
      simulatePointerEvent(document, 'pointerup', { clientY: originY - 150 });

      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(instance.currentDetent).toBe(1);
    });
  });

  describe('touch-action', () => {
    test('should reserve vertical panning below the largest detent', async () => {
      const { sheet } = await showSheet({ detents: [0.4, 1] });

      expect(sheet.style.touchAction).toBe('pan-x');
    });

    test('should release vertical panning at the largest detent', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(sheet.style.touchAction).toBe('');
    });

    test('should leave a single-detent sheet to the stylesheet', async () => {
      const { sheet } = await showSheet();

      expect(sheet.style.touchAction).toBe('');
    });

    test('should clear the inline value on hide', async () => {
      const { sheet, instance } = await showSheet({ detents: [0.4, 1] });

      instance.hide();
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(sheet.style.touchAction).toBe('');
    });
  });

  describe('undimmedDetent and modality', () => {
    const nonModal = { detents: [0.4, 1], undimmedDetent: 0.4 };

    test('should present non-modally at or below the undimmed detent', async () => {
      const { sheet } = await showSheet(nonModal);

      expect(sheet.getAttribute('aria-modal')).toBe('false');
    });

    test('should keep the backdrop transparent and click-through', async () => {
      const { sheet } = await showSheet(nonModal);
      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      expect(backdrop.style.opacity).toBe('0');
      expect(backdrop.style.pointerEvents).toBe('none');

      // Nothing outside the sheet is hidden from assistive technology
      expect(sheet.parentElement.querySelector('[inert]')).toBeNull();
    });

    test('should become modal above the undimmed detent', async () => {
      const { sheet, instance } = await showSheet(nonModal);

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      expect(sheet.getAttribute('aria-modal')).toBe('true');
      expect(backdrop.style.opacity).toBe('1');
      expect(backdrop.style.pointerEvents).toBe('');
    });

    test('should go back to non-modal when collapsing again', async () => {
      const { sheet, instance } = await showSheet(nonModal);

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      instance.setDetent(0.4);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(sheet.getAttribute('aria-modal')).toBe('false');
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`).style.pointerEvents).toBe('none');
    });

    test('should leave the page scrollable while non-modal', async () => {
      mockPageScrollbar();

      await showSheet(nonModal);

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    });

    test('should lock page scrolling once modal', async () => {
      mockPageScrollbar();

      const { instance } = await showSheet(nonModal);

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.paddingRight).toBe('15px');
    });

    test('should release page scrolling when collapsing back', async () => {
      mockPageScrollbar();

      const { instance } = await showSheet(nonModal);

      instance.setDetent(1);
      await advanceTimersAndFlush(SETTLE_WAIT);

      instance.setDetent(0.4);
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    });

    test('should still lock page scrolling for an ordinary sheet', async () => {
      mockPageScrollbar();

      await showSheet({ detents: [0.4, 1] });

      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should not trap focus while non-modal', async () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();

      const { sheet } = await showSheet(nonModal);

      // Focus is left where the user put it, and the sheet does not claim it
      expect(document.activeElement).toBe(outside);
      expect(sheet.contains(document.activeElement)).toBe(false);
    });

    test('should dim proportionally when no undimmed detent is set', async () => {
      await showSheet({ detents: [0.4, 1] });

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      // At 40 % open the backdrop is 40 % opaque
      expect(parseFloat(backdrop.style.opacity)).toBeCloseTo(0.4, 5);
    });
  });

  describe('Resize handling', () => {
    test('should re-place the sheet when its height changes', async () => {
      const { sheet } = await showSheet({ detents: [0.5, 1] });

      expect(getTranslateY(sheet)).toBeCloseTo(200, 5);

      setSheetHeight(sheet, 200);
      triggerResize();

      expect(getTranslateY(sheet)).toBeCloseTo(100, 5);
    });

    test('should ignore a resize while dragging', async () => {
      const { sheet } = await showSheet({ detents: [0.5, 1] });

      startDrag(sheet, { startY: 300 });

      setSheetHeight(sheet, 200);
      triggerResize();

      // The drag owns the transform; the observer must not fight it
      expect(getTranslateY(sheet)).toBeCloseTo(200, 5);
    });

    test('should stop observing once hidden', async () => {
      const { instance } = await showSheet({ detents: [0.5, 1] });

      expect(ResizeObserver.instances.length).toBe(1);

      instance.hide();
      await advanceTimersAndFlush(SETTLE_WAIT);

      expect(ResizeObserver.instances.length).toBe(0);
    });

    test('should stop observing on dispose', async () => {
      const { instance } = await showSheet({ detents: [0.5, 1] });

      instance.dispose();

      expect(ResizeObserver.instances.length).toBe(0);
    });
  });
});
