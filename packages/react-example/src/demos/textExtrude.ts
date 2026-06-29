/*
    cube3d-react
    packages/react-example/src/demos/textExtrude.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import type { DesignPrimitiveNode, TextExtrudeSmooth } from './spec';

export const textExtrudeSmoothLevels = ['min', 'mid', 'high', 'max'] as const satisfies readonly TextExtrudeSmooth[];

export function resolveTextExtrudeDepth(node: DesignPrimitiveNode) {
  return node.renderMode === 'text-extrude'
    ? node.textHeight ?? node.depth ?? 16
    : node.depth ?? 16;
}

export function resolveTextExtrudeLayers(node: DesignPrimitiveNode) {
  if (node.renderMode !== 'text-extrude') return node.layers ?? 6;
  if (node.layers != null && node.textSmooth == null && node.textHeight == null) return node.layers;

  const height = resolveTextExtrudeDepth(node);
  const smooth = node.textSmooth ?? 'mid';
  return textLayerCount(height, smooth);
}

export function textLayerCount(height: number, smooth: TextExtrudeSmooth) {
  const safeHeight = Math.max(1, Math.ceil(height));
  if (smooth === 'max') return Math.max(2, safeHeight);
  const divisor = smooth === 'high' ? 2 : smooth === 'mid' ? 4 : 8;
  return Math.max(2, Math.ceil(safeHeight / divisor));
}
