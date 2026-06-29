import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';

describe('solid text model', () => {
  it('builds Silkscreen text from front, back and edge geometry', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const solidWord = nodes.find(({ path }) => path === 'solid-text/solidWord')?.node;
    expect(solidWord?.kind).toBe('model');
    if (solidWord?.kind !== 'model') return;

    const front = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/front-'));
    const back = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/back-'));
    const edges = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/edge-'));

    expect(solidWord.solidText).toMatchObject({
      fontName: 'Silkscreen',
      text: 'CUBE3D',
      cellSize: 7,
      depth: 18,
    });
    expect(front).toHaveLength(solidWord.solidText!.frontRuns);
    expect(back).toHaveLength(solidWord.solidText!.backRuns);
    expect(edges).toHaveLength(solidWord.solidText!.edgeRuns);
    expect(solidWord.solidText!.glyphCells).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
    expect(nodes.filter(({ node }) => node.kind === 'extrude')).toHaveLength(0);
  });

  it('resolves as one model with finite projected bounds', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const world = resolveScene(createSceneFromSpec(spec!));
    const solidWord = findWorldNode(world, 'solid-text/solidWord');
    expect(solidWord?.node.modelName).toBe('solid-text');
    expect(solidWord?.worldBounds).toBeTruthy();
    expect(solidWord!.worldBounds!.max.x).toBeGreaterThan(solidWord!.worldBounds!.min.x);
    expect(solidWord!.worldBounds!.max.y).toBeGreaterThan(solidWord!.worldBounds!.min.y);
    expect(solidWord!.worldBounds!.max.z).toBeGreaterThan(solidWord!.worldBounds!.min.z);
  });
});
