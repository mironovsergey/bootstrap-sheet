import { dts } from 'rollup-plugin-dts';

/**
 * Public type declarations, generated from the TypeScript sources and bundled
 * into one file: only what the package entry exports reaches consumers, and
 * the file has no relative imports for module resolution to trip over.
 *
 * The CommonJS build exports the class as `default`, as the ES module does,
 * so the declarations served to require() (.d.cts) are the same as those
 * served to import (.d.ts). No declaration maps are emitted: the bundled ones
 * would point at the wrong lines of the sources.
 */
export default {
  input: 'src/js/bootstrap-sheet.ts',
  output: [
    {
      file: 'dist/types/bootstrap-sheet.d.ts',
      format: 'es',
    },
    {
      file: 'dist/types/bootstrap-sheet.d.cts',
      format: 'es',
    },
  ],
  plugins: [dts({ tsconfig: 'tsconfig.json' })],
};
