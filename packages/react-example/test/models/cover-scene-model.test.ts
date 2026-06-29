import { describe, expect, it } from 'vitest';
import { resolveScene, validateModel, type WorldNode } from '@cube3d/core';
import { coverSceneModel, createCoverSceneNode } from '../../src/scene/models';

describe('cover scene model', () => {
  it('contains model-driven island, camera and character objects', () => {
    expect(validateModel(coverSceneModel)).toEqual([]);

    const scene = createCoverSceneNode();
    const world = resolveScene(scene);

    expect(scene.modelName).toBe('cover-scene');
    expect(findAllByModelName(world, 'character')).toHaveLength(1);
    expect(findAllByModelName(world, 'controller')).toHaveLength(1);
    expect(findAllByModelName(world, 'camera')).toHaveLength(1);
    expect(findAllByModelName(world, 'island')).toHaveLength(1);
    expect(world.worldBounds?.max.z).toBeGreaterThan(180);
  });
});

function findAllByModelName(world: WorldNode, modelName: string): WorldNode[] {
  const matches = world.node.modelName === modelName ? [world] : [];
  return matches.concat(...world.children.map((child) => findAllByModelName(child, modelName)));
}
