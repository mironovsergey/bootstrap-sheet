# Contributing to Bootstrap Sheet

First off, thank you for considering contributing to Bootstrap Sheet! It's people like you that make Bootstrap Sheet such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [sergeymironov@protonmail.com](mailto:sergeymironov@protonmail.com).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what behavior you expected to see
- **Include screenshots** if possible
- **Include your environment details** (browser, OS, Bootstrap version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Provide specific examples** to demonstrate the enhancement
- **Describe the current behavior** and explain what behavior you would like to see instead
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing code style
6. Issue your pull request!

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/bootstrap-sheet.git
cd bootstrap-sheet

# Add upstream remote
git remote add upstream https://github.com/mironovsergey/bootstrap-sheet.git

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Project Structure

```
bootstrap-sheet/
├── src/
│   ├── js/             # TypeScript source files
│   └── scss/           # Sass source files
├── dist/               # Built files (generated): JS bundles, CSS, type declarations
├── tests/              # Test files (plain JavaScript, run against the public API)
└── docs/               # Documentation
```

### Available Scripts

- `npm run dev` - Start development mode with file watching
- `npm run build` - Build production files (JS bundles, CSS, type declarations)
- `npm test` - Run test suite
- `npm run check:types` - Type-check the sources with the TypeScript compiler
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Coding Standards

#### TypeScript

The source code is TypeScript with `strict` mode enabled. Compilation to
JavaScript is handled by Babel; `npm run check:types` runs the TypeScript
compiler as a separate check (also enforced in CI and the pre-commit hook).

- Do not use `any`, type assertions (`as`), `@ts-ignore` / `@ts-expect-error`,
  or non-null assertions (`!`) - fix the underlying types instead (enforced by
  ESLint)
- Add JSDoc comments for all public methods; put types in signatures, not in
  JSDoc annotations
- Use `import type` / `export type` for type-only imports and re-exports;
  Babel strips types file-by-file, so `const enum` across files and
  `namespace` are not available
- Public API types are generated from the source (`npm run build:types`) -
  there is no hand-written declaration file to update
- Use meaningful variable and function names; keep functions small and focused

```typescript
/**
 * Shows the sheet with animation
 * @fires show.bs.sheet
 */
show(): void {
  // Implementation
}
```

#### Sass/CSS

- Follow the Bootstrap component naming convention: a flat block class with
  dash-separated element classes, matching Bootstrap's own components
  (`.modal`, `.modal-header`)
- Use Sass variables for customizable values
- Keep specificity low
- Mobile-first approach

```scss
.sheet {
  // Block styles
}

.sheet-header {
  // Element styles
}
```

#### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test changes
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks
- `revert:` - Revert previous commit

Examples:

```bash
git commit -m "feat: add RTL support"
git commit -m "fix: resolve memory leak in focus trap"
git commit -m "docs: update installation instructions"
```

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:unit:coverage
```

#### Writing Tests

- Write tests for all new features
- Tests are plain JavaScript and exercise the component through its public
  API - internal refactoring must not require rewriting them
- Maintain test coverage above 90%
- Test edge cases and error conditions
- Use descriptive test names

```javascript
describe('BootstrapSheet', () => {
  describe('show()', () => {
    it('should add "show" class to element', () => {
      // Test implementation
    });

    it('should trigger "show.bs.sheet" event', () => {
      // Test implementation
    });
  });
});
```

### Documentation

- Update README.md for user-facing changes
- Update JSDoc comments for API changes
- Add examples for new features
- Keep documentation clear and concise

### Submitting Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write/update tests
   - Update documentation
   - Follow coding standards

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository
   - Click "New pull request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit!

### Pull Request Guidelines

- **PR Title** should follow conventional commits format
- **Description** should clearly describe what and why
- **Link any related issues**
- **Include screenshots** for UI changes
- **Ensure all tests pass**
- **Keep PRs focused** - one feature/fix per PR

## Release Process

Releases are managed by maintainers:

1. Update CHANGELOG.md with the new version section
2. Bump the version on `main`: `npm version [patch|minor|major]` - this also
   syncs the version across README, sources, and docs
3. Push with the tag: `git push origin main --follow-tags`
4. The tag push triggers the release workflow: tests, a GitHub Release with
   changelog notes and build artifacts, and npm publishing

## Getting Help

- **Email**: [sergeymironov@protonmail.com](mailto:sergeymironov@protonmail.com)

## Recognition

Contributors will be recognized in:

- The README.md contributors section
- GitHub contributors page
- Release notes

## License

All contributions are subject to the terms of the [MIT License](LICENSE).

Thank you for contributing to Bootstrap Sheet! 🎉
