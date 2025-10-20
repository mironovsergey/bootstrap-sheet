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
│   ├── js/             # JavaScript source files
│   ├── scss/           # Sass source files
│   └── types/          # TypeScript definitions
├── dist/               # Built files (generated)
├── tests/              # Test files
└── docs/               # Documentation
```

### Available Scripts

- `npm run dev` - Start development mode with file watching
- `npm run build` - Build production files
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Coding Standards

#### JavaScript

- Use ES6+ features
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for all public methods
- Keep functions small and focused

```javascript
/**
 * Shows the sheet with animation
 * @fires show.bs.sheet
 * @returns {void}
 */
show() {
  // Implementation
}
```

#### Sass/CSS

- Follow BEM naming convention for new classes
- Use Sass variables for customizable values
- Keep specificity low
- Mobile-first approach

```scss
.sheet {
  &__header {
    // Header styles
  }

  &--large {
    // Modifier styles
  }
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
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Writing Tests

- Write tests for all new features
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

1. Update version: `npm version [patch|minor|major]`
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish to npm: `npm publish`

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
