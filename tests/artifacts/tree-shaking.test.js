import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { assertBuilt, createConsumer } from './consumer';

describe('Package - tree-shaking', () => {
  let consumer;

  beforeAll(() => {
    assertBuilt();
    consumer = createConsumer();
  });

  afterAll(() => {
    consumer.cleanup();
  });

  // `import 'bootstrap-sheet'` is how a page enables data-bs-toggle without
  // touching the class; it relies on the package declaring its side effects
  test('should keep the data API of a bare import', async () => {
    const entry = path.join(consumer.dir, 'entry.js');
    const warnings = [];

    fs.writeFileSync(entry, "import 'bootstrap-sheet';\n");

    const bundle = await rollup({
      input: entry,
      plugins: [nodeResolve()],
      onwarn: (warning) => warnings.push(warning.code),
    });
    const { output } = await bundle.generate({ format: 'es' });

    await bundle.close();

    expect(warnings).not.toContain('EMPTY_BUNDLE');
    expect(output[0].code).toContain('[data-bs-toggle="sheet"]');
  });
});
