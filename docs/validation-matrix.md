<!--
    cube3d-react
    docs/validation-matrix.md    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
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
| Build | `pnpm -r run build` | TypeScript, bundling, package exports, Vite production build | Runtime rendering accuracy |

## Required Gates

- Fast local gate: `pnpm -r test -- --run`
- Build gate: `pnpm -r run build`
- Browser gate: `pnpm test:browser`
- Full gate: `pnpm test:all`

## Browser Structure Policy

The browser test intentionally does not compare screenshots. It verifies structural rendering facts that matter to the library:

- The page root has non-zero area.
- `character`, `controller`, `camera`, and `island` each appear as one model.
- Model descendants produce visible face rectangles in Chromium.
- Key paths such as `character/head` and `character/controller` exist.
- Projected anchor points remain close after CSS 3D transforms.

If this test fails, prefer fixing the model or renderer over loosening thresholds.
