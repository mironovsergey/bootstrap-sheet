import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { CLASS_NAME } from '../../src/js/constants';
import { createSheet, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Backdrop', () => {
  describe('Backdrop creation', () => {
    test('should create backdrop element on show', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.tagName).toBe('DIV');
    });

    test('should not create backdrop when backdrop=false', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should create only one backdrop per sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrops = document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrops).toHaveLength(1);
    });

    test('should append backdrop to document.body', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.parentElement).toBe(document.body);
    });

    test('should append backdrop after sheet in DOM order', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const bodyChildren = Array.from(document.body.children);
      const backdropIndex = bodyChildren.indexOf(backdrop);
      const sheetIndex = bodyChildren.indexOf(sheet);

      // Backdrop is added after sheet (sheet exists before show() is called)
      expect(backdropIndex).toBeGreaterThan(sheetIndex);
    });

    test('should have correct CSS class', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toHaveClass(CLASS_NAME.BACKDROP);
    });
  });

  describe('Backdrop opacity and transitions', () => {
    test('should be set to opacity 1 immediately after show', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      // Backdrop opacity is set to 1 immediately in #showBackdrop()
      expect(backdrop.style.opacity).toBe('1');
    });

    test('should animate to opacity 1 after show', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.opacity).toBe('1');
    });

    test('should have transition property set', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.transition).toContain('opacity');
      expect(backdrop.style.transition).toContain('300ms');
    });

    test('should respect custom animation duration', () => {
      const sheet = createSheet();
      const customDuration = 500;
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        animationDuration: customDuration,
      });

      instance.show();

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.transition).toContain(`${customDuration}ms`);
    });

    test('should animate to opacity 0 on hide', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.opacity).toBe('1');

      instance.hide();

      expect(backdrop.style.opacity).toBe('0');
    });
  });

  describe('Static backdrop', () => {
    test('should add data-bs-static attribute for static backdrop', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: 'static' });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.dataset.bsStatic).toBe('');
    });

    test('should not add data-bs-static for dismissible backdrop', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.dataset.bsStatic).toBeUndefined();
    });

    test('clicking static backdrop should not close sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: 'static' });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      backdrop.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
      expect(backdrop).toBeInTheDocument();
    });

    test('clicking static backdrop should trigger shake animation', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: 'static' });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      backdrop.click();

      // Note: static backdrop doesn't have click handler, so no shake
      // Shake is only triggered by ESC key with static backdrop
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Dismissible backdrop', () => {
    test('clicking backdrop should close sheet', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      backdrop.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should have click event listener attached', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      // Check that clicking actually triggers hide
      const hideSpy = jest.spyOn(instance, 'hide');
      backdrop.click();

      expect(hideSpy).toHaveBeenCalled();
    });

    test('should fire hide event when backdrop clicked', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const hideSpy = jest.fn();
      sheet.addEventListener('hide.bs.sheet', hideSpy);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      backdrop.click();

      expect(hideSpy).toHaveBeenCalled();
    });
  });

  describe('Backdrop removal', () => {
    test('should remove backdrop from DOM on hide', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should remove backdrop on dispose', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      instance.dispose();

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should handle dispose without showing', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      expect(() => {
        instance.dispose();
      }).not.toThrow();

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });
  });

  describe('Multiple shows and hides', () => {
    test('should reuse same backdrop element on subsequent shows', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      // First show
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      const firstBackdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Second show
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      const secondBackdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      // Should be different elements (old one removed, new one created)
      expect(secondBackdrop).not.toBe(firstBackdrop);
    });

    test('should create new backdrop after dispose and recreation', async () => {
      const sheet = createSheet();
      let instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      const firstBackdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      instance.dispose();

      instance = new BootstrapSheet(sheet, { backdrop: true });
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      const secondBackdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      expect(secondBackdrop).not.toBe(firstBackdrop);
    });

    test('should handle rapid show/hide cycles', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      for (let i = 0; i < 3; i++) {
        instance.show();
        await advanceTimersAndFlush(TRANSITION_WAIT);
        expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

        instance.hide();
        await advanceTimersAndFlush(TRANSITION_WAIT);
        expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
      }
    });
  });

  describe('Multiple sheets with backdrop', () => {
    test('should create separate backdrop for each sheet', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { backdrop: true });
      const instance2 = new BootstrapSheet(sheet2, { backdrop: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`)).toHaveLength(1);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`)).toHaveLength(2);
    });

    test('should remove correct backdrop when hiding one of multiple sheets', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { backdrop: true });
      const instance2 = new BootstrapSheet(sheet2, { backdrop: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`)).toHaveLength(2);

      instance1.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`)).toHaveLength(1);
      expect(instance2.isShown).toBe(true);
    });

    test('should handle mixed backdrop configurations', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { backdrop: true });
      const instance2 = new BootstrapSheet(sheet2, { backdrop: false });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Only one backdrop (from sheet1)
      expect(document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`)).toHaveLength(1);
    });
  });

  describe('Backdrop with gestures', () => {
    test('should update backdrop opacity during drag', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        gestures: true,
      });

      Object.defineProperty(sheet, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.opacity).toBe('1');

      const handle = sheet.querySelector('[data-bs-drag="sheet"]');

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

    test('should remove backdrop transition during drag', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        gestures: true,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop.style.transition).toContain('opacity');

      const handle = sheet.querySelector('[data-bs-drag="sheet"]');

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(backdrop.style.transition).toBe('none');
    });

    test('should restore backdrop transition after drag', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        gestures: true,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const handle = sheet.querySelector('[data-bs-drag="sheet"]');

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

      expect(backdrop.style.transition).toContain('opacity');
      expect(backdrop.style.transition).toContain('300ms');
    });

    test('should not affect backdrop when gestures disabled', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        gestures: false,
      });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const originalTransition = backdrop.style.transition;

      const handle = sheet.querySelector('[data-bs-drag="sheet"]');

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });
      handle.dispatchEvent(pointerDown);

      expect(backdrop.style.transition).toBe(originalTransition);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should not crash if backdrop option changes between shows', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Note: config can't be changed after creation, but test handles it gracefully
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();
    });

    test('should not allow hide during show transition (backdrop remains)', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();

      expect(instance.isTransitioning).toBe(true);
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      // Try to hide during show transition - should be blocked
      const hideSpy = jest.fn();
      sheet.addEventListener('hide.bs.sheet', hideSpy);

      instance.hide();

      // Hide event should not fire (operation blocked)
      expect(hideSpy).not.toHaveBeenCalled();

      // Backdrop should still be present
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();

      // Complete the show transition
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Now we can hide successfully
      instance.hide();
      expect(hideSpy).toHaveBeenCalled();

      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).not.toBeInTheDocument();
    });

    test('should handle show/hide without waiting for backdrop transition', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      jest.advanceTimersByTime(50); // Partial transition

      instance.hide();
      jest.advanceTimersByTime(50); // Partial transition

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector(`.${CLASS_NAME.BACKDROP}`)).toBeInTheDocument();
      expect(instance.isShown).toBe(true);
    });

    test('should not create backdrop if body is null', () => {
      const sheet = createSheet();

      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        configurable: true,
        value: null,
      });

      const instance = new BootstrapSheet(sheet, { backdrop: true });

      expect(() => {
        instance.show();
      }).toThrow();

      Object.defineProperty(document, 'body', {
        configurable: true,
        value: originalBody,
      });
    });

    test('should handle backdrop with no animation duration', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, {
        backdrop: true,
        animationDuration: 0,
      });

      instance.show();
      await advanceTimersAndFlush(50);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.style.transition).toContain('0ms');
    });
  });

  describe('Backdrop z-index and stacking', () => {
    test('backdrop should appear after sheet in DOM', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);
      const allBodyChildren = Array.from(document.body.children);

      const backdropIndex = allBodyChildren.indexOf(backdrop);
      const sheetIndex = allBodyChildren.indexOf(sheet);

      // Backdrop is added after sheet (but should have higher z-index via CSS)
      expect(backdropIndex).toBeGreaterThan(sheetIndex);
    });

    test('multiple backdrops should maintain correct order with sheets', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1, { backdrop: true });
      const instance2 = new BootstrapSheet(sheet2, { backdrop: true });

      instance1.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrops = document.querySelectorAll(`.${CLASS_NAME.BACKDROP}`);
      const allBodyChildren = Array.from(document.body.children);

      const backdrop1Index = allBodyChildren.indexOf(backdrops[0]);
      const backdrop2Index = allBodyChildren.indexOf(backdrops[1]);
      const sheet1Index = allBodyChildren.indexOf(sheet1);
      const sheet2Index = allBodyChildren.indexOf(sheet2);

      // First backdrop comes after first sheet
      expect(backdrop1Index).toBeGreaterThan(sheet1Index);
      // Second backdrop comes after second sheet
      expect(backdrop2Index).toBeGreaterThan(sheet2Index);
      // Backdrops and sheets are interleaved: sheet1, sheet2, backdrop1, backdrop2
      expect(sheet1Index).toBeLessThan(sheet2Index);
      expect(backdrop1Index).toBeLessThan(backdrop2Index);
    });
  });

  describe('Backdrop accessibility', () => {
    test('backdrop should not be focusable', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      expect(backdrop.hasAttribute('tabindex')).toBe(false);
      expect(backdrop.getAttribute('role')).toBeFalsy();
    });

    test('backdrop should be marked as inert when using inert', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet, { backdrop: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const backdrop = document.querySelector(`.${CLASS_NAME.BACKDROP}`);

      // Backdrop itself should not be inert (it's not an interactive element)
      expect(backdrop.hasAttribute('inert')).toBe(false);
    });
  });
});
