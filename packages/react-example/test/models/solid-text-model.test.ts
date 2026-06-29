import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import { createSolidTextLayout, solidTextFontOptions } from '../../src/demos/solidText';

describe('solid text model', () => {
  it('registers the selected font candidates as solid text fonts', () => {
    expect(solidTextFontOptions.map((font) => font.candidateIndex)).toEqual([9, 10, 11, 12, 13, 17, 18, 19]);
    expect(solidTextFontOptions.map((font) => font.id)).toEqual([
      'press-start-2p',
      'silkscreen',
      'tiny5',
      'micro-5',
      'jersey-10',
      'pixelify-sans',
      'dotgothic16',
      'vt323',
    ]);
    for (const font of solidTextFontOptions) {
      expect(font.sourcePackage).toMatch(/^@fontsource\//);
      expect(font.sourceFile).toMatch(/\.woff$/);
    }
  });

  it('builds outline text from a real font outline, not a handwritten glyph map', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const solidWord = nodes.find(({ path }) => path === 'solid-text/solidWord')?.node;
    expect(solidWord?.kind).toBe('model');
    if (solidWord?.kind !== 'model') return;

    const top = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/top-'));
    const bottom = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/bottom-'));
    const edges = nodes.filter(({ path }) => path.startsWith('solid-text/solidWord/edge-'));
    const expectedLayout = createSolidTextLayout('01', 84, 'silkscreen');

    expect(solidWord.solidText).toMatchObject({
      fontId: 'silkscreen',
      fontName: 'Silkscreen',
      fontCandidateIndex: 10,
      fontSourcePackage: '@fontsource/silkscreen',
      text: '01',
      fontSize: 84,
      depth: 18,
    });
    expect(top).toHaveLength(solidWord.solidText!.topFaces);
    expect(bottom).toHaveLength(solidWord.solidText!.bottomFaces);
    expect(edges).toHaveLength(solidWord.solidText!.edgeFaces);
    expect(solidWord.solidText!.glyphs).toEqual(expectedLayout.map((glyph) => ({
      char: glyph.char,
      contours: glyph.contours.length,
      edges: glyph.contours.reduce((sum, contour) => sum + contour.points.length, 0),
    })));
    expect(edges).toHaveLength(expectedLayout.reduce((sum, glyph) => sum + glyph.contours.reduce((inner, contour) => inner + contour.points.length, 0), 0));
    expect(nodes.filter(({ node }) => node.kind === 'extrude')).toHaveLength(0);
    expect(nodes.filter(({ path, node }) => path.startsWith('solid-text/solidWord/edge-') && node.kind !== 'sprite')).toHaveLength(0);
    expect(nodes.filter(({ node }) => node.kind !== 'model' && node.solidTextFace?.role === 'top')).toHaveLength(2);
    expect(nodes.filter(({ node }) => node.kind !== 'model' && node.solidTextFace?.role === 'bottom')).toHaveLength(2);
    expect(nodes.filter(({ node }) => node.kind !== 'model' && node.solidTextFace?.role === 'edge')).toHaveLength(edges.length);
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
