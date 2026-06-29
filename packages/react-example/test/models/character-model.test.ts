import { describe, expect, it } from 'vitest';
import { normalizeTransform, resolveScene, validateModel, type Vec3, type WorldNode } from '@cube3d/core';
import { characterModel, createCharacterNode } from '../../src/scene/models';

describe('character model', () => {
  it('is valid and exposes one coherent character model node', () => {
    expect(validateModel(characterModel)).toEqual([]);

    const node = createCharacterNode();
    expect(node.kind).toBe('model');
    expect(node.modelName).toBe('character');
    expect(node.children?.map((child) => child.id)).toEqual(
      expect.arrayContaining(['body', 'neck', 'head', 'hatBrim', 'hatTop', 'leftArm', 'rightArm', 'leftHand', 'rightHand', 'controller']),
    );
  });

  it('aligns head, hat and controller anchors', () => {
    const world = resolveScene(createCharacterNode());

    assertVec3Equal(expectAnchor(world, 'head', 'bottom'), expectAnchor(world, 'neck', 'top'));
    assertVec3Equal(expectAnchor(world, 'hatBrim', 'bottom'), expectAnchor(world, 'head', 'top'));
    assertVec3Equal(expectAnchor(world, 'leftHand', 'grip'), expectAnchor(world, 'controller', 'leftGrip'));
    assertVec3Equal(expectAnchor(world, 'rightHand', 'grip'), expectAnchor(world, 'controller', 'rightGrip'));
  });

  it('keeps internal anchors aligned when the whole character is transformed', () => {
    const transformed = {
      ...createCharacterNode(),
      transform: normalizeTransform({ position: { x: 300, y: 80, z: 40 }, scale: { x: 1.4, y: 1.4, z: 1.4 } }),
    };
    const world = resolveScene(transformed);

    assertVec3Equal(expectAnchor(world, 'head', 'bottom'), expectAnchor(world, 'neck', 'top'));
    assertVec3Equal(expectAnchor(world, 'leftHand', 'grip'), expectAnchor(world, 'controller', 'leftGrip'));
  });
});

function expectAnchor(world: WorldNode, nodeId: string, anchorId: string): Vec3 {
  const node = findWorldNode(world, nodeId);
  if (!node) throw new Error(`Missing world node ${nodeId}.`);
  const anchor = node.worldAnchors[anchorId];
  if (!anchor) throw new Error(`Missing anchor ${nodeId}.${anchorId}.`);
  return anchor.position;
}

function findWorldNode(world: WorldNode, nodeId: string): WorldNode | undefined {
  if (world.node.id === nodeId) return world;
  for (const child of world.children) {
    const found = findWorldNode(child, nodeId);
    if (found) return found;
  }
  return undefined;
}

function assertVec3Equal(actual: Vec3, expected: Vec3) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}
