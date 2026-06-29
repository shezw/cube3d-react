/*
    cube3d-react
    packages/react-example/src/demos/solidText.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import type { DesignModelNode, DesignPrimitiveNode, DesignTransform, Rgba, Vec2Tuple, Vec3Tuple } from './spec';
import { defaultTypefaceFontId, getTypefaceFont, type TypefaceFontId, type TypefaceGlyph, type TypefaceJson } from './typefaceFonts';

export type Point = { x: number; y: number };

export type SolidTextPathCommand =
  | { type: 'moveTo'; point: Point }
  | { type: 'lineTo'; point: Point }
  | { type: 'quadraticCurveTo'; control: Point; point: Point }
  | { type: 'bezierCurveTo'; controlA: Point; controlB: Point; point: Point }
  | { type: 'closePath' };

export type SolidTextSideRole = 'top' | 'right' | 'bottom' | 'left' | 'diagonal' | 'curve-segment';

export type SolidTextContour = {
  points: Point[];
  area: number;
  role: 'outer' | 'inner';
  sourceCurveSegments: number;
};

export type SolidTextEdgeMetadata = {
  glyph: string;
  glyphIndex: number;
  contourIndex: number;
  edgeIndex: number;
  contour: 'outer' | 'inner';
  role: SolidTextSideRole;
  from: Vec2Tuple;
  to: Vec2Tuple;
  length: number;
  angle: number;
  color: Rgba;
};

export type SolidTextFaceMetadata = {
  role: 'top' | 'bottom';
  glyph: string;
  glyphIndex: number;
  path: string;
  viewBox: string;
  color: Rgba;
  contours: Array<'outer' | 'inner'>;
};

export type SolidTextGlyphMetadata = {
  char: string;
  glyphIndex: number;
  pathCommandCount: number;
  contourCount: number;
  outerContours: number;
  innerContours: number;
  edgeCount: number;
  sourceCurveSegments: number;
  closed: boolean;
};

export type SolidTextOptions = {
  text: string;
  fontId?: TypefaceFontId;
  fontSize: number;
  depth: number;
  transform?: DesignTransform;
  topColor?: Rgba;
  bottomColor?: Rgba;
  sideColor?: Rgba;
};

export type SolidTextMetadata = {
  fontId: string;
  fontName: string;
  sourceIndex: number;
  text: string;
  fontSize: number;
  depth: number;
  topFaces: number;
  bottomFaces: number;
  sideFaces: number;
  glyphs: SolidTextGlyphMetadata[];
};

export type ParsedSolidTextGlyph = {
  char: string;
  glyphIndex: number;
  pathCommands: SolidTextPathCommand[];
  contours: SolidTextContour[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  width: number;
  height: number;
};

export function createTypefaceSolidTextNode(id: string, options: SolidTextOptions): DesignModelNode {
  const font = getTypefaceFont(options.fontId ?? defaultTypefaceFontId);
  const topColor = options.topColor ?? [246, 213, 98, 1];
  const bottomColor = options.bottomColor ?? [118, 75, 48, 1];
  const sideColor = options.sideColor ?? [186, 118, 62, 1];
  const glyphs = parseSolidTextGlyphs(options.text, font.typeface, options.fontSize);

  let topFaces = 0;
  let bottomFaces = 0;
  let sideFaces = 0;

  const children: DesignModelNode[] = glyphs.map((glyph) => {
    const glyphChildren = createGlyphFaceNodes(glyph, options.depth, topColor, bottomColor, sideColor);
    topFaces += glyphChildren.filter((child) => child.solidTextFace?.role === 'top').length;
    bottomFaces += glyphChildren.filter((child) => child.solidTextFace?.role === 'bottom').length;
    sideFaces += glyphChildren.filter((child) => child.solidTextEdge).length;
    return {
      id: `glyph-${glyph.glyphIndex}-${safeCharId(glyph.char)}`,
      kind: 'model',
      modelName: 'solid-text-glyph',
      solidTextGlyph: {
        char: glyph.char,
        glyphIndex: glyph.glyphIndex,
      },
      children: glyphChildren,
    };
  });

  return {
    id,
    kind: 'model',
    modelName: 'solid-text',
    transform: options.transform,
    solidText: {
      fontId: font.id,
      fontName: font.label,
      sourceIndex: font.sourceIndex,
      text: options.text,
      fontSize: options.fontSize,
      depth: options.depth,
      topFaces,
      bottomFaces,
      sideFaces,
      glyphs: glyphs.map((glyph) => ({
        char: glyph.char,
        glyphIndex: glyph.glyphIndex,
        pathCommandCount: glyph.pathCommands.length,
        contourCount: glyph.contours.length,
        outerContours: glyph.contours.filter((contour) => contour.role === 'outer').length,
        innerContours: glyph.contours.filter((contour) => contour.role === 'inner').length,
        edgeCount: glyph.contours.reduce((sum, contour) => sum + contour.points.length - 1, 0),
        sourceCurveSegments: glyph.contours.reduce((sum, contour) => sum + contour.sourceCurveSegments, 0),
        closed: glyph.contours.every(isClosedContour),
      })),
    },
    children,
  };
}

export function parseSolidTextGlyphs(text: string, typeface: TypefaceJson, fontSize: number): ParsedSolidTextGlyph[] {
  const resolution = typeface.resolution ?? 1000;
  const scale = fontSize / resolution;
  const parsed: ParsedSolidTextGlyph[] = [];
  let cursor = 0;

  for (const [glyphIndex, char] of Array.from(text).entries()) {
    const glyph = typeface.glyphs[char] ?? typeface.glyphs[char.toUpperCase()] ?? typeface.glyphs['?'];
    if (!glyph) {
      cursor += fontSize * 0.5;
      continue;
    }

    const pathCommands = parseGlyphPathCommands(glyph);
    const rawContours = buildContours(pathCommands, scale, cursor);
    const contours = classifyContours(rawContours);

    if (contours.length > 0) {
      const bounds = contourBounds(contours);
      parsed.push({
        char,
        glyphIndex,
        pathCommands,
        contours,
        bounds,
        width: Math.max(1, bounds.maxX - bounds.minX),
        height: Math.max(1, bounds.maxY - bounds.minY),
      });
    }

    cursor += glyph.ha * scale;
  }

  return parsed;
}

export function parseGlyphPathCommands(glyph: TypefaceGlyph): SolidTextPathCommand[] {
  if (!glyph.o) return [];
  const tokens = glyph.o.match(/[mlqb]|-?\d+(?:\.\d+)?/gi) ?? [];
  const commands: SolidTextPathCommand[] = [];
  let index = 0;

  const readNumber = () => Number(tokens[index++]);
  const point = (x: number, y: number): Point => ({ x, y });

  while (index < tokens.length) {
    const token = tokens[index++].toLowerCase();
    if (token === 'm') {
      commands.push({ type: 'moveTo', point: point(readNumber(), readNumber()) });
      continue;
    }
    if (token === 'l') {
      commands.push({ type: 'lineTo', point: point(readNumber(), readNumber()) });
      continue;
    }
    if (token === 'q') {
      const end = point(readNumber(), readNumber());
      const control = point(readNumber(), readNumber());
      commands.push({ type: 'quadraticCurveTo', control, point: end });
      continue;
    }
    if (token === 'b') {
      const end = point(readNumber(), readNumber());
      const controlA = point(readNumber(), readNumber());
      const controlB = point(readNumber(), readNumber());
      commands.push({ type: 'bezierCurveTo', controlA, controlB, point: end });
    }
  }

  return commands;
}

function createGlyphFaceNodes(
  glyph: ParsedSolidTextGlyph,
  depth: number,
  topColor: Rgba,
  bottomColor: Rgba,
  sideColor: Rgba,
): DesignPrimitiveNode[] {
  const facePath = contoursToSvgPath(glyph.contours, glyph.bounds.minX, glyph.bounds.minY);
  const viewBox = `0 0 ${round(glyph.width)} ${round(glyph.height)}`;
  const contours = glyph.contours.map((contour) => contour.role);
  const nodes: DesignPrimitiveNode[] = [
    plane(
      `top-g${glyph.glyphIndex}-${safeCharId(glyph.char)}`,
      [glyph.width, glyph.height],
      [topColor[0], topColor[1], topColor[2], 0],
      [glyph.bounds.minX, glyph.bounds.minY, depth],
      {
        role: 'top',
        glyph: glyph.char,
        glyphIndex: glyph.glyphIndex,
        path: facePath,
        viewBox,
        color: topColor,
        contours,
      },
    ),
    plane(
      `bottom-g${glyph.glyphIndex}-${safeCharId(glyph.char)}`,
      [glyph.width, glyph.height],
      [bottomColor[0], bottomColor[1], bottomColor[2], 0],
      [glyph.bounds.minX, glyph.bounds.minY, 0],
      {
        role: 'bottom',
        glyph: glyph.char,
        glyphIndex: glyph.glyphIndex,
        path: facePath,
        viewBox,
        color: bottomColor,
        contours,
      },
    ),
  ];

  glyph.contours.forEach((contour, contourIndex) => {
    for (let edgeIndex = 0; edgeIndex < contour.points.length - 1; edgeIndex += 1) {
      const from = contour.points[edgeIndex];
      const to = contour.points[edgeIndex + 1];
      const length = distance(from, to);
      if (length < 0.2) continue;
      const angle = radiansToDegrees(Math.atan2(to.y - from.y, to.x - from.x));
      const sidePlane = sidePlaneTransform(from, to, length, depth);
      nodes.push(plane(
        `side-g${glyph.glyphIndex}-c${contourIndex}-e${edgeIndex}`,
        sidePlane.size,
        sideColor,
        sidePlane.position,
        undefined,
        {
          glyph: glyph.char,
          glyphIndex: glyph.glyphIndex,
          contourIndex,
          edgeIndex,
          contour: contour.role,
          role: classifySideRole(from, to, contour),
          from: [round(from.x), round(from.y)],
          to: [round(to.x), round(to.y)],
          length: round(length),
          angle: round(angle),
          color: sideColor,
        },
        { rotation: sidePlane.rotation, pivot: sidePlane.pivot },
      ));
    }
  });

  return nodes;
}

function buildContours(commands: SolidTextPathCommand[], scale: number, cursor: number) {
  const contours: Array<{ points: Point[]; sourceCurveSegments: number }> = [];
  let current: Point | undefined;
  let contourStart: Point | undefined;
  let currentContour: Point[] = [];
  let sourceCurveSegments = 0;

  const toPoint = (source: Point): Point => ({ x: cursor + source.x * scale, y: -source.y * scale });
  const finishContour = () => {
    const deduped = dedupePoints(currentContour);
    if (deduped.length > 2) {
      const first = deduped[0];
      const last = deduped[deduped.length - 1];
      if (!samePoint(first, last)) deduped.push({ ...first });
      contours.push({ points: deduped, sourceCurveSegments });
    }
    currentContour = [];
    sourceCurveSegments = 0;
  };

  for (const command of commands) {
    if (command.type === 'moveTo') {
      finishContour();
      current = toPoint(command.point);
      contourStart = current;
      currentContour.push(current);
      continue;
    }

    if (!current) continue;

    if (command.type === 'lineTo') {
      current = toPoint(command.point);
      currentContour.push(current);
      continue;
    }

    if (command.type === 'quadraticCurveTo') {
      const control = toPoint(command.control);
      const end = toPoint(command.point);
      for (let step = 1; step <= 8; step += 1) {
        currentContour.push(quadraticPoint(current, control, end, step / 8));
      }
      sourceCurveSegments += 1;
      current = end;
      continue;
    }

    if (command.type === 'bezierCurveTo') {
      const controlA = toPoint(command.controlA);
      const controlB = toPoint(command.controlB);
      const end = toPoint(command.point);
      for (let step = 1; step <= 12; step += 1) {
        currentContour.push(cubicPoint(current, controlA, controlB, end, step / 12));
      }
      sourceCurveSegments += 1;
      current = end;
      continue;
    }

    if (command.type === 'closePath' && contourStart) {
      currentContour.push(contourStart);
      finishContour();
      current = undefined;
      contourStart = undefined;
    }
  }

  finishContour();
  return contours;
}

function classifyContours(rawContours: Array<{ points: Point[]; sourceCurveSegments: number }>): SolidTextContour[] {
  const contours = rawContours
    .filter((contour) => contour.points.length > 3)
    .map((contour) => ({ ...contour, area: signedArea(contour.points), role: 'outer' as const }));

  return contours.map((contour, index) => {
    const probe = contour.points[0];
    const containers = contours.filter((other, otherIndex) => (
      otherIndex !== index
      && Math.abs(other.area) > Math.abs(contour.area)
      && pointInPolygon(probe, other.points)
    ));
    return {
      ...contour,
      role: containers.length % 2 === 0 ? 'outer' : 'inner',
    };
  });
}

function contourBounds(contours: SolidTextContour[]) {
  const points = contours.flatMap((contour) => contour.points);
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function contoursToSvgPath(contours: SolidTextContour[], offsetX: number, offsetY: number) {
  return contours.map((contour) => contour.points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${round(point.x - offsetX)} ${round(point.y - offsetY)}`
  )).join(' ') + ' Z').join(' ');
}

function quadraticPoint(start: Point, control: Point, end: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
    y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
  };
}

function cubicPoint(start: Point, controlA: Point, controlB: Point, end: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt ** 3 * start.x + 3 * mt * mt * t * controlA.x + 3 * mt * t * t * controlB.x + t ** 3 * end.x,
    y: mt ** 3 * start.y + 3 * mt * mt * t * controlA.y + 3 * mt * t * t * controlB.y + t ** 3 * end.y,
  };
}

function signedArea(points: Point[]) {
  let area = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index];
    const b = polygon[previous];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function classifySideRole(from: Point, to: Point, contour: SolidTextContour): SolidTextSideRole {
  if (contour.sourceCurveSegments > 0 && Math.abs(to.x - from.x) >= 0.01 && Math.abs(to.y - from.y) >= 0.01) return 'curve-segment';
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) < 0.01) return contour.role === 'outer' ? (dx >= 0 ? 'top' : 'bottom') : (dx >= 0 ? 'bottom' : 'top');
  if (Math.abs(dx) < 0.01) return contour.role === 'outer' ? (dy >= 0 ? 'right' : 'left') : (dy >= 0 ? 'left' : 'right');
  return 'diagonal';
}

function sidePlaneTransform(from: Point, to: Point, length: number, depth: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) < 0.01) {
    return {
      size: [length, depth] as Vec2Tuple,
      position: [Math.min(from.x, to.x), from.y, 0] as Vec3Tuple,
      rotation: [90, 0, 0] as Vec3Tuple,
      pivot: [0, 0, 0] as Vec3Tuple,
    };
  }
  if (Math.abs(dx) < 0.01) {
    return {
      size: [depth, length] as Vec2Tuple,
      position: [from.x, Math.min(from.y, to.y), 0] as Vec3Tuple,
      rotation: [0, -90, 0] as Vec3Tuple,
      pivot: [0, 0, 0] as Vec3Tuple,
    };
  }
  return {
    size: [length, depth] as Vec2Tuple,
    position: [from.x, from.y, 0] as Vec3Tuple,
    rotation: [90, 0, radiansToDegrees(Math.atan2(dy, dx))] as Vec3Tuple,
    pivot: [0, 0, 0] as Vec3Tuple,
  };
}

function dedupePoints(points: Point[]) {
  return points.reduce<Point[]>((result, point) => {
    const last = result.at(-1);
    if (!last || !samePoint(last, point)) result.push(point);
    return result;
  }, []);
}

function isClosedContour(contour: SolidTextContour) {
  return samePoint(contour.points[0], contour.points[contour.points.length - 1]);
}

function samePoint(a: Point, b: Point) {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function radiansToDegrees(value: number) {
  return (value / Math.PI) * 180;
}

function safeCharId(char: string) {
  return char.replace(/[^a-z0-9]/gi, (value) => `u${value.codePointAt(0)?.toString(16) ?? '0'}`);
}

function plane(
  id: string,
  size: Vec2Tuple,
  color: Rgba,
  position: Vec3Tuple,
  solidTextFace?: SolidTextFaceMetadata,
  solidTextEdge?: SolidTextEdgeMetadata,
  transform?: Pick<DesignTransform, 'rotation' | 'pivot'>,
): DesignPrimitiveNode {
  return {
    id,
    kind: 'plane',
    size,
    color,
    transform: {
      position,
      ...transform,
    },
    solidTextFace,
    solidTextEdge,
  };
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
