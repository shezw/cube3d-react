# Visual Demo

The visual demo in `packages/react-example` is an acceptance scene for the library architecture.

## Included Objects

- Thick island base
- Grid floor
- Extruded text
- Character model
- Nested controller model
- Camera model
- Tree ring
- Small props
- Right-side 2D title block

## Model-Driven Objects

The main complex objects live in `packages/react-example/src/scene/models.ts`:

- `characterModel`
- `controllerModel`
- `cameraModel`
- `islandModel`
- `coverSceneModel`

The React components consume resolved model nodes:

```tsx
import { Model3D, Scene3D } from '@shezw/cube3d';
import { createCoverSceneNode } from './scene/models';

export function Cover() {
  return (
    <Scene3D perspective={1150}>
      <Model3D model={createCoverSceneNode()} />
    </Scene3D>
  );
}
```

## Verification

The DOM acceptance test checks that the character appears once as a model:

```ts
expect(html.match(/data-cube3d-model="character"/g)).toHaveLength(1);
```

The model tests check anchor alignment directly, so the scene is not accepted just because a screenshot happens to look close.
