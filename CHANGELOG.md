# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-08-09

### Added

**Detents: the sheet can rest at more than one height.**

A detent is written as the fraction of the sheet's height that is visible - `1` is fully open, `0.4` shows 40 %. The default is a single detent of `1`, which is what every previous version did, so nothing changes for a sheet that does not ask for detents.

```javascript
new BootstrapSheet('#mySheet', { detents: [0.4, 1] });
```

```html
<div class="sheet" data-bs-detents="0.4,1"></div>
```

The layout model follows iOS: the sheet is laid out at its full height and moved with `translateY`, so a detent is an offset rather than a height animation. The spring engine needed no changes at all - it already animated to an arbitrary target.

Snapping generalizes the rule that was already there rather than replacing it. On release the velocity is projected forward through the deceleration curve, and the sheet settles at whichever detent - or the closed position - is nearest to that projection. With the default single detent this reduces to "nearest of open and closed", whose boundary is the midpoint: exactly the rule v0.4.0 used. Dismissal is the same comparison, so no separate threshold exists, and velocity needs no separate handling: a hard flick overshoots and skips detents, a slow drag lands on the neighbour.

Below the largest detent the content does not scroll: a gesture anywhere on the sheet expands it first, and scrolling resumes once the sheet is fully open. This is iOS's `prefersScrollingExpandsWhenScrolledToEdge`, and it falls out of the gesture arbitration added in v0.4.0 rather than being special-cased.

| Addition                | Kind     | Notes                                                                      |
| ----------------------- | -------- | -------------------------------------------------------------------------- |
| `detents`               | option   | `number[]`, default `[1]`; also `data-bs-detents="0.4,1"`                  |
| `initialDetent`         | option   | `number \| null`, defaults to the smallest detent                          |
| `undimmedDetent`        | option   | `number \| null`, default `null`                                           |
| `currentDetent`         | property | The resting detent; not the position in flight during a drag               |
| `setDetent(detent)`     | method   | Animates to a configured detent                                            |
| `detentchange.bs.sheet` | event    | Fired once on settle, `detail: { detent, previousDetent }`; not cancelable |

**Non-modal detents via `undimmedDetent`.**

It names the largest detent at which the backdrop stays transparent. At or below it the sheet stops behaving as a modal: page scrolling is not locked, the page behind stays clickable, the background is not made inert, focus is not trapped, `aria-modal` reports `false`, and an outside click does not dismiss. Above it all of them are restored. This follows Apple's reasoning that the absence of dimming _is_ the affordance that the area outside is live; there is deliberately no way to have an undimmed sheet that still dismisses on an outside tap.

Modality is toggled only when a detent change settles, never per animation frame - applying `inert` walks the ancestor chain of the sheet and is far too expensive to run sixty times a second.

**The sheet is re-measured when its height changes.**

Height was captured once when the sheet opened. With detents a stale measurement misplaces every one of them, so a `ResizeObserver` now keeps it current across rotation, an on-screen keyboard, or a mobile address bar collapsing. Re-measurement is skipped while a gesture or an animation owns the transform, so it never fights either one.

### Fixed

**The backdrop now reaches its exact final opacity.** A spring settles within half a pixel of its target and the sheet's transform was pinned to the exact value on settle, but the backdrop kept the opacity computed from that last almost-arrived frame - it ended at `0.9998` instead of `1`. Invisible in practice, but it left the backdrop a hair off its resting value after every animation.

---

## [0.4.0] - 2026-08-03

### Changed

**The whole sheet is now draggable; a drag handle element is no longer required.**

Until now a gesture only started on an element carrying `data-bs-drag="sheet"`, and a sheet without one ignored `gestures: true` entirely. Dragging is now available anywhere on the sheet, which is how the native iOS sheet behaves and what users reach for first - most people try to pull the sheet by its content, not by the grabber.

Making the entire surface draggable means the component has to tell a drag from a tap, and from a scroll of the content inside it. Three rules do that:

1. **Drag slop.** A gesture becomes a drag only after the pointer has travelled 8 px vertically. Below that threshold nothing moves and the event is left alone, so buttons, links and form controls inside the sheet keep working exactly as before. A predominantly horizontal gesture is abandoned to the content, leaving carousels and sliders usable.
2. **Gesture arbitration with scrollable content.** When a gesture starts inside a scrollable element, ownership is resolved once, at touch-down: content that is scrolled away from its top keeps the gesture; content sitting at its top keeps an upward gesture (it can still scroll that way) but yields a downward one to the sheet. A gesture starting within 100 ms of a content scroll is treated as momentum and left to the content, so a flick that coasts to the top does not turn into an accidental dismissal.
3. **Opt-out zones.** `data-bs-drag="false"` marks a subtree that must never start a drag. `input[type="range"]`, `[contenteditable]` and `[draggable="true"]` are excluded automatically, since they own a drag gesture of their own.

The decision holds for the entire gesture. This is a limitation of the web rather than a design choice: once the browser has begun scrolling, `preventDefault()` can no longer stop it, and `touch-action` cannot be changed mid-gesture. A gesture that began as a content scroll therefore stays a content scroll until the finger lifts - unlike iOS, which can hand off inside a single gesture.

**Migration.** No markup change is required for the new behavior; it applies to every sheet automatically. If your sheet contains content that must not be draggable - a swipeable carousel, a signature pad, a map - wrap it in `data-bs-drag="false"`. Custom scroll containers inside the sheet should carry `overscroll-behavior: contain` (the bundled `.sheet-body` already does).

**The grabber lost the styles that made it the sole drag target.** `.sheet-handle` no longer carries `cursor: grab` / `cursor: grabbing`, a `:focus-visible` outline, or the invisible `::before` pseudo-element that enlarged its touch area - all of them advertised or served a hit target that is now the entire sheet. It remains a purely visual grabber, with its class, dimensions, margin and background unchanged. Text selection during a drag is still suppressed, from `.sheet.dragging` rather than from the handle.

Two Sass variables were removed along with the rules that used them:

| Removed variable         | Was used for                                    |
| ------------------------ | ----------------------------------------------- |
| `$sheet-handle-hover-bg` | Hover colour of the grabber                     |
| `$sheet-handle-hit-area` | Size of the grabber's invisible touch extension |

If you overrode either one, delete the override - Sass will otherwise fail on an unknown variable. The remaining handle variables (`$sheet-handle-bg`, `$sheet-handle-width`, `$sheet-handle-height`, `$sheet-handle-margin`) are unchanged. To keep a hover effect, style `.sheet-handle:hover` directly in your own stylesheet.

### Deprecated

**`data-bs-drag="sheet"` has no effect and now emits a console warning.** It will be removed in v0.5.0. Remove the attribute; the `.sheet-handle` element itself can stay exactly as it is - it keeps its class, its styling and its role as a visual grabber, it simply no longer has any bearing on where dragging works. `touch-action: none` has been removed from `.sheet-handle`, since `touch-action` is now declared on the sheet root where it governs the whole surface.

### Fixed

**A gesture cancelled by the browser no longer dismisses the sheet.** `pointercancel` was handled identically to `pointerup`, so it produced a full release decision: if the sheet happened to be dragged past the midpoint when the browser took the gesture away, it would close even though the user never finished the gesture. Cancellation now aborts the drag and returns the sheet to its resting position. This was largely theoretical while dragging was confined to a small handle, but with the whole sheet draggable - and native scrolling now in the picture - `pointercancel` is an ordinary occurrence.

---

## [0.3.1] - 2026-07-24

### Fixed

**A sheet nested inside a wrapper element made itself inert when opened.**

While a sheet is open, everything outside it is hidden from assistive technology using the native `inert` attribute, with an `aria-hidden` fallback. The implementation walked the children of `<body>` and skipped the sheet and the backdrop by identity, which silently assumed the sheet was itself a direct child of `<body>`. When it was not - rendered into an app root such as `<div id="app">`, or wrapped by a component - the wrapper matched none of the excluded elements and was hidden along with the rest of the page. Because `inert` is inherited, the sheet inside it went inert too: the whole sheet became unclickable and unfocusable, dropped out of the tab order and disappeared from assistive technology, all while remaining fully visible and animating normally.

The failure was silent from the inside as well. The focus trap filters candidates by `!element.hasAttribute('inert')`, but the attribute sat on the wrapper rather than on the individual controls, so the trap saw a healthy list of focusable elements, called `focus()` on the first one, and the call quietly did nothing.

Hiding is now computed by walking from the sheet and the backdrop up to `<body>`, hiding siblings at every level instead of only at the top. Ancestors of the sheet stay interactive at any nesting depth, and a sheet authored as a direct child of `<body>` behaves exactly as before.

**Note on behavior:** siblings of the sheet _inside its own wrapper_ are now hidden as well, where previously only children of `<body>` were touched. This is what a modal presentation calls for, but if you deliberately placed content next to the sheet inside a shared wrapper and expected it to stay reachable, that content is now hidden for as long as the sheet is open.

---

## [0.3.0] - 2026-07-22

### Removed

**The eight options deprecated in v0.2.0 have been removed**, together with the deprecation warning mechanism: `swipeThreshold`, `velocityThreshold`, `minCloseDistance`, `closeThresholdRatio`, `animationDuration`, `projectionTime`, `dragResistanceUp`, `dragResistanceDown`.

These options have had no effect since the v0.2.0 engine rewrite - they were only accepted for backward compatibility and produced a console warning promising removal in this release.

**Migration:** remove these options from your JavaScript configuration and `data-bs-*` attributes; use `springDampingRatio` and `springResponse` to tune gesture and animation feel. Passing a removed option is now silently ignored (standard Bootstrap behavior for unknown options) instead of producing a console warning. For TypeScript consumers the removed options are no longer part of `BootstrapSheetOptions`, so passing one is a compile-time error.

### Changed

**The codebase is now TypeScript (strict mode), decomposed into focused modules.**

The single component file has been split into five helper modules, mirroring Bootstrap's own `util/` decomposition: backdrop lifecycle, body scrollbar compensation, focus trap + inert management, a DOM-agnostic spring animation driver, and a drag controller that owns pointer input and gesture physics. The drag controller is the foundation for whole-root dragging and detents planned for upcoming releases.

The public API, DOM structure, class names, events, and physics behavior are unchanged - the entire v0.2.0 test suite passes without modifications. The build pipeline is also unchanged (Babel strips types; browser targets are identical), so the distributed bundles are functionally equivalent to a plain JavaScript build.

**Type declarations are now generated from the source.**

The hand-written `src/types/index.d.ts` has been replaced by declarations generated with `tsc` into `dist/types/`, referenced by the package `types` field. Declarations can no longer drift from the implementation. Practical improvements for TypeScript consumers:

- JSDoc descriptions on every public member, visible in editor hints
- Option values are type-checked: `BootstrapSheetOptions` is exported from the package root, and `BootstrapSheet.Default` is fully typed
- Declaration maps are included, so "Go to Definition" lands in the actual TypeScript source shipped with the package

---

## [0.2.0] - 2026-05-07

### Added

- `springDampingRatio` option (number, default `0.8`) - damping ratio for all spring animations: `1.0` = critically damped (no bounce), values below `1.0` add a subtle overshoot
- `springResponse` option (number, default `0.4`) - response time in seconds; controls how fast the spring reaches its target (converted to stiffness internally: `k = (2π / response)²`)
- `animating` CSS class - applied to the sheet element for the entire duration of any spring animation (show, hide, snap-back); useful for suppressing pointer events or applying styles during motion

### Changed

**Animation engine completely rewritten - CSS transitions replaced by JavaScript spring physics.**

In v0.1.0, all animations (show, hide, snap-back after gesture) were driven by CSS `transition` properties on the sheet and backdrop elements. Timing was measured by listening for `transitionend` events. This had two fundamental limitations: the duration was fixed regardless of how fast the user was dragging, and there was no way to hand off gesture velocity to the animation so it could start at the speed the finger was moving.

In v0.2.0, every animation - including open, close, and snap-back - runs through a JavaScript spring solver (`requestAnimationFrame` loop). The solver uses the exact analytical solution to the spring-damper ODE, which is unconditionally stable for any parameter combination. This enables behaviors that are impractical with plain CSS transitions alone:

1. **Velocity handoff from gesture to animation.** When the user releases the sheet, the spring starts at the finger's release velocity. The animation feels like a physical continuation of the drag rather than a separate, disconnected transition.
2. **Duration emerges from physics.** The animation runs until position and velocity fall below a perceptible threshold (0.5 px / 0.5 px·s⁻¹). There is no hardcoded duration; a fast flick settles quickly, a slow release settles slowly.

The `springDampingRatio` and `springResponse` options give designers control over the feel without requiring knowledge of physical units. The conversion to physical constants (`stiffness`, `damping`) follows Apple's WWDC 2018 parameterization: `k = (2π/response)²`, `c = 4π · dampingRatio / response`.

**Drag resistance replaced with Apple's rubber band formula.**

The previous implementation used a custom hyperbolic resistance curve with fixed coefficients (`dragResistanceUp`, `dragResistanceDown`) when dragging past the top boundary. The formula did not scale with sheet size, producing a stiffer feel on tall sheets and a looser feel on short ones.

The new implementation uses Apple's exact UIScrollView rubber band formula: `b = (1 − 1 / (x·c/d + 1)) · d`, where `c = 0.55` is Apple's measured coefficient and `d` is the sheet height. The resistance scales proportionally with the sheet dimension, matching native iOS behavior at all screen sizes.

**Dismiss decision replaced with inertia projection.**

The previous implementation used three independent fixed thresholds: `swipeThreshold` (minimum drag distance), `velocityThreshold` (minimum velocity), and `closeThresholdRatio` (ratio of sheet height). This created a fragmented decision that could produce unexpected outcomes near threshold boundaries.

The new implementation uses Apple's `UIPanGestureRecognizer` model: on release, the current velocity is projected forward using the UIScrollView normal deceleration rate (`0.998`) to estimate where the sheet would naturally come to rest. If the projected resting position exceeds 50% of the sheet height, the sheet is dismissed; otherwise it snaps back. Position and momentum are unified into a single continuous decision.

**Velocity measurement replaced with a windowed tracker.**

The previous implementation computed velocity as an instantaneous `Δposition / Δtime` between consecutive `pointermove` events. A brief pause before release would produce near-zero velocity even after a fast drag.

The new `VelocityTracker` maintains a 100 ms sliding window of `{timestamp, position}` samples - the same approach used by iOS `UIPanGestureRecognizer`. Velocity is computed from the oldest and newest samples within the window. If the gesture pauses before release (gap > 100 ms), velocity is correctly reported as zero, signaling intent to stay at the current position.

**Shake effect rewritten with Web Animations API.**

The previous shake animation (triggered by Escape key or static backdrop click) used `setTimeout` with CSS class toggling. Because the sheet's `transform` is now continuously managed by the spring solver, overwriting `style.transform` would conflict with the animation loop.

The new implementation uses `element.animate()` with `composite: 'add'`, which layers the shake keyframes on top of the existing spring transform without interrupting or resetting it.

### Deprecated

The following options now emit a console warning and will be removed in v0.3.0. They are silently ignored by the new animation and gesture engines.

| Option                | Replacement                                                   |
| --------------------- | ------------------------------------------------------------- |
| `swipeThreshold`      | Dismiss is now driven by inertia projection                   |
| `velocityThreshold`   | Dismiss is now driven by inertia projection                   |
| `minCloseDistance`    | Dismiss is now driven by inertia projection                   |
| `closeThresholdRatio` | Dismiss is now driven by inertia projection                   |
| `animationDuration`   | Use `springResponse` to control animation speed               |
| `projectionTime`      | Dismiss is now driven by inertia projection                   |
| `dragResistanceUp`    | Resistance now uses Apple's rubber band formula automatically |
| `dragResistanceDown`  | Resistance now uses Apple's rubber band formula automatically |

---

## [0.1.0] - 2025-10-20

### Added

- Initial release of Bootstrap Sheet
- Core bottom sheet component with smooth animations
- Touch gesture support with physics-based animations
- Keyboard navigation and ESC key support
- Focus trap and accessibility features (ARIA attributes, inert support)
- Backdrop with blur effect and static mode
- Data attributes API for declarative usage
- JavaScript API with show/hide/toggle/dispose methods
- Events system (show, shown, hide, hidden, slide)
- Sass variables for customization
- TypeScript definitions
- Comprehensive examples and documentation
- Support for Bootstrap 5.x

### Features

- Swipe-to-dismiss gestures with configurable thresholds
- Drag resistance for natural feel
- Velocity-based closing
- Multiple sheet instances support
- Auto-focus management
- Scrollable content support
- Static backdrop mode for confirmations
- Customizable animation duration

[0.5.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mironovsergey/bootstrap-sheet/releases/tag/v0.1.0
