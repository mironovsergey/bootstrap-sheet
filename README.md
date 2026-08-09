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
    - [Dragging and scrollable content](#dragging-and-scrollable-content)
    - [Detents](#detents)
  - [Methods](#methods)
  - [Properties](#properties)
  - [Events](#events)
  - [TypeScript](#typescript)
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
  <div class="sheet-handle"></div>
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

> **Note:** The whole sheet is draggable — no drag handle element is required. The `.sheet-handle` element is purely a visual grabber. (Before v0.4.0 dragging required `data-bs-drag="sheet"`; see [Dragging and scrollable content](#dragging-and-scrollable-content).)

| Name                 | Type    | Default | Description                                                                                                            |
| -------------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `gestures`           | boolean | `true`  | Enable/disable swipe gestures.                                                                                         |
| `springDampingRatio` | number  | `0.8`   | Damping ratio for the spring animation. `1.0` = no bounce (critically damped). Values below `1.0` add a subtle bounce. |
| `springResponse`     | number  | `0.4`   | Response time of the spring in seconds. Lower values make the spring faster and snappier.                              |

### Dragging and scrollable content

A drag starts anywhere on the sheet once the pointer has travelled 8 px vertically. Below that threshold the gesture is a tap, so buttons, links and form controls inside the sheet keep working normally.

When the gesture starts inside a scrollable element, the sheet decides once, at touch-down, who owns it:

| Situation                                        | Result              |
| ------------------------------------------------ | ------------------- |
| Content is scrolled away from its top            | Content scrolls     |
| Content is at its top and the gesture goes down  | Sheet drags         |
| Content is at its top and the gesture goes up    | Content scrolls     |
| Gesture is predominantly horizontal              | Left to the content |
| Gesture starts within 100 ms of a content scroll | Content scrolls     |

The decision holds for the whole gesture: the browser cannot hand a scroll back mid-gesture, so a gesture that began as a scroll stays a scroll until the finger lifts.

**Opting out.** Mark any subtree that must not start a drag:

```html
<div class="sheet-body">
  <div data-bs-drag="false">
    <!-- swipeable carousel, signature pad, map... -->
  </div>
</div>
```

Elements that own a drag gesture of their own are excluded automatically: `input[type="range"]`, `[contenteditable]` and `[draggable="true"]`.

**Custom scroll containers.** Give any scrollable element inside the sheet `overscroll-behavior: contain` so reaching its edge does not scroll the page behind it. The bundled `.sheet-body` already has it.

### Detents

A detent is a height the sheet rests at, written as the fraction of its height that is visible: `1` is fully open, `0.4` shows 40 %. By default a sheet has the single detent `1` and behaves exactly as it always has.

```javascript
const sheet = new BootstrapSheet('#mySheet', {
  detents: [0.4, 1],
  initialDetent: 0.4,
});
```

```html
<div class="sheet" id="mySheet" data-bs-detents="0.4,1"></div>
```

Both `0.4,1` and `[0.4, 1]` are accepted in the data attribute. Values are sorted and deduplicated; each must be greater than `0` and at most `1`. Closing is not a detent — a sheet rests at a detent or it is gone.

| Name             | Type             | Default | Description                                                                                  |
| ---------------- | ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `detents`        | number[]         | `[1]`   | Resting positions, as visible fractions of the sheet's height.                               |
| `initialDetent`  | number or `null` | `null`  | Detent the sheet opens at. Defaults to the smallest one.                                     |
| `undimmedDetent` | number or `null` | `null`  | Largest detent at which the sheet is non-modal. `null` dims proportionally across the range. |

**Snapping.** On release the sheet's velocity is projected forward and it settles at whichever detent — or the closed position — is nearest to that projection. A hard flick overshoots and skips detents; a slow drag lands on the neighbour. Dismissal falls out of the same comparison, so nothing extra is needed to close by swipe.

**Scrolling and expanding.** Below the largest detent the content does not scroll: a gesture anywhere on the sheet expands it first. Once at the largest detent, scrollable content behaves as described above. This mirrors iOS's `prefersScrollingExpandsWhenScrolledToEdge`.

**Non-modal detents.** `undimmedDetent` names the largest detent at which the backdrop stays transparent. At or below it the sheet does not act as a modal: the page behind keeps scrolling and stays clickable, the background is not made inert, focus is not trapped, and `aria-modal` reports `false`. Above it the backdrop fades in and all four are restored. Following iOS, the absence of dimming _is_ the affordance that the area outside is live — which is why an undimmed sheet also does not dismiss on an outside click. `undimmedDetent` must be smaller than the largest detent; a sheet that is never modal is out of scope for this component.

```javascript
// A 30 % peek that leaves the page usable, dimming only once expanded
new BootstrapSheet('#mySheet', {
  detents: [0.3, 1],
  undimmedDetent: 0.3,
});
```

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
| `setDetent(detent)`                              | Animates the sheet to one of its configured detents.                                   |
| `dispose()`                                      | Destroys the sheet instance and removes all event listeners.                           |
| `getInstance(element)` (static)                  | Returns the sheet instance associated with a DOM element or `null` if not initialized. |
| `getOrCreateInstance(element, config?)` (static) | Gets existing instance or creates a new one if it doesn't exist.                       |

---

## Properties

| Property          | Type    | Description                                         |
| ----------------- | ------- | --------------------------------------------------- |
| `isShown`         | boolean | Returns `true` if the sheet is currently visible.   |
| `isTransitioning` | boolean | Returns `true` if the sheet is currently animating. |
| `currentDetent`   | number  | The detent the sheet is resting at.                 |

---

## Events

All events are fired at the sheet element itself.

| Event Type              | Description                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `show.bs.sheet`         | Fired immediately when the `show()` method is called.                                                                     |
| `shown.bs.sheet`        | Fired when the sheet has been made visible to the user (after the animation completes).                                   |
| `hide.bs.sheet`         | Fired immediately when the `hide()` method is called.                                                                     |
| `hidden.bs.sheet`       | Fired when the sheet has finished being hidden from the user (after the animation completes).                             |
| `slide.bs.sheet`        | Fired continuously during drag/slide gestures. Event detail contains `velocity`, `adjustedY`, `deltaY`, `ratio`.          |
| `detentchange.bs.sheet` | Fired after the sheet settles at a different detent. Event detail contains `detent` and `previousDetent`. Not cancelable. |

```javascript
document.getElementById('mySheet').addEventListener('shown.bs.sheet', (event) => {
  console.log('Sheet is now visible');
});

document.getElementById('mySheet').addEventListener('slide.bs.sheet', (event) => {
  const { velocity, adjustedY, deltaY, ratio } = event.detail;
  // ratio: 1 = fully open, 0 = fully closed
  console.log(`Sheet is ${Math.round(ratio * 100)}% open`);
});
```

---

## TypeScript

The package ships type declarations generated from the source - no `@types`
package is needed. The options interface is exported from the package root:

```typescript
import BootstrapSheet from 'bootstrap-sheet';
import type { BootstrapSheetOptions } from 'bootstrap-sheet';

const options: BootstrapSheetOptions = {
  backdrop: 'static',
  springDampingRatio: 1,
};

const sheet = BootstrapSheet.getOrCreateInstance('#mySheet', options);
```

Option values are type-checked (for example, `backdrop` accepts only
`boolean` or `'static'`), and declaration maps are included, so
"Go to Definition" in your editor lands in the actual TypeScript source.

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
$sheet-handle-width: 3rem !default;
$sheet-handle-height: 0.25rem !default;
$sheet-handle-margin: 0.5rem auto !default;

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

Code and documentation © 2025–2026 [Sergey Mironov](https://github.com/mironovsergey)

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
