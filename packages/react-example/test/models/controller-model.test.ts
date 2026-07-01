import { describe, expect, it } from 'vitest';
import { resolveScene, validateModel } from '@shezw/cube3d/core';
import { controllerModel, createControllerNode } from '../../src/scene/models';

describe('controller model', () => {
  it('is a model with public grip anchors', () => {
    expect(validateModel(controllerModel)).toEqual([]);

    const node = createControllerNode();
    const world = resolveScene(node);

    expect(node.modelName).toBe('controller');
    expect(world.worldAnchors.leftGrip.position).toEqual({ x: 18, y: 20, z: 30 });
    expect(world.worldAnchors.rightGrip.position).toEqual({ x: 112, y: 22, z: 30 });
    expect(node.children?.map((child) => child.id)).toEqual(
      expect.arrayContaining(['shell', 'greenButton', 'orangeButton', 'blueButton', 'stick', 'cord']),
    );
  });
});
