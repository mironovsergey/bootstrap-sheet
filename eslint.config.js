import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  // Scoped to .ts so the shared TS configs never affect .js files
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/js/**/*.ts', 'tests/e2e/**/*.ts'],
  })),
  {
    files: ['src/js/**/*.ts', 'tests/e2e/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      // Type-aware rules read types through the TypeScript project service,
      // which picks up tsconfig.json for every source file
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-unused-expressions': 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['tests/setup/**/*.js', 'jest.*.js', 'babel.*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    // Tooling that runs in Node: configs and release scripts
    files: ['*.config.js', '*.config.mjs', 'scripts/**/*.js'],
    languageOptions: {
      // rollup.config.mjs imports package.json with an import attribute
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Prettier owns formatting: turn off every rule that could conflict with it.
  // Kept after all rule blocks so that none of them can re-enable one.
  eslintConfigPrettier,
  {
    // Braces around every control statement body. eslint-config-prettier
    // turns curly off, but its "all" option is compatible with Prettier, so it
    // is enabled again here, after that config.
    rules: {
      curly: ['error', 'all'],
    },
  },
  {
    // Playwright writes its reports and test output under tests/e2e; an HTML
    // report with traces holds the minified trace viewer
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '*.min.js',
      'docs/**',
      'tests/e2e/playwright-report/**',
      'tests/e2e/test-results/**',
    ],
  },
];
