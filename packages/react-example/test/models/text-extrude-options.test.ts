import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import { resolveTextExtrudeDepth, resolveTextExtrudeLayers, textLayerCount } from '../../src/demos/textExtrude';

describe('text extrusion height and smoothness options', () => {
  it('maps smooth levels to deterministic layer counts', () => {
    expect(textLayerCount(24, 'min')).toBe(3);
    expect(textLayerCount(24, 'mid')).toBe(6);
    expect(textLayerCount(24, 'high')).toBe(12);
    expect(textLayerCount(24, 'max')).toBe(24);
    expect(textLayerCount(1, 'min')).toBe(2);
  });

  it('derives primitive depth and layers from textHeight and textSmooth', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'text-extrude');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const cubeText = nodes.find(({ path }) => path === 'text-extrude/cubeText')?.node;
    const htmlText = nodes.find(({ path }) => path === 'text-extrude/htmlText')?.node;
    expect(cubeText?.kind).toBe('extrude');
    expect(htmlText?.kind).toBe('extrude');
    if (!cubeText || cubeText.kind === 'model' || !htmlText || htmlText.kind === 'model') return;

    expect(cubeText.textHeight).toBe(24);
    expect(cubeText.textSmooth).toBe('max');
    expect(resolveTextExtrudeDepth(cubeText)).toBe(24);
    expect(resolveTextExtrudeLayers(cubeText)).toBe(24);

    expect(htmlText.textHeight).toBe(16);
    expect(htmlText.textSmooth).toBe('high');
    expect(resolveTextExtrudeDepth(htmlText)).toBe(16);
    expect(resolveTextExtrudeLayers(htmlText)).toBe(8);
  });

  it('uses derived values in the resolved scene primitives', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'text-extrude');
    expect(spec).toBeTruthy();
    const world = resolveScene(createSceneFromSpec(spec!));
    const cubeText = findWorldNode(world, 'text-extrude/cubeText')?.node.primitive;
    const htmlText = findWorldNode(world, 'text-extrude/htmlText')?.node.primitive;
    expect(cubeText?.kind).toBe('extrude');
    expect(htmlText?.kind).toBe('extrude');
    if (cubeText?.kind !== 'extrude' || htmlText?.kind !== 'extrude') return;

    expect(cubeText.depth).toBe(24);
    expect(cubeText.layers).toBe(24);
    expect(htmlText.depth).toBe(16);
    expect(htmlText.layers).toBe(8);
  });
});
