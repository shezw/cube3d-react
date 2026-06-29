/*
    cube3d-react
    packages/core/test/matrix-rotation.test.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { describe, expect, it } from 'vitest';
import { boxPrimitive, groupNode, primitiveNode, resolveScene, transformPoint, transformToMat4 } from '../src/index';

describe('@cube3d/core matrix rotation and scale', () => {
  it('transforms points with translate, rotate and scale in deterministic order', () => {
    const matrix = transformToMat4({
      position: { x: 10, y: 20, z: 30 },
      rotation: { z: 90 },
      scale: { x: 2, y: 3, z: 4 },
    });

    expectVec3Close(transformPoint(matrix, { x: 1, y: 2, z: 3 }), { x: 4, y: 22, z: 42 });
  });

  it('resolves rotated world bounds for nested nodes', () => {
    const scene = groupNode({
      id: 'root',
      transform: { position: { x: 50, y: 50, z: 0 }, rotation: { z: 90 } },
      children: [
        primitiveNode({
          id: 'box',
          primitive: boxPrimitive({ size: { x: 10, y: 20, z: 5 } }),
        }),
      ],
    });

    const box = resolveScene(scene).children[0];
    expectVec3Close(box.worldBounds!.min, { x: 30, y: 50, z: 0 });
    expectVec3Close(box.worldBounds!.max, { x: 50, y: 60, z: 5 });
  });
});

function expectVec3Close(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}
