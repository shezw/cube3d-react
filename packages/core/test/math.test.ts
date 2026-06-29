import { describe, expect, it } from 'vitest';
import { multiplyMat4, resolveScene, transformPoint, transformToMat4, primitiveNode, boxPrimitive, groupNode } from '../src/index';

describe('@cube3d/core math', () => {
  it('composes local transforms into world space', () => {
    const scene = groupNode({
      id: 'root',
      transform: { position: { x: 10, y: 20, z: 30 } },
      children: [
        primitiveNode({
          id: 'box',
          primitive: boxPrimitive({ size: { x: 20, y: 10, z: 5 } }),
          transform: { position: { x: 5, y: 6, z: 7 } },
        }),
      ],
    });

    const world = resolveScene(scene);
    expect(world.children[0].worldBounds?.min).toEqual({ x: 15, y: 26, z: 37 });
    expect(world.children[0].worldBounds?.max).toEqual({ x: 35, y: 36, z: 42 });
  });

  it('multiplies matrices and transforms points', () => {
    const a = transformToMat4({ position: { x: 5, y: 0, z: 0 } });
    const b = transformToMat4({ position: { x: 0, y: 7, z: 0 } });
    expect(transformPoint(multiplyMat4(a, b), { x: 1, y: 2, z: 3 })).toEqual({ x: 6, y: 9, z: 3 });
  });
});
