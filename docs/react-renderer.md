# React Renderer

`@shezw/cube3d` is the renderer. It turns core `SceneNode` values into HTML elements and CSS transforms.

## Responsibilities

- Serialize core transforms to CSS.
- Render core primitive face descriptors as DOM faces.
- Preserve DOM contracts for tests and inspection:
  - `data-cube3d-node`
  - `data-cube3d-path`
  - `data-cube3d-model`
  - `data-cube3d-primitive`
  - `data-cube3d-face`
  - `data-cube3d-face-index`
  - `data-cube3d-anchor`
- Render camera/view wrappers with `data-cube3d-camera`.
- Emit stable interaction payloads from node and face events.
- Keep compatibility components usable: `Scene3D`, `Group3D`, `Box3D`, `Plane3D`, `Sprite3D`, `Extrude3D`.

## Model API

```tsx
import { boxPrimitive, modelNode, primitiveNode } from '@shezw/cube3d/core';
import { Model3D, Scene3D } from '@shezw/cube3d';

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
import { Box3D, Scene3D } from '@shezw/cube3d';

export function Demo() {
  return (
    <Scene3D perspective={900}>
      <Box3D id="box" size={{ x: 80, y: 80, z: 80 }} />
    </Scene3D>
  );
}
```

The JSX components internally create core primitives before rendering. Complex objects should use model definitions instead.

## Camera / View Wrapper

`Camera3D` is a CSS view wrapper. It changes the wrapper transform and does not mutate the scene model or object transforms.

```tsx
import { Camera3D, Model3D, Scene3D, Space3D, useCamera3D } from '@shezw/cube3d';

export function Demo({ model }: { model: SceneNode }) {
  const camera = useCamera3D({ position: { x: 0, y: 0, z: 0 }, zoom: 1 });

  return (
    <Scene3D perspective={100000}>
      <Camera3D state={camera.state}>
        <Space3D>
          <Model3D model={model} />
        </Space3D>
      </Camera3D>
    </Scene3D>
  );
}
```

Camera DOM contract:

- `data-cube3d-camera`
- `data-cube3d-camera-state`
- `data-cube3d-camera-motion`

`useCamera3D().moveTo()` supports duration, easing, interruption by a new motion, abort signals, and reduced-motion preference.

## Interaction Contract

`Model3D` and `Node3D` can emit semantic events without forcing users to inspect raw DOM.

```tsx
<Model3D
  model={scene}
  interactivePaths={['scene/cube']}
  onFaceClick={(event) => {
    console.log(event.path, event.face, event.faceIndex);
  }}
  onNodeClick={(event) => {
    console.log(event.path, event.nodeId, event.primitiveKind);
  }}
/>
```

The payload includes stable `path`, `nodeId`, optional `modelName`, `primitiveKind`, `face`, and `faceIndex`. `interactivePaths` restricts which model paths receive pointer events.

## Motion And Transform Overrides

`nodeTransformOverride` applies renderer-only feedback transforms. It must not mutate the core model.

```tsx
<Model3D
  model={scene}
  nodeTransformOverride={(node, path) => (
    path === selectedPath
      ? { position: { z: node.transform.position.z + 12 } }
      : undefined
  )}
/>
```

The renderer also exports deterministic motion preset helpers:

```ts
import { resolveMotionPreset } from '@shezw/cube3d';

const lift = resolveMotionPreset('hoverLift', { active: true });
```

Current presets include `hoverLift`, `pressDown`, `idleFloat`, `pulse`, `shake`, `reveal`, `openClose`, and `rotateLoop`. Presets return transform fragments; callers decide how to merge them with current model state.

## Timeline Animation

`useTimeline3D` evaluates a core `TimelineClip` over time and returns renderer-only transform overrides.

```tsx
import { Model3D, useTimeline3D } from '@shezw/cube3d';

function AnimatedScene({ model, clip }) {
  const timeline = useTimeline3D(clip);

  return (
    <>
      <Model3D model={model} nodeTransformOverride={timeline.nodeTransformOverride} />
      <button type="button" onClick={() => timeline.seek(500)}>Mid</button>
      <button type="button" onClick={timeline.play}>Play</button>
    </>
  );
}
```

The hook exposes `time`, `status`, `evaluation`, `play`, `pause`, `stop`, and `seek`. It honors reduced-motion preference by jumping to the end when playback starts. It does not mutate the core `SceneNode`; tests assert the DOM transform changes while the model transform stays intact.

## Per-Node Styling

`Model3D` accepts `nodeFaceContent` and `nodeFaceStyle` for renderer-only presentation details without changing the core model.

```tsx
<Model3D
  model={characterNode}
  nodeFaceContent={{ face: <span>:-)</span> }}
  nodeFaceStyle={(node) => node.id === 'face' ? { display: 'grid', placeItems: 'center' } : undefined}
/>
```
