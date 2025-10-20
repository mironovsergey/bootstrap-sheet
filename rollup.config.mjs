import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

const banner = `/*!
 * Bootstrap Sheet v${pkg.version} (${pkg.homepage})
 * Copyright 2025 ${pkg.author}
 * Licensed under ${pkg.license}
 */`;

export default [
  // UMD build
  {
    input: 'src/js/bootstrap-sheet.js',
    output: {
      file: 'dist/js/bootstrap-sheet.js',
      format: 'umd',
      name: 'BootstrapSheet',
      banner,
      globals: {
        bootstrap: 'bootstrap',
      },
    },
    external: ['bootstrap'],
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
    ],
  },
  // UMD minified
  {
    input: 'src/js/bootstrap-sheet.js',
    output: {
      file: 'dist/js/bootstrap-sheet.min.js',
      format: 'umd',
      name: 'BootstrapSheet',
      banner,
      globals: {
        bootstrap: 'bootstrap',
      },
    },
    external: ['bootstrap'],
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
      terser(),
    ],
  },
  // ESM build
  {
    input: 'src/js/bootstrap-sheet.js',
    output: {
      file: 'dist/js/bootstrap-sheet.esm.js',
      format: 'es',
      banner,
    },
    external: ['bootstrap'],
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
    ],
  },
];
