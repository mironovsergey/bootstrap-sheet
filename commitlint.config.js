export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Test changes
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Maintenance
        'revert', // Revert previous commit
      ],
    ],
  },
};
