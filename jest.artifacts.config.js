/**
 * Smoke tests of the built package in dist/.
 *
 * Kept apart from jest.config.js: these tests need `npm run build` first, so
 * they are neither part of `npm test` nor of the pre-commit hook. They check
 * the files as shipped, through real Node processes, a real Rollup build and
 * a script tag in jsdom, rather than through Jest's module emulation.
 */
export default {
  displayName: 'artifacts',

  // Node by default; jsdom is created explicitly where a page is needed
  testEnvironment: 'node',

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Test match patterns
  testMatch: ['<rootDir>/tests/artifacts/**/*.test.js'],

  // Verbose output
  verbose: true,
};
