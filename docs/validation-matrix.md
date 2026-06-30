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
| Renderer contract tests | `pnpm --filter @cube3d/react test -- --run` | React DOM nodes, paths, anchors, face indexes, layer indexes, core descriptor mapping | Pixel output or final example composition |
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

## Spatial Modeling Gates

The spatial modeling demos add stricter checks for model-system behavior:

| Capability | Demo | Core Proof | Browser Proof | Failure Means |
| --- | --- | --- | --- | --- |
| Anchor orientation | `anchor-orientation` | `anchor-orientation.test.ts` checks attachment orientation across rotated anchors | Each case renders as its own URL/screenshot: `?demo=anchor-orientation&case=positionOnlyControl`, `orientationAttach`, or `orientationWithParentTransform`. Tests assert non-selected cases are absent, geometry/colors/transforms/anchors match the template, and only attachment mode or parent transform condition changes | The library can place a part but cannot prove it is facing the correct way under rotation |
| Pivot / origin | `pivot-origin` | `pivot.test.ts` checks center, left-hinge, and top-hinge pivots; each declared pivot point must remain fixed under rotation | Each case renders as its own URL/screenshot: `centerPivotCase`, `leftHingeCase`, or `topHingeCase`. Tests assert non-selected cases are absent and the door/base/handle template is identical except `pivot` | Visual rotation may be happening around an implicit CSS center instead of the modeled origin |
| World bounds / spatial query | `world-bounds` | `world-query.test.ts` checks translated, rotated, and nested scaled bounds; root bounds must contain every subcase | Each case renders as its own URL/screenshot: `translatedStack`, `rotatedStack`, or `nestedScaledStack`. Tests assert non-selected cases are absent and the stack geometry/material/local child transforms are identical while only the transform context changes | Objects may be visible, but the model layer cannot reliably query or reason about the scene after transforms |

These checks deliberately combine semantic tests and browser tests. A screenshot that looks acceptable is not enough: the model must expose stable paths, anchors, pivots, and bounds that a real project can query. Spatial comparison demos must be controlled comparisons: the same object template is reused, tests must prove which field is the experimental variable, and each comparison state must render in a separate image instead of combining all variants into one scene.
