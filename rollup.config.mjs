import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

const banner = `/*!
 * Bootstrap Sheet v${pkg.version} (${pkg.homepage})
 * Copyright 2025-${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license}
 */`;

/**
 * Source map settings shared by every output. The maps point at the
 * TypeScript sources the package ships under src/, so the sources are not
 * embedded a second time.
 */
const sourcemapOutput = {
  sourcemap: true,
  sourcemapExcludeSources: true,
};

/**
 * Output settings shared by the UMD bundles, which serve script tags and
 * CommonJS consumers
 */
const umdOutput = {
  ...sourcemapOutput,
  format: 'umd',
  name: 'BootstrapSheet',
  banner,
};

// One build, four outputs: the sources are resolved and transpiled once, and
// only the minified bundle runs through terser
export default {
  input: 'src/js/bootstrap-sheet.ts',
  plugins: [
    nodeResolve({ extensions: ['.js', '.ts'] }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env', '@babel/preset-typescript'],
      extensions: ['.js', '.ts'],
    }),
  ],
  output: [
    {
      ...umdOutput,
      file: 'dist/js/bootstrap-sheet.js',
    },
    {
      ...umdOutput,
      file: 'dist/js/bootstrap-sheet.min.js',
      plugins: [terser()],
    },
    {
      ...sourcemapOutput,
      file: 'dist/js/bootstrap-sheet.esm.js',
      format: 'es',
      banner,
    },
    // CommonJS for require(). The class is exported as `default`, the same
    // shape the ES module has, so one declaration file can describe both
    {
      ...sourcemapOutput,
      file: 'dist/js/bootstrap-sheet.cjs',
      format: 'cjs',
      exports: 'named',
      banner,
    },
  ],
};
