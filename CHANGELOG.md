# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mironovsergey/bootstrap-sheet/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mironovsergey/bootstrap-sheet/releases/tag/v0.1.0
