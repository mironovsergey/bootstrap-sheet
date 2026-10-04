import { assertBuilt, createConsumer, runNode } from './consumer';

describe('Package - CommonJS', () => {
  let consumer;

  beforeAll(() => {
    assertBuilt();
    consumer = createConsumer();
  });

  afterAll(() => {
    consumer.cleanup();
  });

  test('should resolve to the CommonJS build', () => {
    const resolved = runNode(
      consumer.dir,
      'commonjs',
      "console.log(JSON.stringify(require.resolve('bootstrap-sheet')));",
    );

    expect(resolved).toMatch(/[\\/]dist[\\/]js[\\/]bootstrap-sheet\.cjs$/);
  });

  // The class is the `default` export, as in the ES module
  test('should require by package name where there is no DOM', () => {
    const result = runNode(
      consumer.dir,
      'commonjs',
      `
      const { default: BootstrapSheet } = require('bootstrap-sheet');

      console.log(JSON.stringify({
        hasDocument: typeof document !== 'undefined',
        type: typeof BootstrapSheet,
        name: BootstrapSheet.NAME,
      }));
      `,
    );

    expect(result).toEqual({ hasDocument: false, type: 'function', name: 'sheet' });
  });
});
