# Cube3D React

Cube3D is an HTML-based pseudo 3D scene library for React. It uses CSS 3D transforms to render spatial objects while keeping every visible part as normal DOM, so interaction, events, selection, accessibility hooks, and styling remain simple.

It is not WebGL and not a true 3D engine. The library does not currently provide real depth sorting, collision, clipping, lighting, or camera-plane boundary handling.

## Packages

- `@shezw/cube3d`: public package for the React renderer.
- `@shezw/cube3d/core`: public subpath for pure model, math, scene graph, primitives, anchors, bounds, and validation.
- `@cube3d/react-example`: private workspace package used as an acceptance demo.

## Minimal Box

```tsx
import { Scene3D, Box3D } from '@shezw/cube3d';

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

## Model-Driven Character

```ts
import { attach, boxPrimitive, defineModel, part, resolveModel, validateModel } from '@shezw/cube3d/core';

const body = part('body', boxPrimitive({ size: { x: 80, y: 70, z: 70 } }), {
  anchors: { neck: { id: 'neck', position: { x: 40, y: 0, z: 70 } } },
});

const head = part('head', boxPrimitive({ size: { x: 60, y: 50, z: 50 } }), {
  anchors: { bottom: { id: 'bottom', position: { x: 30, y: 50, z: 0 } } },
});

export const characterModel = defineModel('character', [body, head], {
  attachments: [attach('head', 'bottom', 'body', 'neck')],
});

validateModel(characterModel);
export const characterNode = resolveModel(characterModel);
```

## Visual Demo

Run the acceptance scene:

```bash
pnpm dev
```

Then open `http://127.0.0.1:5173/`. The character, controller, camera, and island are model nodes, not scattered JSX piles.

## Verification

```bash
pnpm -r test -- --run
pnpm -r run build
pnpm test:browser
pnpm test:webgl-reference
```

The tests cover core transforms, bounds, primitive descriptors, anchors, scene validation, renderer DOM contracts, and example model composition.

For a full pre-release pass, run:

```bash
pnpm test:all
```

`@cube3d/react-example` is private and is used as the acceptance demo. Three.js is used only in that validation layer; the published `@shezw/cube3d` package renders with HTML and CSS transforms, not WebGL.
