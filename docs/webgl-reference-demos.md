<!--
    Cube3D React
    docs/webgl-reference-demos.md

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
-->

# WebGL Reference Demos

The demo gallery compares Cube3D candidates against simplified Three.js references. Three.js is only used in the example validation layer; it is not part of `@shezw/cube3d/core` or `@shezw/cube3d`.

The important rule is single source of truth: every WebGL reference scene and every Cube3D candidate scene is generated from `packages/react-example/src/demos/spec.ts`. The renderer layer is not allowed to maintain per-demo object coordinates. The shared pipeline is:

```text
DemoSpec -> createSceneFromSpec() -> ThreeReference
DemoSpec -> createSceneFromSpec() -> CubeCandidate
DemoSpec -> Playwright structure checks
```

`packages/react-example/test/browser/demo-gallery.spec.ts` includes a source guard that fails if `ThreeReference.tsx` or `CubeCandidate.tsx` reintroduces per-demo scene branches such as `demoId === ...` or `referenceBoxes()`.

## Demo Set

- `primitive-lab`: primitive faces, planes, sprites, extrusion layers.
- `transform-room`: nested transforms, rotation, scale.
- `anchor-assembly`: anchor-based head assembly.
- `nested-model`: character/controller nested model.
- `object-field`: multiple objects in one pseudo 3D field.
- `interaction-html`: DOM interaction inside pseudo 3D elements.
- `cover-scene`: composed acceptance scene.

Open a demo with `/?demo={id}`. The page renders a WebGL reference panel and a Cube3D candidate panel side by side.

## Validation

Run the WebGL reference acceptance suite:

```bash
pnpm test:webgl-reference
```

The test captures both panels, compares them with `pixelmatch`, and also checks DOM/model/path/anchor behavior. The image comparison is deliberately tolerant; it is a structural visual reference, not a pixel-perfect product screenshot gate.

The browser checks are not just "it compiles":

- `data-design-spec` and `data-design-source` prove both panels are attached to the active shared spec.
- `requiredPaths` from the spec must exist as `data-cube3d-path` DOM nodes.
- `modelCounts` from the spec must match `data-cube3d-model` occurrences.
- Box, plane, sprite, and extrude layer counts are checked from the spec.
- Anchor pairs from the spec are checked after browser projection.
- Interaction specs are checked with real Playwright hover, focus, and click events.

If a screenshot diff fails, fix the model, reference projection, or renderer mapping first. Do not raise thresholds to hide a known discrepancy.

Artifacts on failure include:

- reference image
- candidate image
- diff image
- geometry report JSON

For the complete pre-release verification path, run `pnpm test:all` from the workspace root. This includes package unit tests, production builds, browser structure checks, and this WebGL reference suite.
