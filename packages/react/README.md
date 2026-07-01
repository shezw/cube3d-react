<!--
    Cube3D React
    packages/react/README.md    2026-07-01

     ______     __  __     ______     ______     __     __
    /\  ___\   /\ \_\ \   /\  ___\   /\___  \   /\ \  _ \ \
    \ \___  \  \ \  __ \  \ \  __\   \/_/  /__  \ \ \/ ".\ \
     \/\_____\  \ \_\ \_\  \ \_____\   /\_____\  \ \__/".~\_\
      \/_____/   \/_/\/_/   \/_____/   \/_____/   \/_/   \/_/.com

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
-->

# @shezw/cube3d

Cube3D is an HTML-based pseudo 3D scene library for React. It uses CSS 3D transforms to render spatial objects while every visible part remains normal DOM.

<p align="center">
  <img src="https://raw.githubusercontent.com/shezw/cube3d-react/main/docs/assets/cube3d-cover-scene-gallery.png" alt="Cube3D validation gallery showing a Three.js reference and HTML/CSS candidate cover scene" width="920">
</p>

It is not WebGL and not a true 3D engine. Cube3D does not provide real depth sorting, collision, clipping, lighting, or camera-plane boundary handling.

## Install

```bash
npm install @shezw/cube3d
```

## React Renderer

```tsx
import { Box3D, Scene3D } from '@shezw/cube3d';

export function Demo() {
  return (
    <Scene3D perspective={900}>
      <Box3D
        id="cube-a"
        size={{ x: 80, y: 80, z: 80 }}
        position={{ x: 120, y: 80, z: 40 }}
        material={{ kind: 'solid', rgba: [73, 84, 235, 1] }}
      />
    </Scene3D>
  );
}
```

## Core Model

```ts
import { attach, boxPrimitive, defineModel, part, resolveModel, validateModel } from '@shezw/cube3d/core';

const body = part('body', boxPrimitive({ size: { x: 80, y: 70, z: 70 } }), {
  anchors: { neck: { id: 'neck', position: { x: 40, y: 0, z: 70 } } },
});

const head = part('head', boxPrimitive({ size: { x: 60, y: 50, z: 50 } }), {
  anchors: { bottom: { id: 'bottom', position: { x: 30, y: 50, z: 0 } } },
});

const model = defineModel('character', [body, head], {
  attachments: [attach('head', 'bottom', 'body', 'neck')],
});

validateModel(model);
export const characterNode = resolveModel(model);
```

## Exports

- `@shezw/cube3d`: React renderer, camera, interaction, motion, and compatibility components.
- `@shezw/cube3d/core`: pure model, math, primitives, anchors, validation, view state, and timeline helpers.

## Validation

The project validates the renderer against model tests, browser structure checks, and a Three.js reference gallery generated from shared demo specs. Three.js is used only in the validation demo; the published package renders with HTML and CSS transforms.
