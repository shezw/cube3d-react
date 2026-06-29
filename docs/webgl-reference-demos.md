<!--
    cube3d-react
    docs/webgl-reference-demos.md    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
-->

# WebGL Reference Demos

The demo gallery compares Cube3D candidates against simplified Three.js references. Three.js is only used in the example validation layer; it is not part of `@cube3d/core` or `@cube3d/react`.

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

Run:

```bash
pnpm test:webgl-reference
```

The test captures both panels, compares them with `pixelmatch`, and also checks DOM/model/path/anchor behavior. The image comparison is deliberately tolerant; it is a structural visual reference, not a pixel-perfect product screenshot gate.

Artifacts on failure include:

- reference image
- candidate image
- diff image
- geometry report JSON
