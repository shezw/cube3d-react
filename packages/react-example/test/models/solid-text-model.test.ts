import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findWorldNode, resolveScene } from '@cube3d/core';
import { demoSpecs } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import { parseGlyphPathCommands, parseSolidTextGlyphs } from '../../src/demos/solidText';
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
    const solidWord = nodes.find(({ path }) => path === 'solid-text/solidWord')?.node;
    expect(solidWord?.kind).toBe('model');
    if (solidWord?.kind !== 'model') return;

    const glyphModels = nodes.filter(({ path, node }) => path.startsWith('solid-text/solidWord/glyph-') && node.kind === 'model');
    const top = nodes.filter(({ path }) => path.includes('/top-'));
    const bottom = nodes.filter(({ path }) => path.includes('/bottom-'));
    const sides = nodes.filter(({ path }) => path.includes('/side-'));

    expect(solidWord.solidText).toMatchObject({
      fontId: defaultTypefaceFontId,
      fontName: 'Press Start 2P',
      sourceIndex: 9,
      text: '012',
      fontSize: 58,
      depth: 18,
    });
    expect(glyphModels).toHaveLength(3);
    expect(top).toHaveLength(solidWord.solidText!.topFaces);
    expect(bottom).toHaveLength(solidWord.solidText!.bottomFaces);
    expect(sides).toHaveLength(solidWord.solidText!.sideFaces);
    expect(solidWord.solidText!.glyphs.map((glyph) => glyph.char)).toEqual(['0', '1', '2']);
    expect(solidWord.solidText!.glyphs.every((glyph) => glyph.closed)).toBe(true);
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
    const sides = flattenDesignNodes(spec!.root).filter(({ path, node }) => path.includes('/side-') && node.kind !== 'model');
    expect(sides.length).toBeGreaterThan(12);

    const byRole = (role: 'top' | 'bottom' | 'left' | 'right') => {
      const match = sides.find(({ node }) => node.kind !== 'model' && node.solidTextEdge?.role === role)?.node;
      expect(match?.kind).toBe('plane');
      if (!match || match.kind === 'model') throw new Error(`Missing ${role} side plane`);
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
    expect(bottom.transform?.position?.[2]).toBe(18);
    expect(left.transform?.rotation).toEqual([0, -90, 0]);
    expect(left.transform?.position?.[2]).toBe(0);
    expect(right.transform?.rotation).toEqual([0, 90, 0]);
    expect(right.transform?.position?.[2]).toBe(18);
    expect(top.size[0]).toBeCloseTo(top.solidTextEdge!.length, 3);
    expect(bottom.size[0]).toBeCloseTo(bottom.solidTextEdge!.length, 3);
    expect(left.size[1]).toBeCloseTo(left.solidTextEdge!.length, 3);
    expect(right.size[1]).toBeCloseTo(right.solidTextEdge!.length, 3);
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
    const solidWord = findWorldNode(world, 'solid-text/solidWord');
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
