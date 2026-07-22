export default {
  // Use jsdom environment for DOM testing
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

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

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/js/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.[jt]s$': 'babel-jest',
  },

  // Test match patterns
  testMatch: ['<rootDir>/tests/**/*.test.{js,ts}'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
