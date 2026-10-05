/**
 * Size budget of the built package, checked by `npm run size` after a build.
 *
 * Sizes are gzipped, as the README's bundle size badge reports them. The
 * budgets leave some room above the current sizes, 7.5 kB and 1.0 kB, for the
 * features still planned, while catching regressions such as compiling the
 * bundles down to ES5 again, which made the minified bundle nearly a third
 * larger.
 *
 * The ES module and CommonJS builds hold the same code as the UMD bundle,
 * unminified, and consumers' bundlers minify them, so the minified UMD bundle
 * stands for all of them.
 */
export default [
  {
    name: 'JavaScript (minified UMD bundle)',
    path: 'dist/js/bootstrap-sheet.min.js',
    gzip: true,
    limit: '8 kB',
  },
  {
    name: 'Stylesheet (minified)',
    path: 'dist/css/bootstrap-sheet.min.css',
    gzip: true,
    limit: '1.2 kB',
  },
];
