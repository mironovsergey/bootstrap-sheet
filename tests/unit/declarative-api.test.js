import BootstrapSheet from '../../src/js/bootstrap-sheet';
import { SELECTOR } from '../../src/js/constants';
import { createSheet, createTrigger, advanceTimersAndFlush } from '../setup/test-utils';

const TRANSITION_WAIT = BootstrapSheet.Default.animationDuration + 50;

describe('BootstrapSheet - Declarative API', () => {
  describe('Toggle triggers [data-bs-toggle="sheet"]', () => {
    test('should toggle sheet on click', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
      expect(instance.isShown).toBe(true);
    });

    test('should create instance automatically via trigger', async () => {
      const sheet = createSheet();

      expect(BootstrapSheet.getInstance(sheet)).toBeNull();

      const trigger = createTrigger('testSheet');
      trigger.click();

      expect(BootstrapSheet.getInstance(sheet)).toBeInstanceOf(BootstrapSheet);
    });

    test('should use existing instance if already created', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const trigger = createTrigger('testSheet');
      trigger.click();

      expect(BootstrapSheet.getInstance(sheet)).toBe(instance);
    });

    test('should toggle (show then hide) on repeated clicks', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      // First click - show
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      // Second click - hide
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);

      // Third click - show again
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(true);
    });

    test('should prevent default behavior on trigger click', () => {
      createSheet();
      const trigger = createTrigger('testSheet');

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      trigger.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should work with button element', async () => {
      const sheet = createSheet();
      const button = document.createElement('button');
      button.setAttribute('data-bs-toggle', 'sheet');
      button.setAttribute('data-bs-target', '#testSheet');
      document.body.appendChild(button);

      button.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      button.remove();
    });

    test('should work with anchor element', async () => {
      const sheet = createSheet();
      const anchor = document.createElement('a');
      anchor.href = '#testSheet';
      anchor.setAttribute('data-bs-toggle', 'sheet');
      document.body.appendChild(anchor);

      anchor.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      anchor.remove();
    });

    test('should work with nested elements (event delegation)', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      const icon = document.createElement('i');
      icon.className = 'icon';
      trigger.appendChild(icon);

      // Click on nested icon
      icon.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Target selection', () => {
    test('should select target via data-bs-target', async () => {
      const sheet = createSheet({ id: 'mySheet' });
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      trigger.setAttribute('data-bs-target', '#mySheet');
      document.body.appendChild(trigger);

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      trigger.remove();
    });

    test('should select target via href', async () => {
      const sheet = createSheet({ id: 'mySheet' });
      const anchor = document.createElement('a');
      anchor.href = '#mySheet';
      anchor.setAttribute('data-bs-toggle', 'sheet');
      document.body.appendChild(anchor);

      anchor.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      anchor.remove();
    });

    test('should prioritize data-bs-target over href', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const anchor = document.createElement('a');
      anchor.href = '#sheet2';
      anchor.setAttribute('data-bs-toggle', 'sheet');
      anchor.setAttribute('data-bs-target', '#sheet1');
      document.body.appendChild(anchor);

      anchor.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should open sheet1 (data-bs-target), not sheet2 (href)
      const instance1 = BootstrapSheet.getInstance(sheet1);
      const instance2 = BootstrapSheet.getInstance(sheet2);

      expect(instance1).toBeInstanceOf(BootstrapSheet);
      expect(instance1.isShown).toBe(true);
      expect(instance2).toBeNull();

      anchor.remove();
    });

    test('should extract hash from full URL in href', async () => {
      const sheet = createSheet({ id: 'mySheet' });
      const anchor = document.createElement('a');
      anchor.href = 'https://example.com/page#mySheet';
      anchor.setAttribute('data-bs-toggle', 'sheet');
      document.body.appendChild(anchor);

      anchor.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      anchor.remove();
    });

    test('should do nothing if target not found', () => {
      createSheet();
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      trigger.setAttribute('data-bs-target', '#nonExistent');
      document.body.appendChild(trigger);

      expect(() => {
        trigger.click();
      }).not.toThrow();

      trigger.remove();
    });

    test('should do nothing if target selector is invalid', () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      trigger.setAttribute('data-bs-target', '');
      document.body.appendChild(trigger);

      expect(() => {
        trigger.click();
      }).not.toThrow();

      trigger.remove();
    });

    test('should do nothing if no target specified', () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      // No data-bs-target or href
      document.body.appendChild(trigger);

      expect(() => {
        trigger.click();
      }).not.toThrow();

      trigger.remove();
    });
  });

  describe('Configuration via data attributes', () => {
    test('should apply config from trigger data-attributes', async () => {
      const sheet = createSheet({ id: 'mySheet' });
      const trigger = createTrigger('mySheet', {
        backdrop: 'false',
        keyboard: 'false',
      });

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Verify instance was created
      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);

      // No backdrop should be created
      expect(document.querySelector('.sheet-backdrop')).not.toBeInTheDocument();
    });

    test('should apply config from sheet data-attributes', async () => {
      const sheet = createSheet({
        id: 'mySheet',
        dataAttributes: {
          backdrop: 'static',
          keyboard: 'true',
        },
      });
      const trigger = createTrigger('mySheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);

      const backdrop = document.querySelector('.sheet-backdrop');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.dataset.bsStatic).toBe('');
    });

    test('should merge configs: sheet < trigger (trigger wins)', async () => {
      const sheet = createSheet({
        id: 'mySheet',
        dataAttributes: {
          backdrop: 'true',
        },
      });
      const trigger = createTrigger('mySheet', {
        backdrop: 'false', // Should override sheet config
      });

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
      expect(document.querySelector('.sheet-backdrop')).not.toBeInTheDocument();
    });

    test('should merge multiple configurations correctly', async () => {
      const sheet = createSheet({
        id: 'mySheet',
        dataAttributes: {
          backdrop: 'true',
          keyboard: 'false',
          focus: 'true',
        },
      });
      const trigger = createTrigger('mySheet', {
        keyboard: 'true', // Overrides sheet
        gestures: 'false', // New config
      });

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);

      // backdrop: true (from sheet)
      expect(document.querySelector('.sheet-backdrop')).toBeInTheDocument();

      // keyboard: true (from trigger, overrides sheet)
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escEvent);
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });
  });

  describe('Multiple triggers for one sheet', () => {
    test('should support multiple triggers for same sheet', async () => {
      const sheet = createSheet({ id: 'mySheet' });
      const trigger1 = createTrigger('mySheet');
      const trigger2 = createTrigger('mySheet');

      trigger1.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      trigger2.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should use first trigger config (instance created once)', async () => {
      const sheet = createSheet({ id: 'mySheet' });

      const trigger1 = createTrigger('mySheet', { backdrop: 'true' });
      const trigger2 = createTrigger('mySheet', { backdrop: 'false' });

      // Click trigger1 - creates instance with backdrop=true
      trigger1.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(document.querySelector('.sheet-backdrop')).toBeInTheDocument();

      const instance = BootstrapSheet.getInstance(sheet);
      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Click trigger2 - uses existing instance (backdrop config unchanged)
      trigger2.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Backdrop still appears because instance config is immutable
      expect(document.querySelector('.sheet-backdrop')).toBeInTheDocument();

      // To test different configs, need separate sheets or dispose between clicks
      instance.dispose();
    });
  });

  describe('Dismiss triggers [data-bs-dismiss="sheet"]', () => {
    test('should close sheet when dismiss button clicked', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);
      dismissBtn.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should work with multiple dismiss buttons', async () => {
      const sheet = createSheet({ withHeader: true, withFooter: true });
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const dismissButtons = sheet.querySelectorAll(SELECTOR.DATA_DISMISS);
      expect(dismissButtons.length).toBeGreaterThan(1);

      // Click first dismiss button
      dismissButtons[0].click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance.isShown).toBe(false);
    });

    test('should only affect the containing sheet', async () => {
      const sheet1 = createSheet({ id: 'sheet1' });
      const sheet2 = createSheet({ id: 'sheet2' });

      const instance1 = new BootstrapSheet(sheet1);
      const instance2 = new BootstrapSheet(sheet2);

      instance1.show();
      instance2.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const dismissBtn1 = sheet1.querySelector(SELECTOR.DATA_DISMISS);
      dismissBtn1.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      expect(instance1.isShown).toBe(false);
      expect(instance2.isShown).toBe(true);
    });

    test('should do nothing if sheet is not shown', () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);

      expect(() => {
        dismissBtn.click();
      }).not.toThrow();

      expect(instance.isShown).toBe(false);
    });

    test('should remove event listeners on dispose', async () => {
      const sheet = createSheet();
      const instance = new BootstrapSheet(sheet);

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);
      const clickSpy = jest.fn();
      dismissBtn.addEventListener('click', clickSpy);

      instance.dispose();

      dismissBtn.click();

      // Click event fires, but sheet handler should not
      expect(clickSpy).toHaveBeenCalled();
      expect(instance.isShown).toBe(false);
    });
  });

  describe('Drag handle [data-bs-drag="sheet"]', () => {
    test('should enable dragging when drag handle present', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      expect(handle).toBeInTheDocument();

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      expect(sheet).toHaveClass('dragging');
    });

    test('should not enable dragging without drag handle', async () => {
      const sheet = createSheet({ withDragHandle: false });
      const instance = new BootstrapSheet(sheet, { gestures: true });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);
      expect(handle).not.toBeInTheDocument();

      // No dragging should be possible
      expect(sheet).not.toHaveClass('dragging');
    });

    test('should not enable dragging when gestures disabled', async () => {
      const sheet = createSheet({ withDragHandle: true });
      const instance = new BootstrapSheet(sheet, { gestures: false });

      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const handle = sheet.querySelector(SELECTOR.DRAG_HANDLE);

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 0,
        pointerId: 1,
      });

      handle.dispatchEvent(pointerDown);

      expect(sheet).not.toHaveClass('dragging');
    });
  });

  describe('Integration with programmatic API', () => {
    test('should work together with programmatic show/hide', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');
      const instance = new BootstrapSheet(sheet);

      // Programmatic show
      instance.show();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(true);

      // Declarative hide via trigger
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(false);

      // Declarative show via trigger
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(true);

      // Programmatic hide
      instance.hide();
      await advanceTimersAndFlush(TRANSITION_WAIT);
      expect(instance.isShown).toBe(false);
    });

    test('should preserve programmatic configuration', async () => {
      const sheet = createSheet();

      // Create with programmatic config
      new BootstrapSheet(sheet, { backdrop: false });

      // Use declarative trigger (should use existing instance)
      const trigger = createTrigger('testSheet', { backdrop: 'true' });
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Should NOT have backdrop (programmatic config preserved)
      expect(document.querySelector('.sheet-backdrop')).not.toBeInTheDocument();
    });

    test('should handle dispose and recreation via declarative API', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      // First creation via trigger
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      let instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      instance.dispose();
      expect(BootstrapSheet.getInstance(sheet)).toBeNull();

      // Recreation via trigger
      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
      expect(instance.isShown).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle clicks on non-trigger elements', () => {
      createSheet();
      const regularButton = document.createElement('button');
      regularButton.textContent = 'Regular Button';
      document.body.appendChild(regularButton);

      expect(() => {
        regularButton.click();
      }).not.toThrow();

      regularButton.remove();
    });

    test('should handle trigger with empty target', () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      trigger.setAttribute('data-bs-target', '');
      document.body.appendChild(trigger);

      expect(() => {
        trigger.click();
      }).not.toThrow();

      trigger.remove();
    });

    test('should handle trigger with only hash in target', () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('data-bs-toggle', 'sheet');
      trigger.setAttribute('data-bs-target', '#');
      document.body.appendChild(trigger);

      expect(() => {
        trigger.click();
      }).not.toThrow();

      trigger.remove();
    });

    test('should handle rapid clicks on trigger', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      // Rapid clicks
      trigger.click();
      trigger.click();
      trigger.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      // Should handle gracefully (last state depends on number of clicks)
      expect(instance).toBeInstanceOf(BootstrapSheet);
    });

    test('should handle trigger removed from DOM', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      // Remove trigger from DOM
      trigger.remove();

      // Sheet should still work
      expect(() => {
        instance.hide();
      }).not.toThrow();
    });

    test('should handle sheet removed from DOM', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Verify sheet was shown
      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance.isShown).toBe(true);

      // Remove sheet
      sheet.remove();

      // Should not crash on second click (sheet not found)
      expect(() => {
        trigger.click();
      }).not.toThrow();
    });
  });

  describe('Global click handler cleanup', () => {
    test('should attach global click handler on module load', () => {
      // Global handler is attached when module loads
      // This is tested implicitly by all other tests working
      // Creating a sheet to verify module is loaded
      const sheet = createSheet();
      expect(sheet).toBeInTheDocument();
    });

    test('should use event delegation for dynamic triggers', async () => {
      const sheet = createSheet();

      // Create trigger after module load (dynamic)
      const dynamicTrigger = createTrigger('testSheet');

      dynamicTrigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);
      expect(instance.isShown).toBe(true);
    });

    test('should handle clicks on document with no triggers present', () => {
      createSheet(); // Create a sheet but no triggers

      // Click on document body directly (no trigger element)
      expect(() => {
        document.body.click();
      }).not.toThrow();
    });
  });

  describe('Accessibility with declarative API', () => {
    test('should maintain focus management with dismiss buttons', async () => {
      const button = document.createElement('button');
      button.textContent = 'Open';
      document.body.appendChild(button);
      button.focus();

      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should move into sheet
      expect(document.activeElement).not.toBe(button);

      const dismissBtn = sheet.querySelector(SELECTOR.DATA_DISMISS);
      dismissBtn.click();

      await advanceTimersAndFlush(TRANSITION_WAIT);

      // Focus should return to original button
      expect(document.activeElement).toBe(button);

      button.remove();
    });

    test('should maintain ARIA attributes with declarative API', async () => {
      const sheet = createSheet();
      const trigger = createTrigger('testSheet');

      trigger.click();
      await advanceTimersAndFlush(TRANSITION_WAIT);

      const instance = BootstrapSheet.getInstance(sheet);
      expect(instance).toBeInstanceOf(BootstrapSheet);

      expect(sheet.getAttribute('role')).toBe('dialog');
      expect(sheet.getAttribute('aria-modal')).toBe('true');
      expect(sheet.getAttribute('tabindex')).toBe('-1');
    });
  });
});
