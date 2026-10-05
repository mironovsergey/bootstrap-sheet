import { assertBuilt, createConsumer, JSDOM_ENTRY, runNode } from './consumer';

describe('Package - ES module', () => {
  let consumer;

  beforeAll(() => {
    assertBuilt();
    consumer = createConsumer();
  });

  afterAll(() => {
    consumer.cleanup();
  });

  test('should resolve to the ES module build', () => {
    const resolved = runNode(
      consumer.dir,
      'module',
      "console.log(JSON.stringify(import.meta.resolve('bootstrap-sheet')));",
    );

    expect(resolved).toMatch(/\/dist\/js\/bootstrap-sheet\.esm\.js$/);
  });

  // Server-side renderers import the package in Node, where there is no DOM
  test('should import by package name where there is no DOM', () => {
    const result = runNode(
      consumer.dir,
      'module',
      `
      const { default: BootstrapSheet } = await import('bootstrap-sheet');

      console.log(JSON.stringify({
        hasDocument: typeof document !== 'undefined',
        type: typeof BootstrapSheet,
        name: BootstrapSheet.NAME,
      }));
      `,
    );

    expect(result).toEqual({ hasDocument: false, type: 'function', name: 'sheet' });
  });

  // In a browser the module is evaluated with a DOM in place, and it also
  // exposes the class as a global, as the UMD bundle does
  test('should assign window.BootstrapSheet where there is a DOM', () => {
    const result = runNode(
      consumer.dir,
      'module',
      `
      import { createRequire } from 'node:module';

      const { JSDOM } = createRequire(import.meta.url)(${JSON.stringify(JSDOM_ENTRY)});
      const { window } = new JSDOM();

      globalThis.window = window;
      globalThis.document = window.document;

      // A static import would be evaluated before the globals are set
      const { default: BootstrapSheet } = await import('bootstrap-sheet');

      console.log(JSON.stringify({
        hasDocument: typeof document !== 'undefined',
        globalIsDefaultExport: window.BootstrapSheet === BootstrapSheet,
      }));

      window.close();
      `,
    );

    expect(result).toEqual({ hasDocument: true, globalIsDefaultExport: true });
  });
});
