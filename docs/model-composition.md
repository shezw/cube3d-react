# Model Composition

Complex Cube3D objects should be modeled as connected parts. The public pattern is:

1. Define primitives or nested models.
2. Give meaningful anchors to the parts.
3. Attach child anchors to parent anchors.
4. Resolve and validate the model.
5. Render the resolved node with `Model3D`.

## Character Pattern

```ts
import { attach, boxPrimitive, defineModel, part, resolveModel, validateModel } from '@shezw/cube3d/core';

const body = part('body', boxPrimitive({ size: { x: 84, y: 76, z: 76 } }), {
  anchors: {
    neck: { id: 'neck', position: { x: 42, y: 0, z: 76 } },
  },
});

const head = part('head', boxPrimitive({ size: { x: 68, y: 60, z: 54 } }), {
  anchors: {
    bottom: { id: 'bottom', position: { x: 34, y: 60, z: 0 } },
  },
});

export const characterModel = defineModel('character', [body, head], {
  attachments: [
    attach('head', 'bottom', 'body', 'neck'),
  ],
});

const issues = validateModel(characterModel);
if (issues.length > 0) throw new Error(issues[0].message);

export const characterNode = resolveModel(characterModel);
```

This guarantees the head is positioned by the design relationship, not by a hand-tuned sibling coordinate.

## Nested Models

The example controller is resolved as its own model and then used as a part inside the character model. The character tests assert:

- `head.bottom` aligns with `neck.top`
- `hatBrim.bottom` aligns with `head.top`
- `leftHand.grip` aligns with `controller.leftGrip`
- `rightHand.grip` aligns with `controller.rightGrip`

Those checks still pass when the whole character is translated or scaled.

## Current Limits

Attachment solving aligns anchor positions. It does not yet solve anchor rotation, IK, collision, clipping, or depth ordering. If a child has its own rotation, the resolver preserves that rotation and only computes the position needed to align the named anchor points.
