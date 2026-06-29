# Core Model

`@cube3d/core` is a pure data and math package. It does not create React elements and does not output CSS strings.

## Responsibilities

- Vector and transform math: `Vec3`, `Transform3D`, `Mat4`.
- Scene graph nodes: `groupNode`, `primitiveNode`, `modelNode`.
- Primitives: `boxPrimitive`, `planePrimitive`, `spritePrimitive`, `extrudePrimitive`.
- Bounds and face descriptors: `getPrimitiveBounds`, `getPrimitiveFaces`, `resolveScene`.
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
