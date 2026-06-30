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

  it('reports finite containing bounds for translated, rotated, and nested scaled subcases', () => {
    const scene = groupNode({
      id: 'bounds-cases',
      children: [
        groupNode({
          id: 'translated',
          transform: { position: { x: 30, y: 40, z: 0 } },
          children: [
            primitiveNode({ id: 'base', primitive: boxPrimitive({ size: { x: 40, y: 30, z: 20 } }) }),
          ],
        }),
        groupNode({
          id: 'rotated',
          transform: { position: { x: 100, y: 40, z: 0 }, rotation: { z: -30 } },
          children: [
            primitiveNode({ id: 'base', primitive: boxPrimitive({ size: { x: 44, y: 34, z: 22 } }) }),
          ],
        }),
        groupNode({
          id: 'nestedScaled',
          transform: { position: { x: 170, y: 55, z: 0 }, rotation: { z: 18 }, scale: { x: 1.2, y: 1.2, z: 1.2 } },
          children: [
            groupNode({
              id: 'inner',
              transform: { rotation: { z: -12 }, scale: { x: 0.8, y: 0.8, z: 0.8 } },
              children: [
                primitiveNode({ id: 'base', primitive: boxPrimitive({ size: { x: 48, y: 36, z: 30 } }) }),
              ],
            }),
          ],
        }),
      ],
    });

    const report = getWorldBoundsReport(resolveScene(scene));
    const byPath = new Map(report.map((item) => [item.path, item]));
    const root = byPath.get('bounds-cases');
    const children = ['bounds-cases/translated', 'bounds-cases/rotated', 'bounds-cases/nestedScaled', 'bounds-cases/nestedScaled/inner'];

    expect(root?.bounds).toBeTruthy();
    for (const path of children) {
      const child = byPath.get(path);
      expect(child?.bounds, path).toBeTruthy();
      expectFiniteBounds(child!.bounds!);
      expectContains(root!.bounds!, child!.bounds!, path);
    }

    expect(byPath.get('bounds-cases/translated')?.center?.x).toBeLessThan(byPath.get('bounds-cases/rotated')?.center?.x ?? 0);
    expect(byPath.get('bounds-cases/rotated')?.center?.x).toBeLessThan(byPath.get('bounds-cases/nestedScaled')?.center?.x ?? 0);
  });
});

function expectFiniteBounds(bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }) {
  for (const value of [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z]) {
    expect(Number.isFinite(value)).toBe(true);
  }
}

function expectContains(
  parent: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  child: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  label: string,
) {
  expect(parent.min.x, `${label} min x`).toBeLessThanOrEqual(child.min.x);
  expect(parent.min.y, `${label} min y`).toBeLessThanOrEqual(child.min.y);
  expect(parent.min.z, `${label} min z`).toBeLessThanOrEqual(child.min.z);
  expect(parent.max.x, `${label} max x`).toBeGreaterThanOrEqual(child.max.x);
  expect(parent.max.y, `${label} max y`).toBeGreaterThanOrEqual(child.max.y);
  expect(parent.max.z, `${label} max z`).toBeGreaterThanOrEqual(child.max.z);
}
