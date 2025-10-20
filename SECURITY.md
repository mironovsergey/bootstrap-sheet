# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the **CVSS v3.1 Rating**:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The Bootstrap Sheet team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [sergeymironov@protonmail.com](mailto:sergeymironov@protonmail.com).

Please include the following information in your report:

- **Type of issue** (e.g., XSS, CSRF, code injection, privilege escalation, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it
- **Any special configuration** required to reproduce the issue

### What to Expect

You can expect the following:

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.

2. **Communication**: We will keep you informed about the progress of fixing the vulnerability.

3. **Credit**: We will give you credit for the discovery in the security advisory (unless you prefer to remain anonymous).

4. **Timeline**: We aim to:
   - Confirm the problem and determine affected versions within 7 days
   - Release a fix as soon as possible, depending on complexity
   - Coordinate public disclosure after the fix is released

## Security Update Policy

Security updates will be released as patch versions (e.g., 0.1.1) and will be clearly marked in the [CHANGELOG.md](CHANGELOG.md).

### What Qualifies as a Security Vulnerability?

We consider the following as security vulnerabilities:

- **Cross-Site Scripting (XSS)** vulnerabilities
- **Code Injection** vulnerabilities
- **Authentication/Authorization** bypass
- **Denial of Service (DoS)** vulnerabilities that can be triggered remotely
- **Information Disclosure** that exposes sensitive data
- **Security misconfigurations** in default settings
- Issues that allow **arbitrary code execution**

### What We Don't Consider Security Vulnerabilities

- Reports from automated tools without proof of exploitability
- Issues requiring physical access to a user's device
- Social engineering attacks
- Issues in dependencies (please report these to the respective project)
- Theoretical attacks without practical exploitability
- Bugs that don't have security implications

## Best Practices for Users

To ensure maximum security when using Bootstrap Sheet:

1. **Always use the latest version** - Security patches are only applied to the latest release
2. **Sanitize user input** - Always escape and validate user-provided content before displaying
3. **Content Security Policy** - Implement a strict CSP to prevent XSS attacks
4. **HTTPS only** - Always serve your application over HTTPS
5. **Keep dependencies updated** - Regularly update Bootstrap and other dependencies

## Known Security Considerations

### DOM Manipulation

Bootstrap Sheet manipulates the DOM and should only be used with trusted content. When using dynamic content:

```javascript
// ❌ DON'T: Insert untrusted HTML directly
sheetBody.innerHTML = userProvidedContent;

// ✅ DO: Sanitize or use textContent
sheetBody.textContent = userProvidedContent;
// or use a sanitization library like DOMPurify
sheetBody.innerHTML = DOMPurify.sanitize(userProvidedContent);
```

### Focus Management

The component manages focus and uses the `inert` attribute or `aria-hidden` to prevent interaction with background content. Ensure your application doesn't inadvertently bypass these protections.

### Event Handlers

Custom event handlers attached to sheet elements should properly validate data in `event.detail` before use.

## Security Hall of Fame

We recognize and thank the following individuals for responsibly disclosing security vulnerabilities:

_(No entries yet)_

> To be listed here, please include your preferred name and profile link when submitting your report.

## License and Scope

This security policy applies to the **Bootstrap Sheet** project under the [MIT License](LICENSE). It does not extend to external dependencies or integrations.

## Questions?

If you have any questions about this security policy, please contact [sergeymironov@protonmail.com](mailto:sergeymironov@protonmail.com).
