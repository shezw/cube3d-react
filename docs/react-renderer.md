# React Renderer

`@cube3d/react` is the renderer. It turns core `SceneNode` values into HTML elements and CSS transforms.

## Responsibilities

- Serialize core transforms to CSS.
- Render core primitive face descriptors as DOM faces.
- Preserve DOM contracts for tests and inspection:
  - `data-cube3d-node`
  - `data-cube3d-model`
  - `data-cube3d-primitive`
  - `data-cube3d-face`
  - `data-cube3d-anchor`
- Keep compatibility components usable: `Scene3D`, `Group3D`, `Box3D`, `Plane3D`, `Sprite3D`, `Extrude3D`.

## Model API

```tsx
import { boxPrimitive, modelNode, primitiveNode } from '@cube3d/core';
import { Model3D, Scene3D } from '@cube3d/react';

const model = modelNode({
  id: 'demo-model',
  modelName: 'demo',
  children: [
    primitiveNode({
      id: 'body',
      primitive: boxPrimitive({ size: { x: 80, y: 80, z: 80 } }),
    }),
  ],
});

export function Demo() {
  return (
    <Scene3D model={model} />
  );
}
```

## JSX Compatibility API

```tsx
import { Box3D, Scene3D } from '@cube3d/react';

export function Demo() {
  return (
    <Scene3D perspective={900}>
      <Box3D id="box" size={{ x: 80, y: 80, z: 80 }} />
    </Scene3D>
  );
}
```

The JSX components internally create core primitives before rendering. Complex objects should use model definitions instead.

## Per-Node Styling

`Model3D` accepts `nodeFaceContent` and `nodeFaceStyle` for renderer-only presentation details without changing the core model.

```tsx
<Model3D
  model={characterNode}
  nodeFaceContent={{ face: <span>:-)</span> }}
  nodeFaceStyle={(node) => node.id === 'face' ? { display: 'grid', placeItems: 'center' } : undefined}
/>
```
