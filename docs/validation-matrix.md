<!--
    Cube3D React
    docs/validation-matrix.md

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
-->

# Validation Matrix

Cube3D validation is layered. A passing build is only a package health check; it is not proof that pseudo 3D rendering is correct.

## Validation Layers

| Layer | Command | Proves | Does Not Prove |
| --- | --- | --- | --- |
| Core model tests | `pnpm --filter @cube3d/core test -- --run` | Transform math, primitive descriptors, bounds, anchors, model validation, resolver behavior | Browser CSS projection or DOM visibility |
| Renderer contract tests | `pnpm --filter @shezw/cube3d test -- --run` | React DOM nodes, paths, anchors, face indexes, layer indexes, camera wrapper isolation, interaction payload metadata, core descriptor mapping | Pixel output or final example composition |
| Example model tests | `pnpm --filter @cube3d/react-example test -- --run` | Character/controller/cover scene models are semantic and anchor based | Browser layout, viewport scale, actual visual visibility |
| Browser structure tests | `pnpm test:browser` | Real Chromium can render the example; model objects are visible; key projected anchors remain aligned | Pixel-perfect design matching or screenshot regression |
| WebGL reference demos | `pnpm test:webgl-reference` | Cube3D demos preserve object-level projected geometry against simplified Three.js references generated from the same `DemoSpec`, and keep structural contracts | Production-grade visual parity with true 3D rendering |
| Build | `pnpm -r run build` | TypeScript, bundling, package exports, Vite production build | Runtime rendering accuracy |

## Required Gates

- Fast local gate: `pnpm -r test -- --run`
- Build gate: `pnpm -r run build`
- Browser gate: `pnpm test:browser`
- WebGL reference gate: `pnpm test:webgl-reference`
- Full gate: `pnpm test:all`

## Browser Structure Policy

The browser test intentionally does not compare screenshots. It verifies structural rendering facts that matter to the library:

- The page root has non-zero area.
- `character`, `controller`, `camera`, and `island` each appear as one model.
- Model descendants produce visible face rectangles in Chromium.
- Key paths such as `character/head` and `character/controller` exist.
- Projected anchor points remain close after CSS 3D transforms.

If this test fails, prefer fixing the model or renderer over loosening thresholds.

## WebGL Reference Policy

The WebGL reference gallery has a stricter fixture policy than ordinary examples:

- The only scene data source is `packages/react-example/src/demos/spec.ts`.
- `packages/react-example/src/demos/sceneFactory.ts` converts that spec into core `SceneNode` objects.
- Three.js and Cube3D renderers both consume the same generated scene graph.
- Playwright reads the same spec for required paths, model counts, primitive face counts, layer counts, anchor checks, and interaction checks.
- A source guard fails the browser test if the renderer files reintroduce per-demo hardcoded scene branches.
- Full-panel screenshot diff is diagnostic only. It is saved as an artifact for debugging, but it is not a pass/fail gate because background pixels can hide completely wrong object placement.
- The pass/fail gate compares each primitive path's projected bounds between WebGL and Cube3D: center distance, area ratio, width ratio, and height ratio.
- The Three.js reference camera uses the same screen-space Y direction as CSS/DOM (`y = 0` at the top). A Y-up WebGL camera would create an upside-down reference and invalidate the comparison.

This means the WebGL reference layer can expose three different classes of failure:

- A shared model/spec failure, where both renderers are faithfully showing a bad design.
- A WebGL reference projection failure, such as using the wrong axis mapping for Cube3D's height axis.
- A Cube3D renderer/runtime failure, such as a face intercepting an HTML button click.

Build success does not cover any of these cases.

## Camera And Interaction Gates

Camera and interaction are validated as library capabilities before they are used in complex cover scenes.

| Capability | Required Proof | Failure Means |
| --- | --- | --- |
| Core view math | `view-state.test.ts` proves view composition, interpolation, fit-to-bounds, and projected rect calculations with deterministic numeric assertions | The library cannot compute reusable view states for focus/callout/camera demos |
| React camera wrapper | `camera-interaction.test.tsx` proves `Camera3D` emits stable camera DOM attributes and changes only the camera wrapper transform while child object transforms remain present and unchanged | Camera motion may be secretly implemented by moving scene objects, which breaks model invariants |
| Camera motion behavior | `camera-interaction.test.tsx` proves reduced motion jumps directly and a new `moveTo` cancels the previous scheduled motion before applying the new target | Interactive pages can get stuck in competing camera animations or ignore accessibility settings |
| Interaction payload | `camera-interaction.test.tsx` proves face clicks produce stable `path`, `nodeId`, `primitiveKind`, `face`, and `faceIndex`; node clicks produce stable node payloads | A content system cannot reliably bind HTML interactions to model paths |
| Motion / feedback | `camera-interaction.test.tsx` proves `nodeTransformOverride` changes rendered transforms without mutating the core node, and motion presets return deterministic transform fragments | Interactive feedback may corrupt model data or become impossible to reason about |
| Timeline animation | `timeline.test.ts` proves pure timeline evaluation; `camera-interaction.test.tsx` proves `useTimeline3D` produces renderer-only overrides and respects reduced motion | Browser controls, hit testing, or visual timing in the example page |

These tests still do not prove a finished interactive webpage. They prove the library primitives needed by the later `camera-focus`, `camera-scroll`, `interactive-object`, `content-callout`, and `interactive-cover-scene` demos.

## Interactive Demo Gates

The interactive gallery demos validate the content-driven web-space layer:

| Demo | Proves | Key Browser Assertion |
| --- | --- | --- |
| `camera-focus` | Clicking an object changes the camera wrapper, not the object model transform | camera state changes; selected cube inline transform remains unchanged |
| `camera-scroll` | Scroll-like section state can drive camera state | active section changes to final section; base object transform remains unchanged |
| `timeline-animation` | Timeline controls can seek path-keyed transform animation without making scene objects interactive | clicking `Mid` updates `data-timeline-time`, cube z, door rotation, and marker scale; `Stop` resets to time 0 |
| `interactive-object` | Semantic model paths can drive content and camera state | clicking `switchBlock` updates selected path, content panel, and camera state |
| `character-reaction` | Scene state can move a whole model without breaking internal anchors | clicking prop sets `characterState=excited`; character anchors remain aligned |
| `content-callout` | 2D content can bind to projected 3D object bounds | selecting a feature updates `data-callout-path` and finite projected callout coordinates |
| `interactive-cover-scene` | Cover scene can combine camera, content, callout, and character reaction | clicking the prop updates selected path, camera state, callout, content panel, and character state |

These checks are intentionally structural and behavioral. They do not claim final art direction or game completeness.

## Spatial Modeling Gates

The spatial modeling demos add stricter checks for model-system behavior:

| Capability | Demo | Core Proof | Browser Proof | Failure Means |
| --- | --- | --- | --- | --- |
| Anchor orientation | `anchor-orientation` | `anchor-orientation.test.ts` checks attachment orientation across rotated anchors | Each case card renders matching WebGL and Cube3D rows with `before / after / stress` columns. Tests assert every state has helper plane/axis guides, expectation text, PASS result, matching template geometry, and only the intended attachment/transform variable changes | The library can place a part but cannot prove it is facing the correct way under rotation |
| Pivot / origin | `pivot-origin` | `pivot.test.ts` checks center, left-hinge, and top-hinge pivots; each declared pivot point must remain fixed under rotation | Each case card renders matching WebGL and Cube3D rows with `before / after / stress` columns. Tests assert every state has pivot plane/axis/pin guides, explicit expected behavior, PASS result, and the door/base/handle template is identical except `pivot` and rotation state | Visual rotation may be happening around an implicit CSS center instead of the modeled origin |
| World bounds / spatial query | `world-bounds` | `world-query.test.ts` checks translated, rotated, and nested scaled bounds; root bounds must contain every subcase | Each case card renders matching WebGL and Cube3D rows with `before / after / stress` columns. Tests assert every state has footprint and local-axis guides, explicit expected behavior, PASS result, and the stack geometry/material/local child transforms are identical while only the transform context changes | Objects may be visible, but the model layer cannot reliably query or reason about the scene after transforms |

These checks deliberately combine semantic tests and browser tests. A screenshot that looks acceptable is not enough: the model must expose stable paths, anchors, pivots, and bounds that a real project can query. Spatial comparison demos must be controlled comparisons: the same object template is reused, tests must prove which field is the experimental variable, and comparison states must appear together as separate small render tiles instead of being mixed into one 3D scene or hidden behind a selector.

For these spatial demos, WebGL is a complete correct control renderer for the same content, not a decorative single reference image. Each case card must render the same three mathematical states in both renderers:

- `before`: the object before the tested transform or relation is applied.
- `after`: the requested case state.
- `stress`: the same relationship under a stronger transform.

The page therefore contains a WebGL row and a Cube3D row with matching `before / after / stress` columns. WebGL proves what the same state should look like in a real 3D renderer; Cube3D is the system under test. The internal pass/fail assertions belong to Cube3D's model math: anchor alignment, pivot invariants, and bounds containment must still be computed from Cube3D's resolved scene rather than inferred from screenshots.
