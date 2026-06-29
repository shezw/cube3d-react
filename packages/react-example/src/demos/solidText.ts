/*
    cube3d-react
    packages/react-example/src/demos/solidText.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import type { DesignModelNode, DesignPrimitiveNode, DesignTransform, Rgba, Vec2Tuple, Vec3Tuple } from './spec';

type Cell = { col: number; row: number };
type Run = { axis: 'x' | 'y'; col: number; row: number; length: number };

export type SolidTextOptions = {
  text: string;
  cellSize: number;
  depth: number;
  transform?: DesignTransform;
  frontColor?: Rgba;
  backColor?: Rgba;
  edgeColor?: Rgba;
};

const glyphs: Record<string, string[]> = {
  '3': [
    '11110',
    '00001',
    '00001',
    '01110',
    '00001',
    '00001',
    '11110',
  ],
  B: [
    '11110',
    '10001',
    '10001',
    '11110',
    '10001',
    '10001',
    '11110',
  ],
  C: [
    '11111',
    '10000',
    '10000',
    '10000',
    '10000',
    '10000',
    '11111',
  ],
  D: [
    '11110',
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '11110',
  ],
  E: [
    '11111',
    '10000',
    '10000',
    '11110',
    '10000',
    '10000',
    '11111',
  ],
  U: [
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '11111',
  ],
};

export function createSilkscreenSolidTextNode(id: string, options: SolidTextOptions): DesignModelNode {
  const frontColor = options.frontColor ?? [246, 213, 98, 1];
  const backColor = options.backColor ?? [130, 87, 54, 1];
  const edgeColor = options.edgeColor ?? [176, 109, 58, 1];
  const cells = layoutCells(options.text);
  const frontRuns = filledRuns(cells);
  const topEdges = horizontalEdgeRuns(cells, -1);
  const bottomEdges = horizontalEdgeRuns(cells, 1);
  const leftEdges = verticalEdgeRuns(cells, -1);
  const rightEdges = verticalEdgeRuns(cells, 1);
  const edgeRuns = [...topEdges, ...bottomEdges, ...leftEdges, ...rightEdges];

  return {
    id,
    kind: 'model',
    modelName: 'solid-text',
    transform: options.transform,
    solidText: {
      fontName: 'Silkscreen',
      text: options.text,
      cellSize: options.cellSize,
      depth: options.depth,
      frontRuns: frontRuns.length,
      backRuns: frontRuns.length,
      edgeRuns: edgeRuns.length,
      glyphCells: cells.length,
    },
    children: [
      ...frontRuns.map((run) => plane(
        `front-r${run.row}-c${run.col}-n${run.length}`,
        [run.length * options.cellSize, options.cellSize],
        frontColor,
        [run.col * options.cellSize, run.row * options.cellSize, options.depth],
      )),
      ...frontRuns.map((run) => plane(
        `back-r${run.row}-c${run.col}-n${run.length}`,
        [run.length * options.cellSize, options.cellSize],
        backColor,
        [run.col * options.cellSize, run.row * options.cellSize, 0],
      )),
      ...topEdges.map((run) => horizontalEdgeBox('top', run, options.cellSize, options.depth, edgeColor)),
      ...bottomEdges.map((run) => horizontalEdgeBox('bottom', run, options.cellSize, options.depth, edgeColor)),
      ...leftEdges.map((run) => verticalEdgeBox('left', run, options.cellSize, options.depth, edgeColor)),
      ...rightEdges.map((run) => verticalEdgeBox('right', run, options.cellSize, options.depth, edgeColor)),
    ],
  };
}

function layoutCells(text: string): Cell[] {
  const cells: Cell[] = [];
  let cursor = 0;
  for (const char of text.toUpperCase()) {
    if (char === ' ') {
      cursor += 3;
      continue;
    }
    const glyph = glyphs[char];
    if (!glyph) {
      cursor += 6;
      continue;
    }
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') cells.push({ col: cursor + col, row });
      }
    }
    cursor += glyph[0].length + 1;
  }
  return cells;
}

function filledRuns(cells: Cell[]): Run[] {
  const rows = groupBy(cells, (cell) => cell.row, (cell) => cell.col);
  return Array.from(rows.entries()).flatMap(([row, cols]) => consecutiveRuns(cols).map((run) => ({ axis: 'x' as const, row, col: run.start, length: run.length })));
}

function horizontalEdgeRuns(cells: Cell[], direction: -1 | 1): Run[] {
  const set = cellSet(cells);
  const edges = cells.filter((cell) => !set.has(key(cell.col, cell.row + direction)));
  return filledRuns(edges);
}

function verticalEdgeRuns(cells: Cell[], direction: -1 | 1): Run[] {
  const set = cellSet(cells);
  const edges = cells.filter((cell) => !set.has(key(cell.col + direction, cell.row)));
  const cols = groupBy(edges, (cell) => cell.col, (cell) => cell.row);
  return Array.from(cols.entries()).flatMap(([col, rows]) => consecutiveRuns(rows).map((run) => ({ axis: 'y' as const, col, row: run.start, length: run.length })));
}

function horizontalEdgeBox(kind: 'top' | 'bottom', run: Run, cellSize: number, depth: number, color: Rgba) {
  const thickness = Math.max(2, cellSize * 0.22);
  const y = kind === 'top' ? run.row * cellSize - thickness : (run.row + 1) * cellSize;
  return box(
    `edge-${kind}-r${run.row}-c${run.col}-n${run.length}`,
    [run.length * cellSize, thickness, depth],
    color,
    [run.col * cellSize, y, 0],
  );
}

function verticalEdgeBox(kind: 'left' | 'right', run: Run, cellSize: number, depth: number, color: Rgba) {
  const thickness = Math.max(2, cellSize * 0.22);
  const x = kind === 'left' ? run.col * cellSize - thickness : (run.col + 1) * cellSize;
  return box(
    `edge-${kind}-c${run.col}-r${run.row}-n${run.length}`,
    [thickness, run.length * cellSize, depth],
    color,
    [x, run.row * cellSize, 0],
  );
}

function groupBy(cells: Cell[], keyOf: (cell: Cell) => number, valueOf: (cell: Cell) => number) {
  const groups = new Map<number, number[]>();
  for (const cell of cells) {
    const groupKey = keyOf(cell);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), valueOf(cell)]);
  }
  for (const [groupKey, values] of groups.entries()) {
    groups.set(groupKey, Array.from(new Set(values)).sort((a, b) => a - b));
  }
  return groups;
}

function consecutiveRuns(values: number[]) {
  const runs: Array<{ start: number; length: number }> = [];
  for (const value of values) {
    const last = runs.at(-1);
    if (last && last.start + last.length === value) {
      last.length += 1;
    } else {
      runs.push({ start: value, length: 1 });
    }
  }
  return runs;
}

function cellSet(cells: Cell[]) {
  return new Set(cells.map((cell) => key(cell.col, cell.row)));
}

function key(col: number, row: number) {
  return `${col}:${row}`;
}

function plane(id: string, size: Vec2Tuple, color: Rgba, position: Vec3Tuple): DesignPrimitiveNode {
  return { id, kind: 'plane', size, color, transform: { position } };
}

function box(id: string, size: Vec3Tuple, color: Rgba, position: Vec3Tuple): DesignPrimitiveNode {
  return { id, kind: 'box', size, color, transform: { position } };
}
