/*
    Cube3D React
    packages/core/test/resolver.test.ts
    Repository: https://github.com/shezw/cube3d-react
*/

import { describe, expect, it } from 'vitest';
import { attach, boxPrimitive, defineModel, part, resolveModel, resolveScene, type Vec3, type WorldNode } from '../src/index';

describe('@cube3d/core model resolver', () => {
  it('resolves attachment chains independently from attachment order', () => {
    const model = defineModel('chain', [
      part('root', boxPrimitive({ size: { x: 20, y: 20, z: 20 } }), {
        transform: { position: { x: 100, y: 50, z: 10 } },
        anchors: { out: { id: 'out', position: { x: 20, y: 0, z: 20 } } },
      }),
      part('middle', boxPrimitive({ size: { x: 10, y: 10, z: 10 } }), {
        anchors: {
          in: { id: 'in', position: { x: 0, y: 0, z: 0 } },
          out: { id: 'out', position: { x: 10, y: 0, z: 10 } },
        },
      }),
      part('leaf', boxPrimitive({ size: { x: 6, y: 6, z: 6 } }), {
        anchors: { in: { id: 'in', position: { x: 0, y: 0, z: 0 } } },
      }),
    ], {
      attachments: [
        attach('leaf', 'in', 'middle', 'out'),
        attach('middle', 'in', 'root', 'out'),
      ],
    });

    const world = resolveScene(resolveModel(model));
    expectVec3Close(anchor(world, 'middle', 'in'), anchor(world, 'root', 'out'));
    expectVec3Close(anchor(world, 'leaf', 'in'), anchor(world, 'middle', 'out'));
  });

  it('uses anchors on nested model parts', () => {
    const child = defineModel('child', [
      part('shell', boxPrimitive({ size: { x: 30, y: 20, z: 10 } })),
    ], {
      anchors: { socket: { id: 'socket', position: { x: 15, y: 10, z: 10 } } },
    });
    const childNode = resolveModel(child, 'child');
    const parent = defineModel('parent', [
      part('base', boxPrimitive({ size: { x: 80, y: 30, z: 20 } }), {
        anchors: { dock: { id: 'dock', position: { x: 60, y: 15, z: 20 } } },
      }),
      part('child', childNode, { anchors: childNode.anchors }),
    ], {
      attachments: [attach('child', 'socket', 'base', 'dock')],
    });

    const world = resolveScene(resolveModel(parent));
    expectVec3Close(anchor(world, 'child', 'socket'), anchor(world, 'base', 'dock'));
  });

  it('keeps anchor world positions aligned after applying a root model transform', () => {
    const model = defineModel('character', [
      part('body', boxPrimitive({ size: { x: 80, y: 40, z: 30 } }), {
        anchors: { head: { id: 'head', position: { x: 40, y: 0, z: 30 } } },
      }),
      part('head', boxPrimitive({ size: { x: 20, y: 20, z: 20 } }), {
        anchors: { bottom: { id: 'bottom', position: { x: 10, y: 20, z: 0 } } },
      }),
    ], {
      transform: { position: { x: 200, y: 100, z: 50 }, scale: { x: 1.5, y: 1.5, z: 1.5 } },
      attachments: [attach('head', 'bottom', 'body', 'head')],
    });

    const world = resolveScene(resolveModel(model));
    expectVec3Close(anchor(world, 'head', 'bottom'), anchor(world, 'body', 'head'));
  });
});

function anchor(world: WorldNode, nodeId: string, anchorId: string): Vec3 {
  const node = findWorldNode(world, nodeId);
  if (!node) throw new Error(`Missing node ${nodeId}`);
  const found = node.worldAnchors[anchorId];
  if (!found) throw new Error(`Missing anchor ${nodeId}.${anchorId}`);
  return found.position;
}

function findWorldNode(world: WorldNode, nodeId: string): WorldNode | undefined {
  if (world.node.id === nodeId) return world;
  for (const child of world.children) {
    const found = findWorldNode(child, nodeId);
    if (found) return found;
  }
  return undefined;
}

function expectVec3Close(actual: Vec3, expected: Vec3) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}
