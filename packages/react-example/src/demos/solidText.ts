/*
    cube3d-react
    packages/react-example/src/demos/solidText.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { defaultSolidFontId, getSolidFont, solidFonts, type SolidFontId } from './solidFonts';
import type { DesignModelNode, DesignPrimitiveNode, DesignTransform, Rgba, Vec2Tuple } from './spec';

export type Point2 = [number, number];

export type SolidTextContour = {
  id: string;
  points: Point2[];
};

export type PositionedSolidGlyph = {
  index: number;
  char: string;
  x: number;
  advance: number;
  width: number;
  height: number;
  contours: SolidTextContour[];
};

export type SolidTextOptions = {
  text: string;
  fontId?: SolidFontId;
  fontSize: number;
  depth: number;
  transform?: DesignTransform;
  projection?: Vec2Tuple;
  frontColor?: Rgba;
  backColor?: Rgba;
  edgeColor?: Rgba;
};

const defaultProjection: Vec2Tuple = [14, 10];
const defaultLetterSpacing = 0.08;

export const solidTextFontOptions = solidFonts.map((font) => ({
  id: font.id,
  candidateIndex: font.candidateIndex,
  family: font.family,
  sourcePackage: font.sourcePackage,
  sourceFile: font.sourceFile,
}));

export function createOutlineSolidTextNode(id: string, options: SolidTextOptions): DesignModelNode {
  const fontId = options.fontId ?? defaultSolidFontId;
  const font = getSolidFont(fontId);
  const projection = options.projection ?? defaultProjection;
  const frontColor = options.frontColor ?? [246, 213, 98, 1];
  const backColor = options.backColor ?? [118, 75, 48, 1];
  const edgeColor = options.edgeColor ?? [186, 118, 62, 1];
  const glyphLayout = createSolidTextLayout(options.text, options.fontSize, fontId);
  const topNodes = glyphLayout.map((glyph) => glyphFaceNode(`top-g${glyph.index}-${glyph.char}`, glyph, 'top', frontColor, options.depth, [0, 0]));
  const bottomNodes = glyphLayout.map((glyph) => glyphFaceNode(`bottom-g${glyph.index}-${glyph.char}`, glyph, 'bottom', backColor, 0, projection));
  const edgeNodes = glyphLayout.flatMap((glyph) => glyph.contours.flatMap((contour) => (
    contourSegments(contour.points).map((segment, edgeIndex) => (
      edgeFaceNode(`edge-g${glyph.index}-${contour.id}-${edgeIndex}`, segment, projection, options.depth / 2, edgeColor)
    ))
  )));

  return {
    id,
    kind: 'model',
    modelName: 'solid-text',
    transform: options.transform,
    solidText: {
      fontId,
      fontName: font.family,
      fontCandidateIndex: font.candidateIndex,
      fontSourcePackage: font.sourcePackage,
      fontSourceFile: font.sourceFile,
      text: options.text,
      fontSize: options.fontSize,
      depth: options.depth,
      projection,
      topFaces: topNodes.length,
      bottomFaces: bottomNodes.length,
      edgeFaces: edgeNodes.length,
      glyphs: glyphLayout.map((glyph) => ({
        char: glyph.char,
        contours: glyph.contours.length,
        edges: glyph.contours.reduce((sum, contour) => sum + contour.points.length, 0),
      })),
    },
    children: [...bottomNodes, ...edgeNodes, ...topNodes],
  };
}

export function createSolidTextLayout(text: string, fontSize: number, fontId: SolidFontId = defaultSolidFontId): PositionedSolidGlyph[] {
  const font = getSolidFont(fontId);
  let cursor = 0;
  return Array.from(text.toUpperCase()).flatMap((char, index) => {
    if (char === ' ') {
      cursor += fontSize * 0.6;
      return [];
    }
    const glyph = font.glyphs[char];
    if (!glyph) {
      cursor += fontSize * 0.6;
      return [];
    }
    const xOffset = cursor;
    cursor += (glyph.advance + defaultLetterSpacing) * fontSize;
    return [{
      index,
      char,
      x: xOffset,
      advance: glyph.advance * fontSize,
      width: glyph.width * fontSize,
      height: glyph.height * fontSize,
      contours: glyph.contours.map((contour, contourIndex) => ({
        id: `contour-${contourIndex}`,
        points: contour.map(([x, y]) => [roundGeometry(xOffset + x * fontSize), roundGeometry(y * fontSize)] as Point2),
      })),
    }];
  });
}

function glyphFaceNode(
  id: string,
  glyph: PositionedSolidGlyph,
  role: 'top' | 'bottom',
  color: Rgba,
  z: number,
  offset: Vec2Tuple,
): DesignPrimitiveNode {
  const contours = shiftContours(glyph.contours, offset);
  const bounds = contourBounds(contours);
  return {
    id,
    kind: 'sprite',
    size: [bounds.width, bounds.height],
    color: [color[0], color[1], color[2], 0],
    transform: { position: [bounds.x, bounds.y, z] },
    solidTextFace: {
      role,
      path: contoursToPath(contours, bounds.x, bounds.y),
      viewBox: [0, 0, bounds.width, bounds.height],
      color,
    },
  };
}

function edgeFaceNode(id: string, segment: [Point2, Point2], projection: Vec2Tuple, z: number, color: Rgba): DesignPrimitiveNode {
  const [[x1, y1], [x2, y2]] = segment;
  const contour: SolidTextContour = {
    id,
    points: [
      [x1, y1],
      [x2, y2],
      [x2 + projection[0], y2 + projection[1]],
      [x1 + projection[0], y1 + projection[1]],
    ].map(([x, y]) => [roundGeometry(x), roundGeometry(y)] as Point2),
  };
  const bounds = contourBounds([contour]);
  return {
    id,
    kind: 'sprite',
    size: [bounds.width, bounds.height],
    color: [color[0], color[1], color[2], 0],
    transform: { position: [bounds.x, bounds.y, z] },
    solidTextFace: {
      role: 'edge',
      path: contoursToPath([contour], bounds.x, bounds.y),
      viewBox: [0, 0, bounds.width, bounds.height],
      color,
    },
  };
}

function shiftContours(contours: SolidTextContour[], offset: Vec2Tuple): SolidTextContour[] {
  return contours.map((contour) => ({
    ...contour,
    points: contour.points.map(([x, y]) => [roundGeometry(x + offset[0]), roundGeometry(y + offset[1])] as Point2),
  }));
}

function contourSegments(points: Point2[]): Array<[Point2, Point2]> {
  return points.map((point, index) => [point, points[(index + 1) % points.length]]);
}

function contourBounds(contours: SolidTextContour[]) {
  const points = contours.flatMap((contour) => contour.points);
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  return {
    x: roundGeometry(minX),
    y: roundGeometry(minY),
    width: roundGeometry(maxX - minX),
    height: roundGeometry(maxY - minY),
  };
}

function contoursToPath(contours: SolidTextContour[], offsetX: number, offsetY: number) {
  return contours.map((contour) => (
    contour.points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${roundGeometry(x - offsetX)} ${roundGeometry(y - offsetY)}`).join(' ') + ' Z'
  )).join(' ');
}

function roundGeometry(value: number) {
  return Number(value.toFixed(3));
}
