/*
    cube3d-react
    packages/core/test/pivot.test.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { describe, expect, it } from 'vitest';
import { boxPrimitive, primitiveNode, resolveScene, transformPoint, transformToMat4 } from '../src/index';

describe('@cube3d/core pivot transforms', () => {
  it('keeps the declared pivot fixed under local rotation', () => {
    const matrix = transformToMat4({
      position: { x: 100, y: 60, z: 0 },
      pivot: { x: 0, y: 20, z: 0 },
      rotation: { z: 90 },
    });

    expectVec3Close(transformPoint(matrix, { x: 0, y: 20, z: 0 }), { x: 100, y: 80, z: 0 });
    expectVec3Close(transformPoint(matrix, { x: 60, y: 20, z: 0 }), { x: 100, y: 140, z: 0 });
  });

  it('resolves world bounds from pivot-rotated primitive corners', () => {
    const node = primitiveNode({
      id: 'door',
      primitive: boxPrimitive({ size: { x: 60, y: 40, z: 8 } }),
      transform: {
        position: { x: 100, y: 60, z: 0 },
        pivot: { x: 0, y: 20, z: 0 },
        rotation: { z: 90 },
      },
    });

    const world = resolveScene(node);
    expectVec3Close(world.worldBounds!.min, { x: 80, y: 80, z: 0 });
    expectVec3Close(world.worldBounds!.max, { x: 120, y: 140, z: 8 });
  });
});

function expectVec3Close(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}
