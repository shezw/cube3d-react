/*
    Cube3D React
    packages/core/test/pivot.test.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { describe, expect, it } from 'vitest';
import { attach, boxPrimitive, defineModel, part, primitiveNode, resolveModel, resolveScene, transformPoint, transformToMat4 } from '../src/index';

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

  it('keeps each declared origin fixed across center, left, and top pivot cases', () => {
    const cases = [
      {
        id: 'center',
        pivot: { x: 30, y: 20, z: 0 },
        expectedPivotWorld: { x: 130, y: 80, z: 0 },
      },
      {
        id: 'left',
        pivot: { x: 0, y: 20, z: 0 },
        expectedPivotWorld: { x: 100, y: 80, z: 0 },
      },
      {
        id: 'top',
        pivot: { x: 30, y: 0, z: 0 },
        expectedPivotWorld: { x: 130, y: 60, z: 0 },
      },
    ];

    for (const item of cases) {
      const matrix = transformToMat4({
        position: { x: 100, y: 60, z: 0 },
        pivot: item.pivot,
        rotation: { z: -45 },
      });

      expectVec3Close(transformPoint(matrix, item.pivot), item.expectedPivotWorld);
    }
  });

  it('attaches children to anchors after parent pivot rotation', () => {
    const model = defineModel('door-case', [
      part('door', boxPrimitive({ size: { x: 92, y: 48, z: 16 } }), {
        transform: {
          position: { x: 44, y: 28, z: 20 },
          rotation: { z: -46 },
          pivot: { x: 46, y: 24, z: 0 },
        },
        anchors: {
          handle: {
            id: 'handle',
            position: { x: 82, y: 24, z: 16 },
            normal: { x: 1, y: 0, z: 0 },
          },
        },
      }),
      part('handle', boxPrimitive({ size: { x: 12, y: 12, z: 12 } }), {
        anchors: {
          mount: {
            id: 'mount',
            position: { x: 6, y: 6, z: 6 },
          },
        },
      }),
    ], {
      attachments: [attach('handle', 'mount', 'door', 'handle')],
    });

    const world = resolveScene(resolveModel(model));
    const doorHandle = world.children[0].worldAnchors.handle;
    const handleMount = world.children[1].worldAnchors.mount;

    expectVec3Close(handleMount.position, doorHandle.position);
  });
});

function expectVec3Close(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}
