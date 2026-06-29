/*
    Cube3D React
    packages/react-example/src/demos/typefaceFonts.ts
    Repository: https://github.com/shezw/cube3d-react
*/

import pressStart2p from '../assets/fonts/solid/press-start-2p.typeface';
import silkscreen from '../assets/fonts/solid/silkscreen.typeface';
import tiny5 from '../assets/fonts/solid/tiny5.typeface';
import micro5 from '../assets/fonts/solid/micro-5.typeface';
import jersey10 from '../assets/fonts/solid/jersey-10.typeface';
import dotgothic16 from '../assets/fonts/solid/dotgothic16.typeface';
import vt323 from '../assets/fonts/solid/vt323.typeface';
import pixelifySans from '../assets/fonts/solid/pixelify-sans.typeface';

export type TypefaceGlyph = {
  ha: number;
  x_min?: number;
  x_max?: number;
  o?: string;
};

export type TypefaceJson = {
  glyphs: Record<string, TypefaceGlyph>;
  resolution: number;
  familyName: string;
  sourceIndex: number;
  sourceFontId: string;
  sourcePackage: string;
  sourceFile: string;
  ascender?: number;
  descender?: number;
  boundingBox?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  underlineThickness?: number;
};

export type TypefaceFontOption = {
  id: string;
  label: string;
  sourceIndex: 9 | 10 | 11 | 12 | 13 | 17 | 18 | 19;
  typeface: TypefaceJson;
};

export const typefaceFontOptions = [
  { id: 'press-start-2p', label: 'Press Start 2P', sourceIndex: 9, typeface: pressStart2p as TypefaceJson },
  { id: 'silkscreen', label: 'Silkscreen', sourceIndex: 10, typeface: silkscreen as TypefaceJson },
  { id: 'tiny5', label: 'Tiny5', sourceIndex: 11, typeface: tiny5 as TypefaceJson },
  { id: 'micro-5', label: 'Micro 5', sourceIndex: 12, typeface: micro5 as TypefaceJson },
  { id: 'jersey-10', label: 'Jersey 10', sourceIndex: 13, typeface: jersey10 as TypefaceJson },
  { id: 'dotgothic16', label: 'DotGothic16', sourceIndex: 17, typeface: dotgothic16 as TypefaceJson },
  { id: 'vt323', label: 'VT323', sourceIndex: 18, typeface: vt323 as TypefaceJson },
  { id: 'pixelify-sans', label: 'Pixelify Sans', sourceIndex: 19, typeface: pixelifySans as TypefaceJson },
] as const satisfies readonly TypefaceFontOption[];

export type TypefaceFontId = (typeof typefaceFontOptions)[number]['id'];

export const defaultTypefaceFontId = typefaceFontOptions[0].id;

export function getTypefaceFont(id: string): TypefaceFontOption {
  return typefaceFontOptions.find((font) => font.id === id) ?? typefaceFontOptions[0];
}
