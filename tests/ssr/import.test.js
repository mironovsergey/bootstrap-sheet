import BootstrapSheet from '../../src/js/bootstrap-sheet';

/**
 * Server-side rendering frameworks evaluate modules in Node, where there is no
 * DOM. Importing the component there must succeed; it is only used once the
 * code runs in a browser.
 */
describe('BootstrapSheet - Server-side import', () => {
  test('should run without a DOM', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof HTMLElement).toBe('undefined');
  });

  test('should import the component', () => {
    expect(typeof BootstrapSheet).toBe('function');
    expect(BootstrapSheet.NAME).toBe('sheet');
  });
});
