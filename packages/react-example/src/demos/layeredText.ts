/*
    cube3d-react
    packages/react-example/src/demos/layeredText.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import type { DesignPrimitiveNode, LayeredTextSmooth } from './spec';

export const layeredTextSmoothLevels = ['min', 'mid', 'high', 'max'] as const satisfies readonly LayeredTextSmooth[];

export function resolveLayeredTextDepth(node: DesignPrimitiveNode) {
  return node.renderMode === 'layered-text'
    ? node.textHeight ?? node.depth ?? 16
    : node.depth ?? 16;
}

export function resolveLayeredTextLayers(node: DesignPrimitiveNode) {
  if (node.renderMode !== 'layered-text') return node.layers ?? 6;
  if (node.layers != null && node.textSmooth == null && node.textHeight == null) return node.layers;

  const height = resolveLayeredTextDepth(node);
  const smooth = node.textSmooth ?? 'mid';
  return layeredTextLayerCount(height, smooth);
}

export function layeredTextLayerCount(height: number, smooth: LayeredTextSmooth) {
  const safeHeight = Math.max(1, Math.ceil(height));
  if (smooth === 'max') return Math.max(2, safeHeight);
  const divisor = smooth === 'high' ? 2 : smooth === 'mid' ? 4 : 8;
  return Math.max(2, Math.ceil(safeHeight / divisor));
}
