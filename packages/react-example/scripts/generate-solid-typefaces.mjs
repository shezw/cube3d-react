/*
    cube3d-react
    packages/react-example/scripts/generate-solid-typefaces.mjs    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import opentype from 'opentype.js';

const glyphSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -_!?.,:;+/&%#@()[]{}<>|';

const fonts = [
  {
    id: 'press-start-2p',
    label: 'Press Start 2P',
    index: 9,
    file: 'node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff',
  },
  {
    id: 'silkscreen',
    label: 'Silkscreen',
    index: 10,
    file: 'node_modules/@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff',
  },
  {
    id: 'tiny5',
    label: 'Tiny5',
    index: 11,
    file: 'node_modules/@fontsource/tiny5/files/tiny5-latin-400-normal.woff',
  },
  {
    id: 'micro-5',
    label: 'Micro 5',
    index: 12,
    file: 'node_modules/@fontsource/micro-5/files/micro-5-latin-400-normal.woff',
  },
  {
    id: 'jersey-10',
    label: 'Jersey 10',
    index: 13,
    file: 'node_modules/@fontsource/jersey-10/files/jersey-10-latin-400-normal.woff',
  },
  {
    id: 'dotgothic16',
    label: 'DotGothic16',
    index: 17,
    file: 'node_modules/@fontsource/dotgothic16/files/dotgothic16-latin-400-normal.woff',
  },
  {
    id: 'vt323',
    label: 'VT323',
    index: 18,
    file: 'node_modules/@fontsource/vt323/files/vt323-latin-400-normal.woff',
  },
  {
    id: 'pixelify-sans',
    label: 'Pixelify Sans',
    index: 19,
    file: 'node_modules/@fontsource/pixelify-sans/files/pixelify-sans-latin-400-normal.woff',
  },
];

const outDir = resolve('src/assets/fonts/solid');
mkdirSync(outDir, { recursive: true });

for (const fontSpec of fonts) {
  const font = parseFont(fontSpec.file);
  const json = toTypefaceJson(font, fontSpec);
  const outPath = resolve(outDir, `${fontSpec.id}.typeface.ts`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `export default ${JSON.stringify(json)} as const;\n`);
  console.log(`generated ${fontSpec.label}: ${Object.keys(json.glyphs).length} glyphs`);
}

function parseFont(path) {
  const buffer = readFileSync(resolve(path));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return opentype.parse(arrayBuffer);
}

function toTypefaceJson(font, fontSpec) {
  const glyphs = {};
  for (const char of Array.from(glyphSet)) {
    const glyph = font.charToGlyph(char);
    if (!glyph || glyph.unicode === undefined && char !== ' ') continue;
    glyphs[char] = {
      ha: round(glyph.advanceWidth ?? font.unitsPerEm),
      x_min: round(glyph.xMin ?? 0),
      x_max: round(glyph.xMax ?? glyph.advanceWidth ?? font.unitsPerEm),
      o: outlineForGlyph(glyph),
    };
  }
  glyphs['?'] ??= glyphs['0'] ?? { ha: font.unitsPerEm, x_min: 0, x_max: font.unitsPerEm, o: '' };

  return {
    glyphs,
    cssFontWeight: 'normal',
    cssFontStyle: 'normal',
    ascender: round(font.ascender ?? font.unitsPerEm),
    descender: round(font.descender ?? 0),
    underlinePosition: round(font.tables?.post?.underlinePosition ?? -100),
    underlineThickness: round(font.tables?.post?.underlineThickness ?? 50),
    boundingBox: {
      yMin: round(font.descender ?? 0),
      xMin: 0,
      yMax: round(font.ascender ?? font.unitsPerEm),
      xMax: round(maxAdvance(font)),
    },
    resolution: font.unitsPerEm,
    familyName: fontSpec.label,
    sourceIndex: fontSpec.index,
    sourceFontId: fontSpec.id,
    sourcePackage: `@fontsource/${fontSpec.id}`,
    sourceFile: fontSpec.file,
    lineHeight: round((font.ascender ?? font.unitsPerEm) - (font.descender ?? 0)),
  };
}

function outlineForGlyph(glyph) {
  const parts = [];
  let contourStart;
  let lastPoint;

  for (const command of glyph.path.commands) {
    if (command.type === 'M') {
      contourStart = { x: command.x, y: command.y };
      lastPoint = contourStart;
      parts.push('m', round(command.x), round(command.y));
      continue;
    }
    if (command.type === 'L') {
      lastPoint = { x: command.x, y: command.y };
      parts.push('l', round(command.x), round(command.y));
      continue;
    }
    if (command.type === 'Q') {
      lastPoint = { x: command.x, y: command.y };
      parts.push('q', round(command.x), round(command.y), round(command.x1), round(command.y1));
      continue;
    }
    if (command.type === 'C') {
      lastPoint = { x: command.x, y: command.y };
      parts.push('b', round(command.x), round(command.y), round(command.x1), round(command.y1), round(command.x2), round(command.y2));
      continue;
    }
    if (command.type === 'Z' && contourStart && lastPoint && !samePoint(contourStart, lastPoint)) {
      parts.push('l', round(contourStart.x), round(contourStart.y));
    }
  }

  return parts.join(' ');
}

function maxAdvance(font) {
  let max = font.unitsPerEm;
  for (let index = 0; index < font.glyphs.length; index += 1) {
    max = Math.max(max, font.glyphs.get(index)?.advanceWidth ?? 0);
  }
  return max;
}

function samePoint(a, b) {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
