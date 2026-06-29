/*
    Cube3D React
    packages/core/test/world-query.test.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { describe, expect, it } from 'vitest';
import { boxPrimitive, findWorldNode, getWorldBoundsReport, groupNode, primitiveNode, resolveScene } from '../src/index';

describe('@cube3d/core world bounds query', () => {
  it('flattens world nodes with stable paths and bounds reports', () => {
    const scene = groupNode({
      id: 'field',
      children: [
        primitiveNode({
          id: 'cubeA',
          primitive: boxPrimitive({ size: { x: 40, y: 30, z: 20 } }),
          transform: { position: { x: 10, y: 20, z: 5 } },
        }),
        groupNode({
          id: 'cluster',
          transform: { position: { x: 100, y: 40, z: 0 } },
          children: [
            primitiveNode({
              id: 'cubeB',
              primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
            }),
          ],
        }),
      ],
    });

    const world = resolveScene(scene);
    const cubeB = findWorldNode(world, 'field/cluster/cubeB');
    const report = getWorldBoundsReport(world);

    expect(cubeB?.worldBounds?.min.x).toBeCloseTo(100, 4);
    expect(cubeB?.worldBounds?.max.z).toBeCloseTo(20, 4);
    expect(report.map((item) => item.path)).toEqual(['field', 'field/cubeA', 'field/cluster', 'field/cluster/cubeB']);
    expect(report.find((item) => item.path === 'field')?.size?.x).toBeCloseTo(110, 4);
    expect(report.find((item) => item.path === 'field/cubeA')?.center?.x).toBeCloseTo(30, 4);
  });
});
