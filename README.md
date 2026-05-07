# Bootstrap Sheet

[![npm version](https://img.shields.io/npm/v/bootstrap-sheet)](https://www.npmjs.com/package/bootstrap-sheet)
[![npm downloads](https://img.shields.io/npm/dm/bootstrap-sheet)](https://www.npmjs.com/package/bootstrap-sheet)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/bootstrap-sheet)](https://bundlephobia.com/package/bootstrap-sheet)
[![License](https://img.shields.io/github/license/mironovsergey/bootstrap-sheet)](https://github.com/mironovsergey/bootstrap-sheet/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mironovsergey/bootstrap-sheet/test.yml?branch=main)](https://github.com/mironovsergey/bootstrap-sheet/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/mironovsergey/bootstrap-sheet/branch/main/graph/badge.svg)](https://codecov.io/gh/mironovsergey/bootstrap-sheet)
[![Known Vulnerabilities](https://snyk.io/test/github/mironovsergey/bootstrap-sheet/badge.svg)](https://snyk.io/test/github/mironovsergey/bootstrap-sheet)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://mironovsergey.github.io/bootstrap-sheet/)

Touch-friendly bottom sheet component for Bootstrap 5 - supports physics-based swipe gestures with spring animations, backdrop, focus management, and is built with accessibility in mind.

[Documentation](https://mironovsergey.github.io/bootstrap-sheet/) · [Report Bug](https://github.com/mironovsergey/bootstrap-sheet/issues) · [Request Feature](https://github.com/mironovsergey/bootstrap-sheet/issues) · [Discussions](https://github.com/mironovsergey/bootstrap-sheet/discussions)

---

## Table of contents

- [Bootstrap Sheet](#bootstrap-sheet)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Yarn](#yarn)
    - [CDN](#cdn)
      - [jsDelivr](#jsdelivr)
      - [unpkg](#unpkg)
    - [Download](#download)
  - [Quick Start](#quick-start)
    - [Via data attributes](#via-data-attributes)
    - [Via JavaScript](#via-javascript)
  - [Options](#options)
    - [UI Options](#ui-options)
    - [Gesture Options](#gesture-options)
    - [Deprecated Options](#deprecated-options)
  - [Methods](#methods)
  - [Properties](#properties)
  - [Events](#events)
  - [Sass variables](#sass-variables)
  - [Accessibility](#accessibility)
  - [Contributing](#contributing)
  - [Versioning](#versioning)
  - [License](#license)
  - [Author](#author)

---

## Installation

### NPM

```bash
npm install bootstrap-sheet
```

### Yarn

```bash
yarn add bootstrap-sheet
```

### CDN

#### jsDelivr

```html
<!-- CSS -->
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap-sheet@latest/dist/css/bootstrap-sheet.min.css"
  rel="stylesheet"
/>

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap-sheet@latest/dist/js/bootstrap-sheet.min.js"></script>
```

#### unpkg

```html
<!-- CSS -->
<link
  href="https://unpkg.com/bootstrap-sheet@latest/dist/css/bootstrap-sheet.min.css"
  rel="stylesheet"
/>

<!-- JavaScript -->
<script src="https://unpkg.com/bootstrap-sheet@latest/dist/js/bootstrap-sheet.min.js"></script>
```

### Download

[Download the latest release](https://github.com/mironovsergey/bootstrap-sheet/releases/latest) and include the compiled CSS and JavaScript files in your project.

---

## Quick Start

### Via data attributes

Activate a sheet without writing JavaScript. Set `data-bs-toggle="sheet"` on a controller element, like a button, along with a `data-bs-target="#foo"` or `href="#foo"` to target a specific sheet to toggle.

```html
<!-- Button trigger -->
<button type="button" class="btn btn-primary" data-bs-toggle="sheet" data-bs-target="#mySheet">
  Launch sheet
</button>

<!-- Sheet -->
<div
  class="sheet"
  id="mySheet"
  tabindex="-1"
  data-bs-backdrop="true"
  data-bs-keyboard="true"
  data-bs-focus="true"
>
  <div class="sheet-handle" data-bs-drag="sheet"></div>
  <div class="sheet-header">
    <h5 class="sheet-title">Sheet title</h5>
    <button type="button" class="btn-close" data-bs-dismiss="sheet" aria-label="Close"></button>
  </div>
  <div class="sheet-body">
    <p>Sheet body text goes here.</p>
  </div>
  <div class="sheet-footer">
    <button type="button" class="btn btn-secondary" data-bs-dismiss="sheet">Close</button>
    <button type="button" class="btn btn-primary">Save changes</button>
  </div>
</div>
```

### Via JavaScript

```javascript
import BootstrapSheet from 'bootstrap-sheet';

// Create instance (selector or Element accepted)
const sheet = new BootstrapSheet('#mySheet', {
  backdrop: true,
  keyboard: true,
  focus: true,
  gestures: true,
});

// Show the sheet
sheet.show();
```

**More examples:** [Live Demo](https://mironovsergey.github.io/bootstrap-sheet/)

---

## Options

Options can be passed via data attributes or JavaScript. For data attributes, append the option name to `data-bs-`, as in `data-bs-backdrop="static"`.

### UI Options

| Name       | Type                  | Default | Description                                                                                           |
| ---------- | --------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `backdrop` | boolean or `'static'` | `true`  | Includes a backdrop element. Use `'static'` for a backdrop that doesn't close the sheet when clicked. |
| `keyboard` | boolean               | `true`  | Closes the sheet when escape key is pressed.                                                          |
| `focus`    | boolean               | `true`  | Puts focus on the sheet when initialized and traps focus within it.                                   |

### Gesture Options

Dismissal is driven by inertia projection: when the user releases the sheet, its velocity is projected forward using a deceleration curve. If the projected resting position exceeds 50% of the sheet height, the sheet closes; otherwise it snaps back. `springDampingRatio` and `springResponse` tune the feel of the snap-back and dismiss animations.

> **Note:** Gesture handling requires a drag handle element inside the sheet: `<div data-bs-drag="sheet"></div>`. Without it, `gestures: true` has no effect.

| Name                 | Type    | Default | Description                                                                                                            |
| -------------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `gestures`           | boolean | `true`  | Enable/disable swipe gestures.                                                                                         |
| `springDampingRatio` | number  | `0.8`   | Damping ratio for the spring animation. `1.0` = no bounce (critically damped). Values below `1.0` add a subtle bounce. |
| `springResponse`     | number  | `0.4`   | Response time of the spring in seconds. Lower values make the spring faster and snappier.                              |

### Deprecated Options

The following options have no effect if passed (a console warning is shown):

`animationDuration`, `swipeThreshold`, `velocityThreshold`, `minCloseDistance`, `closeThresholdRatio`, `projectionTime`, `dragResistanceUp`, `dragResistanceDown`

Use `springDampingRatio` and `springResponse` to tune gesture feel instead.

---

## Methods

All methods are **asynchronous** and return to the caller as soon as the transition starts.

```javascript
const sheet = BootstrapSheet.getInstance('#mySheet');
```

| Method                                           | Description                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `show()`                                         | Opens the sheet.                                                                       |
| `hide()`                                         | Closes the sheet.                                                                      |
| `toggle()`                                       | Toggles the sheet visibility.                                                          |
| `dispose()`                                      | Destroys the sheet instance and removes all event listeners.                           |
| `getInstance(element)` (static)                  | Returns the sheet instance associated with a DOM element or `null` if not initialized. |
| `getOrCreateInstance(element, config?)` (static) | Gets existing instance or creates a new one if it doesn't exist.                       |

---

## Properties

| Property          | Type    | Description                                         |
| ----------------- | ------- | --------------------------------------------------- |
| `isShown`         | boolean | Returns `true` if the sheet is currently visible.   |
| `isTransitioning` | boolean | Returns `true` if the sheet is currently animating. |

---

## Events

All events are fired at the sheet element itself.

| Event Type        | Description                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `show.bs.sheet`   | Fired immediately when the `show()` method is called.                                                            |
| `shown.bs.sheet`  | Fired when the sheet has been made visible to the user (after the animation completes).                          |
| `hide.bs.sheet`   | Fired immediately when the `hide()` method is called.                                                            |
| `hidden.bs.sheet` | Fired when the sheet has finished being hidden from the user (after the animation completes).                    |
| `slide.bs.sheet`  | Fired continuously during drag/slide gestures. Event detail contains `velocity`, `adjustedY`, `deltaY`, `ratio`. |

```javascript
document.getElementById('mySheet').addEventListener('shown.bs.sheet', (event) => {
  console.log('Sheet is now visible');
});

document.getElementById('mySheet').addEventListener('slide.bs.sheet', (event) => {
  const { velocity, adjustedY, deltaY, ratio } = event.detail;
  // ratio: 0 = fully open, 1 = fully closed
  console.log(`Drag progress: ${Math.round(ratio * 100)}%`);
});
```

---

## Sass variables

Customize the appearance by overriding these Sass variables:

```scss
// Z-index
$sheet-zindex: 1057 !default;

// Dimensions
$sheet-width: 100vw !default;
$sheet-max-width: 100% !default;
$sheet-max-height: 90vh !default;

// Colors
$sheet-bg: var(--bs-body-bg, #fff) !default;
$sheet-backdrop-bg: rgba(0, 0, 0, 0.5) !default;
$sheet-backdrop-backdrop-filter: blur(2px) !default;

// Handle
$sheet-handle-bg: var(--bs-gray-400, #dee2e6) !default;
$sheet-handle-hover-bg: var(--bs-gray-500, #adb5bd) !default;
$sheet-handle-width: 3rem !default;
$sheet-handle-height: 0.25rem !default;
$sheet-handle-margin: 0.5rem auto !default;
$sheet-handle-hit-area: 2rem !default;

// Spacing
$sheet-padding-x: 1rem !default;
$sheet-padding-y: 1rem !default;
$sheet-header-padding-y: 0.75rem !default;
$sheet-body-padding-y: 1rem !default;
$sheet-footer-padding-y: 0.75rem !default;

// Visual effects
$sheet-box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1) !default;
$sheet-border-width: 1px !default;
$sheet-border-color: var(--bs-border-color, #dee2e6) !default;
$sheet-border-radius: 1rem 1rem 0 0 !default;

// Focus
$sheet-focus-ring-width: 0.25rem !default;
$sheet-focus-ring-color: rgba(13, 110, 253, 0.25) !default;

// States
$sheet-disabled-opacity: 0.65 !default;
```

---

## Accessibility

Bootstrap Sheet follows WCAG 2.1 Level AA guidelines:

- **ARIA attributes** — Automatically applies `role="dialog"` and `aria-modal="true"`
- **Focus management** — Traps focus within the sheet and restores it on close
- **Keyboard navigation** — Full support for Tab, Shift+Tab, and Escape keys
- **Inert background** — Uses native `inert` attribute with `aria-hidden` fallback
- **Screen reader support** — Announces state changes with proper context

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](https://github.com/mironovsergey/bootstrap-sheet/blob/main/CONTRIBUTING.md) before submitting a Pull Request.

---

## Versioning

Bootstrap Sheet follows [Semantic Versioning](https://semver.org/). For available versions, see [Releases](https://github.com/mironovsergey/bootstrap-sheet/releases).

---

## License

Code and documentation © 2025 [Sergey Mironov](https://github.com/mironovsergey)

Code released under the [MIT License](https://github.com/mironovsergey/bootstrap-sheet/blob/main/LICENSE)

Documentation released under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/)

---

## Author

**Sergey Mironov**

- GitHub: [@mironovsergey](https://github.com/mironovsergey)
- Email: sergeymironov@protonmail.com

---

**[⬆ Back to top](#bootstrap-sheet)**

Made with ❤️ by [Sergey Mironov](https://github.com/mironovsergey)
