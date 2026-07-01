import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@shezw/cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import { layeredTextLayerCount, resolveLayeredTextDepth, resolveLayeredTextLayers } from '../../src/demos/layeredText';

describe('layered text height and smoothness options', () => {
  it('maps smooth levels to deterministic layer counts', () => {
    expect(layeredTextLayerCount(24, 'min')).toBe(3);
    expect(layeredTextLayerCount(24, 'mid')).toBe(6);
    expect(layeredTextLayerCount(24, 'high')).toBe(12);
    expect(layeredTextLayerCount(24, 'max')).toBe(24);
    expect(layeredTextLayerCount(1, 'min')).toBe(2);
  });

  it('derives primitive depth and layers from textHeight and textSmooth', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'layered-text');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const cubeText = nodes.find(({ path }) => path === 'layered-text/cubeText')?.node;
    const htmlText = nodes.find(({ path }) => path === 'layered-text/htmlText')?.node;
    expect(cubeText?.kind).toBe('extrude');
    expect(htmlText?.kind).toBe('extrude');
    if (!cubeText || cubeText.kind === 'model' || !htmlText || htmlText.kind === 'model') return;

    expect(cubeText.textHeight).toBe(24);
    expect(cubeText.textSmooth).toBe('max');
    expect(resolveLayeredTextDepth(cubeText)).toBe(24);
    expect(resolveLayeredTextLayers(cubeText)).toBe(24);

    expect(htmlText.textHeight).toBe(16);
    expect(htmlText.textSmooth).toBe('high');
    expect(resolveLayeredTextDepth(htmlText)).toBe(16);
    expect(resolveLayeredTextLayers(htmlText)).toBe(8);
  });

  it('uses derived values in the resolved scene primitives', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'layered-text');
    expect(spec).toBeTruthy();
    const world = resolveScene(createSceneFromSpec(spec!));
    const cubeText = findWorldNode(world, 'layered-text/cubeText')?.node.primitive;
    const htmlText = findWorldNode(world, 'layered-text/htmlText')?.node.primitive;
    expect(cubeText?.kind).toBe('extrude');
    expect(htmlText?.kind).toBe('extrude');
    if (cubeText?.kind !== 'extrude' || htmlText?.kind !== 'extrude') return;

    expect(cubeText.depth).toBe(24);
    expect(cubeText.layers).toBe(24);
    expect(htmlText.depth).toBe(16);
    expect(htmlText.layers).toBe(8);
  });
});
