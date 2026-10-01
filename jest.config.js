/**
 * Settings shared by every test project
 */
const sharedProjectConfig = {
  // Transform configuration
  transform: {
    '^.+\\.[jt]s$': 'babel-jest',
  },

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default {
  projects: [
    {
      ...sharedProjectConfig,
      displayName: 'dom',

      // Use jsdom environment for DOM testing
      testEnvironment: 'jsdom',

      // Setup files
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

      // Test match patterns
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,ts}'],
    },
    {
      ...sharedProjectConfig,
      displayName: 'ssr',

      // No DOM at all, as when a server-side renderer imports the module
      testEnvironment: 'node',

      // Test match patterns
      testMatch: ['<rootDir>/tests/ssr/**/*.test.{js,ts}'],
    },
  ],

  // Coverage configuration
  collectCoverageFrom: ['src/js/**/*.{js,ts}', '!src/js/**/*.test.{js,ts}', '!**/node_modules/**'],

  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,
};
