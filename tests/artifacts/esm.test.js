import { execFileSync } from 'child_process';
import { assertBuilt, createConsumer } from './consumer';

/**
 * Run ES module code in a separate Node process from a directory
 * @param {string} cwd - Directory to run in
 * @param {string} source - Module code that prints one JSON value
 * @returns {unknown} The printed value
 */
const runModule = (cwd, source) =>
  JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', source], {
      cwd,
      encoding: 'utf8',
    }),
  );

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
    const resolved = runModule(
      consumer.dir,
      "console.log(JSON.stringify(import.meta.resolve('bootstrap-sheet')));",
    );

    expect(resolved).toMatch(/\/dist\/js\/bootstrap-sheet\.esm\.js$/);
  });

  // Server-side renderers import the package in Node, where there is no DOM
  test('should import by package name where there is no DOM', () => {
    const result = runModule(
      consumer.dir,
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
});
