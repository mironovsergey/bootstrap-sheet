# Bootstrap Sheet

Touch-friendly bottom sheet component for Bootstrap 5 — supports swipe gestures, backdrop, focus management, and is built with accessibility in mind.

[Documentation](https://mironovsergey.github.io/bootstrap-sheet/) · [Report Bug](https://github.com/mironovsergey/bootstrap-sheet/issues) · [Request Feature](https://github.com/mironovsergey/bootstrap-sheet/issues) · [Discussions](https://github.com/mironovsergey/bootstrap-sheet/discussions)

---

## Table of contents

- [Bootstrap Sheet](#bootstrap-sheet)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Yarn](#yarn)
    - [Download](#download)
  - [Quick Start](#quick-start)
    - [Via data attributes](#via-data-attributes)
    - [Via JavaScript](#via-javascript)
  - [Options](#options)
    - [UI Options](#ui-options)
    - [Gesture Options](#gesture-options)
    - [Animation Options](#animation-options)
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
<div class="sheet" id="mySheet" tabindex="-1" data-bs-backdrop="true" data-bs-keyboard="true" data-bs-focus="true">
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

| Name       | Type                             | Default | Description                                                                                                 |
| ---------- | -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `backdrop` | boolean or `'static'`            | `true`  | Includes a backdrop element. Use `'static'` for a backdrop that doesn't close the sheet when clicked.       |
| `keyboard` | boolean                          | `true`  | Closes the sheet when escape key is pressed.                                                                |
| `focus`    | boolean                          | `true`  | Puts focus on the sheet when initialized and traps focus within it.                                         |

### Gesture Options

| Name                  | Type    | Default | Description                                                  |
| --------------------- | ------- | ------- | ------------------------------------------------------------ |
| `gestures`            | boolean | `true`  | Enable/disable swipe gestures.                               |
| `swipeThreshold`      | number  | `50`    | Minimum swipe distance (px) to trigger close.                |
| `velocityThreshold`   | number  | `0.5`   | Minimum velocity (px/ms) to trigger close.                   |
| `minCloseDistance`    | number  | `50`    | Minimum distance (px) for velocity-based close.              |
| `closeThresholdRatio` | number  | `0.3`   | Ratio of sheet height (0-1) to trigger close when released.  |

### Animation Options

| Name                 | Type   | Default | Description                                                      |
| -------------------- | ------ | ------- | ---------------------------------------------------------------- |
| `animationDuration`  | number | `300`   | Animation duration in milliseconds.                              |
| `projectionTime`     | number | `200`   | Time (ms) to project velocity for momentum-based closing.        |
| `dragResistanceUp`   | number | `0.75`  | Resistance when dragging up (0-1, higher = more resistance).     |
| `dragResistanceDown` | number | `0.01`  | Resistance when dragging down (0-1, higher = more resistance).   |

---

## Methods

All methods are **asynchronous** and return to the caller as soon as the transition starts.

```javascript
const sheet = BootstrapSheet.getInstance('#mySheet');
```

| Method                                    | Description                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `show()`                                  | Opens the sheet.                                                                          |
| `hide()`                                  | Closes the sheet.                                                                         |
| `toggle()`                                | Toggles the sheet visibility.                                                             |
| `dispose()`                               | Destroys the sheet instance and removes all event listeners.                              |
| `getInstance(element)` (static)           | Returns the sheet instance associated with a DOM element or `null` if not initialized.    |
| `getOrCreateInstance(element, config?)` (static) | Gets existing instance or creates a new one if it doesn't exist.                   |

---

## Properties

| Property          | Type    | Description                                          |
| ----------------- | ------- | ---------------------------------------------------- |
| `isShown`         | boolean | Returns `true` if the sheet is currently visible.    |
| `isTransitioning` | boolean | Returns `true` if the sheet is currently animating.  |

---

## Events

All events are fired at the sheet element itself.

| Event Type        | Description                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `show.bs.sheet`   | Fired immediately when the `show()` method is called.                                                            |
| `shown.bs.sheet`  | Fired when the sheet has been made visible to the user (after CSS transitions complete).                         |
| `hide.bs.sheet`   | Fired immediately when the `hide()` method is called.                                                            |
| `hidden.bs.sheet` | Fired when the sheet has finished being hidden from the user (after CSS transitions complete).                   |
| `slide.bs.sheet`  | Fired continuously during drag/slide gestures. Event detail contains `velocity`, `adjustedY`, `deltaY`, `ratio`. |

```javascript
document.getElementById('mySheet').addEventListener('shown.bs.sheet', (event) => {
  console.log('Sheet is now visible');
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

// Transitions
$sheet-transition-duration: 0.3s !default;
$sheet-transition-timing: ease-out !default;

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

// Animations
$sheet-shake-distance: 10px !default;

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
- **Reduced motion** — Respects `prefers-reduced-motion` user preference

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
