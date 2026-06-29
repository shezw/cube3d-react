import { describe, expect, it } from 'vitest';
import { boxPrimitive, groupNode, primitiveNode, resolveScene, validateScene } from '../src/index';

describe('@cube3d/core scene graph', () => {
  it('resolves nested children and aggregate bounds', () => {
    const scene = groupNode({
      id: 'scene',
      children: [
        primitiveNode({ id: 'a', primitive: boxPrimitive({ size: { x: 10, y: 10, z: 10 } }) }),
        primitiveNode({
          id: 'b',
          primitive: boxPrimitive({ size: { x: 5, y: 5, z: 5 } }),
          transform: { position: { x: 20, y: 0, z: 0 } },
        }),
      ],
    });

    const world = resolveScene(scene);
    expect(world.children).toHaveLength(2);
    expect(world.worldBounds).toEqual({ min: { x: 0, y: 0, z: 0 }, max: { x: 25, y: 10, z: 10 } });
    expect(validateScene(scene)).toEqual([]);
  });
});
