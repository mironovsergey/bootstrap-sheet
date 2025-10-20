export default {
  // Use jsdom environment for DOM testing
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Coverage configuration
  collectCoverageFrom: ['src/js/**/*.js', '!src/js/**/*.test.js', '!**/node_modules/**'],

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
    '^.+\\.js$': 'babel-jest',
  },

  // Test match patterns
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
