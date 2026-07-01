# Core Model

`@cube3d/core` is a pure data and math package. It does not create React elements and does not output CSS strings.

## Responsibilities

- Vector and transform math: `Vec3`, `Transform3D`, `Mat4`.
- Scene graph nodes: `groupNode`, `primitiveNode`, `modelNode`.
- Primitives: `boxPrimitive`, `planePrimitive`, `spritePrimitive`, `extrudePrimitive`.
- Bounds and face descriptors: `getPrimitiveBounds`, `getPrimitiveFaces`, `resolveScene`.
- View math: `ViewState`, `composeViewTransform`, `interpolateViewState`, `fitViewToBounds`, `projectBoundsToRect`.
- Timeline math: `TimelineClip`, `evaluateTimeline`, `resolveTimelineState`.
- Model composition: `defineModel`, `part`, `attach`, `resolveModel`.
- Validation: `validateModel`, `validateScene`.

## Primitive Example

```ts
import { boxPrimitive, getPrimitiveFaces, primitiveNode, resolveScene } from '@cube3d/core';

const cube = primitiveNode({
  id: 'cube-a',
  primitive: boxPrimitive({
    size: { x: 80, y: 80, z: 80 },
    material: { kind: 'solid', rgba: [73, 84, 235, 1] },
  }),
  transform: { position: { x: 100, y: 80, z: 40 } },
});

const faces = getPrimitiveFaces(cube.primitive);
const world = resolveScene(cube);
```

`faces` are semantic descriptors. The React package decides how to serialize them to CSS.

## Anchors

Anchors are named local points on a part or model. They let a design say "head.bottom attaches to neck.top" instead of relying on sibling coordinates.

```ts
import { attach, boxPrimitive, defineModel, part, resolveModel } from '@cube3d/core';

const neck = part('neck', boxPrimitive({ size: { x: 20, y: 20, z: 20 } }), {
  anchors: { top: { id: 'top', position: { x: 10, y: 0, z: 20 } } },
});

const head = part('head', boxPrimitive({ size: { x: 50, y: 50, z: 50 } }), {
  anchors: { bottom: { id: 'bottom', position: { x: 25, y: 50, z: 0 } } },
});

const model = defineModel('character', [neck, head], {
  attachments: [attach('head', 'bottom', 'neck', 'top')],
});

const node = resolveModel(model);
```

## Validation

Use `validateModel(model)` before rendering external or generated designs. Current validation checks invalid primitive sizes, empty models, duplicate part ids, missing parts, and missing anchors.

## View Math

Core view helpers are pure math. They do not know about CSS, DOM, React, or Three.js.

```ts
import { createBounds, fitViewToBounds, projectBoundsToRect } from '@cube3d/core';

const bounds = createBounds({ x: 0, y: 0, z: 0 }, { x: 240, y: 120, z: 80 });
const view = fitViewToBounds(bounds, {
  viewport: { x: 520, y: 360 },
  padding: 32,
});
const projected = projectBoundsToRect(bounds, view);
```

This proves the model layer can calculate focus-style view states and projected rectangles. It does not prove browser CSS rendering; the React renderer and browser tests cover that separately.

## Timeline Math

Core timeline helpers are pure calculations. They do not start timers, mutate scene nodes, or output CSS.

```ts
import { evaluateTimeline, type TimelineClip } from '@cube3d/core';

const clip: TimelineClip = {
  id: 'intro',
  duration: 1000,
  tracks: [
    {
      targetPath: 'scene/cube',
      keyframes: [
        { at: 0, transform: { position: { z: 0 } } },
        { at: 500, transform: { position: { z: 80 } } },
        { at: 1000, transform: { position: { z: 0 } } },
      ],
    },
  ],
};

const frame = evaluateTimeline(clip, 500);
```

`frame.transforms` is keyed by model path. The React renderer can use those transform fragments as renderer-only overrides while the original core model remains unchanged.
