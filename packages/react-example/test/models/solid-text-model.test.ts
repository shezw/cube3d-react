import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import {
  createTypefaceSolidTextNode,
  parseGlyphPathCommands,
  parseSolidTextGlyphs,
  solidTextDemoCharacterSet,
  solidTextDemoDigits,
  solidTextDemoLowercase,
  solidTextDemoUppercase,
} from '../../src/demos/solidText';
import { defaultTypefaceFontId, getTypefaceFont, typefaceFontOptions } from '../../src/demos/typefaceFonts';

const expectedFonts = [
  ['press-start-2p', 'Press Start 2P', 9],
  ['silkscreen', 'Silkscreen', 10],
  ['tiny5', 'Tiny5', 11],
  ['micro-5', 'Micro 5', 12],
  ['jersey-10', 'Jersey 10', 13],
  ['dotgothic16', 'DotGothic16', 17],
  ['vt323', 'VT323', 18],
  ['pixelify-sans', 'Pixelify Sans', 19],
] as const;

describe('solid text model', () => {
  it('registers only the selected font candidates in the required order', () => {
    expect(typefaceFontOptions.map((font) => [font.id, font.label, font.sourceIndex])).toEqual(expectedFonts);
    expect(defaultTypefaceFontId).toBe('press-start-2p');

    const sourceFiles = [
      'src/demos/typefaceFonts.ts',
      'src/demos/spec.ts',
    ].map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'));
    expect(sourceFiles.join('\n')).not.toContain('Helvetiker');
  });

  it('builds selected typeface text from parsed top, bottom and side geometry', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const solidTextModels = [
      ['solidUppercase', solidTextDemoUppercase],
      ['solidLowercase', solidTextDemoLowercase],
      ['solidDigits', solidTextDemoDigits],
    ] as const;

    const glyphModels = nodes.filter(({ path, node }) => path.startsWith('solid-text/solid') && path.includes('/glyph-') && node.kind === 'model');
    const top = nodes.filter(({ path }) => path.includes('/top-'));
    const bottom = nodes.filter(({ path }) => path.includes('/bottom-'));
    const sides = nodes.filter(({ path }) => path.includes('/side-'));

    for (const [id, text] of solidTextModels) {
      const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
      expect(model?.kind).toBe('model');
      if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
      expect(model.solidText).toMatchObject({
        fontId: defaultTypefaceFontId,
        fontName: 'Press Start 2P',
        sourceIndex: 9,
        text,
        fontSize: 9,
        depth: 5,
      });
    }
    expect(glyphModels).toHaveLength(solidTextDemoCharacterSet.length);
    expect(top).toHaveLength(sumSolidTextFaces(nodes, 'topFaces'));
    expect(bottom).toHaveLength(sumSolidTextFaces(nodes, 'bottomFaces'));
    expect(sides).toHaveLength(sumSolidTextFaces(nodes, 'sideFaces'));
    expect(
      solidTextModels.map(([id]) => {
        const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
        if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
        return model.solidText!.glyphs.map((glyph) => glyph.char).join('');
      }).join(''),
    ).toBe(solidTextDemoCharacterSet);
    expect(solidTextModels.every(([id]) => {
      const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
      if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
      return model.solidText!.glyphs.every((glyph) => glyph.closed);
    })).toBe(true);
    expect(sides.length).toBeGreaterThan(12);
    expect(top.every(({ node }) => node.kind !== 'model' && node.kind === 'plane' && Boolean(node.solidTextFace))).toBe(true);
    expect(bottom.every(({ node }) => node.kind !== 'model' && node.kind === 'plane' && Boolean(node.solidTextFace))).toBe(true);
    expect(sides.every(({ node }) => node.kind !== 'model' && node.kind === 'plane' && Boolean(node.solidTextEdge))).toBe(true);
    expect(sides.every(({ node }) => node.kind !== 'model' && node.transform?.pivot?.join(',') === '0,0,0')).toBe(true);
    expect(nodes.filter(({ node }) => node.kind === 'extrude')).toHaveLength(0);
    expect(nodes.filter(({ node }) => node.kind === 'box' && node.id.startsWith('side-'))).toHaveLength(0);
  });

  it('attaches side planes to contour edges with edge-origin pivots', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const nodes = flattenDesignNodes(spec!.root);
    const solidWord = nodes.find(({ path }) => path === 'solid-text/solidUppercase')?.node;
    expect(solidWord?.kind).toBe('model');
    if (solidWord?.kind !== 'model') return;
    const depth = solidWord.solidText!.depth;
    const sides = nodes.filter(({ path, node }) => path.includes('/side-') && node.kind !== 'model');
    expect(sides.length).toBeGreaterThan(12);

    const byRole = (role: 'top' | 'bottom' | 'left' | 'right', contour: 'outer' | 'inner' = 'outer') => {
      const match = sides.find(({ node }) => node.kind !== 'model' && node.solidTextEdge?.role === role && node.solidTextEdge.contour === contour)?.node;
      expect(match?.kind).toBe('plane');
      if (!match || match.kind === 'model') throw new Error(`Missing ${contour} ${role} side plane`);
      return match;
    };
    const top = byRole('top');
    const bottom = byRole('bottom');
    const left = byRole('left');
    const right = byRole('right');

    for (const side of [top, bottom, left, right]) {
      expect(side.transform?.pivot).toEqual([0, 0, 0]);
    }
    expect(top.transform?.rotation).toEqual([90, 0, 0]);
    expect(top.transform?.position?.[2]).toBe(0);
    expect(bottom.transform?.rotation).toEqual([-90, 0, 0]);
    expect(bottom.transform?.position?.[2]).toBe(depth);
    expect(left.transform?.rotation).toEqual([0, -90, 0]);
    expect(left.transform?.position?.[2]).toBe(0);
    expect(right.transform?.rotation).toEqual([0, 90, 0]);
    expect(right.transform?.position?.[2]).toBe(depth);
    expect(top.size[0]).toBeCloseTo(top.solidTextEdge!.length, 3);
    expect(bottom.size[0]).toBeCloseTo(bottom.solidTextEdge!.length, 3);
    expect(left.size[1]).toBeCloseTo(left.solidTextEdge!.length, 3);
    expect(right.size[1]).toBeCloseTo(right.solidTextEdge!.length, 3);

    const innerTop = byRole('top', 'inner');
    const innerBottom = byRole('bottom', 'inner');
    const innerLeft = byRole('left', 'inner');
    const innerRight = byRole('right', 'inner');
    expect(innerTop.transform?.rotation).toEqual([-90, 0, 0]);
    expect(innerTop.transform?.position?.[2]).toBe(depth);
    expect(innerBottom.transform?.rotation).toEqual([90, 0, 0]);
    expect(innerBottom.transform?.position?.[2]).toBe(0);
    expect(innerLeft.transform?.rotation).toEqual([0, 90, 0]);
    expect(innerLeft.transform?.position?.[2]).toBe(depth);
    expect(innerRight.transform?.rotation).toEqual([0, -90, 0]);
    expect(innerRight.transform?.position?.[2]).toBe(0);
  });

  it('alternates side edge colors for legible pseudo-3d facets', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const sideNodes = flattenDesignNodes(spec!.root)
      .filter(({ path, node }) => path.includes('/side-') && node.kind !== 'model' && node.solidTextEdge?.contour === 'outer')
      .map(({ node }) => {
        if (node.kind === 'model') throw new Error('Unexpected model side');
        return node;
      })
      .sort((a, b) => a.solidTextEdge!.edgeIndex - b.solidTextEdge!.edgeIndex);
    const even = sideNodes.find((node) => node.solidTextEdge?.edgeIndex === 0);
    const odd = sideNodes.find((node) => node.solidTextEdge?.edgeIndex === 1);
    expect(even?.color).toEqual([186, 118, 62, 1]);
    expect(odd?.color).toEqual([145, 92, 48, 1]);
    expect(even?.solidTextEdge?.color).toEqual(even?.color);
    expect(odd?.solidTextEdge?.color).toEqual(odd?.color);
  });

  it('treats VT323 as a curve-heavy font with lower Cube3D curve sampling', () => {
    const font = getTypefaceFont('vt323');
    expect(font.solidCurveSegments).toBe(1);
    expect(font.solidPathCleanup).toEqual({ orthogonalize: true, axisSnapUnits: 10, minEdgeUnits: 8 });

    const defaultGlyphs = parseSolidTextGlyphs('012', font.typeface, 58);
    const sampledGlyphs = parseSolidTextGlyphs('012', font.typeface, 58, { curveSegments: font.solidCurveSegments });
    const cleanedGlyphs = parseSolidTextGlyphs('012', font.typeface, 58, {
      curveSegments: font.solidCurveSegments,
      pathCleanup: font.solidPathCleanup,
    });
    const defaultEdges = edgeCount(defaultGlyphs);
    const sampledEdges = edgeCount(sampledGlyphs);
    const cleanedEdges = edgeCount(cleanedGlyphs);
    const sourceCurves = cleanedGlyphs.reduce((sum, glyph) => sum + glyph.contours.reduce((inner, contour) => inner + contour.sourceCurveSegments, 0), 0);

    expect(sourceCurves).toBeGreaterThan(80);
    expect(sampledEdges).toBeLessThan(defaultEdges / 3);
    expect(cleanedEdges).toBeLessThan(sampledEdges);

    const model = createTypefaceSolidTextNode('vt323Word', {
      text: '012',
      fontId: 'vt323',
      fontSize: 58,
      depth: 18,
    });
    expect(model.solidText?.fontId).toBe('vt323');
    expect(model.solidText?.glyphs.reduce((sum, glyph) => sum + glyph.sourceCurveSegments, 0)).toBe(sourceCurves);
    expect(model.solidText?.glyphs.reduce((sum, glyph) => sum + glyph.edgeCount, 0)).toBe(cleanedEdges);
    expect(sideRoles(model)).not.toContain('curve-segment');
    expect(sideRoles(model)).not.toContain('diagonal');
  });

  it('parses glyph commands and closed contours from the actual font asset', () => {
    const font = getTypefaceFont(defaultTypefaceFontId);
    const zeroCommands = parseGlyphPathCommands(font.typeface.glyphs['0']);
    expect(zeroCommands.map((command) => command.type)).toContain('moveTo');
    expect(zeroCommands.map((command) => command.type)).toContain('lineTo');
    expect(zeroCommands.every((command) => commandCoordinates(command).every(Number.isFinite))).toBe(true);

    const glyphs = parseSolidTextGlyphs('012', font.typeface, 58);
    expect(glyphs).toHaveLength(3);
    expect(glyphs.map((glyph) => glyph.char)).toEqual(['0', '1', '2']);
    expect(glyphs[0].contours.length).toBeGreaterThanOrEqual(2);
    expect(glyphs[0].contours.some((contour) => contour.role === 'outer')).toBe(true);
    expect(glyphs[0].contours.some((contour) => contour.role === 'inner')).toBe(true);
    expect(glyphs[1].contours.length).toBeGreaterThanOrEqual(1);
    expect(glyphs[2].contours.length).toBeGreaterThanOrEqual(1);

    for (const glyph of glyphs) {
      for (const contour of glyph.contours) {
        expect(contour.points.length).toBeGreaterThanOrEqual(4);
        const first = contour.points[0];
        const last = contour.points.at(-1)!;
        expect(Math.abs(first.x - last.x)).toBeLessThan(0.001);
        expect(Math.abs(first.y - last.y)).toBeLessThan(0.001);
        for (let index = 0; index < contour.points.length - 1; index += 1) {
          const a = contour.points[index];
          const b = contour.points[index + 1];
          expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(0);
        }
      }
    }
  });

  it('resolves as one model with finite projected bounds', () => {
    const spec = demoSpecs.find((demo) => demo.id === 'solid-text');
    expect(spec).toBeTruthy();
    const world = resolveScene(createSceneFromSpec(spec!));
    const solidWord = findWorldNode(world, 'solid-text/solidUppercase');
    expect(solidWord?.node.modelName).toBe('solid-text');
    expect(solidWord?.worldBounds).toBeTruthy();
    expect(solidWord!.worldBounds!.max.x).toBeGreaterThan(solidWord!.worldBounds!.min.x);
    expect(solidWord!.worldBounds!.max.y).toBeGreaterThan(solidWord!.worldBounds!.min.y);
    expect(solidWord!.worldBounds!.max.z).toBeGreaterThan(solidWord!.worldBounds!.min.z);
  });
});

function commandCoordinates(command: ReturnType<typeof parseGlyphPathCommands>[number]) {
  if (command.type === 'moveTo' || command.type === 'lineTo') return [command.point.x, command.point.y];
  if (command.type === 'quadraticCurveTo') return [command.control.x, command.control.y, command.point.x, command.point.y];
  if (command.type === 'bezierCurveTo') return [
    command.controlA.x,
    command.controlA.y,
    command.controlB.x,
    command.controlB.y,
    command.point.x,
    command.point.y,
  ];
  return [];
}

function edgeCount(glyphs: ReturnType<typeof parseSolidTextGlyphs>) {
  return glyphs.reduce((sum, glyph) => sum + glyph.contours.reduce((inner, contour) => inner + contour.points.length - 1, 0), 0);
}

function sumSolidTextFaces(nodes: ReturnType<typeof flattenDesignNodes>, key: 'topFaces' | 'bottomFaces' | 'sideFaces') {
  return nodes.reduce((sum, { node }) => {
    if (node.kind !== 'model' || node.modelName !== 'solid-text') return sum;
    return sum + (node.solidText?.[key] ?? 0);
  }, 0);
}

function sideRoles(model: ReturnType<typeof createTypefaceSolidTextNode>) {
  return flattenDesignNodes(model)
    .filter(({ node }) => node.kind !== 'model' && Boolean(node.solidTextEdge))
    .map(({ node }) => {
      if (node.kind === 'model' || !node.solidTextEdge) throw new Error('Expected solid text side edge');
      return node.solidTextEdge.role;
    });
}
