/*
    cube3d-react
    packages/react-example/scripts/generate-solid-fonts.mjs    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import fs from 'node:fs';
import opentype from 'opentype.js';

const fontConfigs = [
  { id: 'press-start-2p', index: 9, family: 'Press Start 2P', sourcePackage: '@fontsource/press-start-2p', file: '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff' },
  { id: 'silkscreen', index: 10, family: 'Silkscreen', sourcePackage: '@fontsource/silkscreen', file: '@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff' },
  { id: 'tiny5', index: 11, family: 'Tiny5', sourcePackage: '@fontsource/tiny5', file: '@fontsource/tiny5/files/tiny5-latin-400-normal.woff' },
  { id: 'micro-5', index: 12, family: 'Micro 5', sourcePackage: '@fontsource/micro-5', file: '@fontsource/micro-5/files/micro-5-latin-400-normal.woff' },
  { id: 'jersey-10', index: 13, family: 'Jersey 10', sourcePackage: '@fontsource/jersey-10', file: '@fontsource/jersey-10/files/jersey-10-latin-400-normal.woff' },
  { id: 'pixelify-sans', index: 17, family: 'Pixelify Sans', sourcePackage: '@fontsource/pixelify-sans', file: '@fontsource/pixelify-sans/files/pixelify-sans-latin-400-normal.woff' },
  { id: 'dotgothic16', index: 18, family: 'DotGothic16', sourcePackage: '@fontsource/dotgothic16', file: '@fontsource/dotgothic16/files/dotgothic16-latin-400-normal.woff' },
  { id: 'vt323', index: 19, family: 'VT323', sourcePackage: '@fontsource/vt323', file: '@fontsource/vt323/files/vt323-latin-400-normal.woff' },
];

const glyphChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function parseFont(sourceFile) {
  const filePath = import.meta.resolve(sourceFile).replace('file://', '');
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return opentype.parse(arrayBuffer);
}

function sampleQuad(p0, p1, p2, steps = 8) {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps;
    const mt = 1 - t;
    return [
      mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
      mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
    ];
  });
}

function sampleCubic(p0, p1, p2, p3, steps = 12) {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps;
    const mt = 1 - t;
    return [
      mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0],
      mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1],
    ];
  });
}

function pathToContours(path) {
  const contours = [];
  let current = [];
  let cursor = [0, 0];
  let start = [0, 0];

  const push = (point) => {
    const normalized = [round(point[0]), round(-point[1])];
    const last = current[current.length - 1];
    if (!last || Math.abs(last[0] - normalized[0]) > 0.001 || Math.abs(last[1] - normalized[1]) > 0.001) current.push(normalized);
  };

  const close = () => {
    if (current.length > 1) {
      const first = current[0];
      const last = current[current.length - 1];
      if (Math.abs(first[0] - last[0]) < 0.001 && Math.abs(first[1] - last[1]) < 0.001) current.pop();
      if (current.length > 2) contours.push(current);
    }
    current = [];
  };

  for (const command of path.commands) {
    if (command.type === 'M') {
      close();
      cursor = [command.x, command.y];
      start = cursor;
      push(cursor);
    } else if (command.type === 'L') {
      cursor = [command.x, command.y];
      push(cursor);
    } else if (command.type === 'Q') {
      const next = [command.x, command.y];
      for (const point of sampleQuad(cursor, [command.x1, command.y1], next)) push(point);
      cursor = next;
    } else if (command.type === 'C') {
      const next = [command.x, command.y];
      for (const point of sampleCubic(cursor, [command.x1, command.y1], [command.x2, command.y2], next)) push(point);
      cursor = next;
    } else if (command.type === 'Z') {
      cursor = start;
      close();
    }
  }
  close();
  return contours;
}

function normalizeGlyph(glyph, unitsPerEm) {
  const contours = pathToContours(glyph.path);
  if (contours.length === 0) return null;
  const points = contours.flat();
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));

  return {
    advance: round(glyph.advanceWidth / unitsPerEm, 5),
    width: round((maxX - minX) / unitsPerEm, 5),
    height: round((maxY - minY) / unitsPerEm, 5),
    contours: contours.map((contour) => contour.map(([x, y]) => [
      round((x - minX) / unitsPerEm, 5),
      round((y - minY) / unitsPerEm, 5),
    ])),
  };
}

function buildFont(config) {
  const font = parseFont(config.file);
  const glyphs = {};
  for (const char of glyphChars) {
    const glyph = font.charToGlyph(char);
    const normalized = normalizeGlyph(glyph, font.unitsPerEm);
    if (normalized) glyphs[char] = normalized;
  }
  return {
    id: config.id,
    candidateIndex: config.index,
    family: config.family,
    sourcePackage: config.sourcePackage,
    sourceFile: config.file,
    glyphs,
  };
}

function round(value, precision = 3) {
  return Number(value.toFixed(precision));
}

const fonts = fontConfigs.map(buildFont);
const source = `/*
    cube3d-react
    packages/react-example/src/demos/solidFonts.ts    2026-06-29

    Generated from @fontsource WOFF font files with opentype.js.
*/

export type SolidFontId = ${fonts.map((font) => `'${font.id}'`).join(' | ')};

export type SolidFontGlyph = {
  advance: number;
  width: number;
  height: number;
  contours: number[][][];
};

export type SolidFontDefinition = {
  id: SolidFontId;
  candidateIndex: number;
  family: string;
  sourcePackage: string;
  sourceFile: string;
  glyphs: Record<string, SolidFontGlyph>;
};

export const solidFonts = ${JSON.stringify(fonts, null, 2)} as const satisfies readonly SolidFontDefinition[];

export const defaultSolidFontId: SolidFontId = 'silkscreen';

export function getSolidFont(id: SolidFontId): SolidFontDefinition {
  const font = solidFonts.find((entry) => entry.id === id);
  if (!font) throw new Error(\`Unknown solid font: \${id}\`);
  return font;
}
`;

fs.writeFileSync(new URL('../src/demos/solidFonts.ts', import.meta.url), source);
console.log(fonts.map((font) => `${font.candidateIndex}. ${font.family}: ${Object.keys(font.glyphs).length} glyphs`).join('\n'));
