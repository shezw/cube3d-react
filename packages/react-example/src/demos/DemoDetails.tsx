/*
    cube3d-react
    packages/react-example/src/demos/DemoDetails.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useMemo } from 'react';
import type { DemoSpec, DesignAnchorMap, DesignAttachment, DesignModelNode, DesignNode, DesignPrimitiveNode, DesignTransform } from './spec';

export function DemoDetails({ spec }: { spec: DemoSpec }) {
  const treeText = useMemo(() => formatSceneTree(spec.root), [spec]);
  const codeText = useMemo(() => formatImplementationCode(spec), [spec]);

  return (
    <section data-demo-details={spec.id} style={detailsGridStyle}>
      <article style={detailsPanelStyle}>
        <h3 style={detailsTitleStyle}>Scene Tree</h3>
        <pre data-demo-tree={spec.id} style={preStyle}>{treeText}</pre>
      </article>
      <article style={detailsPanelStyle}>
        <h3 style={detailsTitleStyle}>Implementation</h3>
        <pre data-demo-code={spec.id} style={preStyle}>{codeText}</pre>
      </article>
    </section>
  );
}

export function formatSceneTree(root: DesignModelNode): string {
  return formatNodeTree(root).join('\n');
}

export function formatImplementationCode(spec: DemoSpec): string {
  const rootCode = formatNodeCode(spec.root, 2);
  const requiredPaths = spec.requiredPaths.map((path) => `  '${path}'`).join(',\n');
  const projectionPaths = spec.projectionPaths ? `,\n  projectionPaths: ${formatValue(spec.projectionPaths, 2)}` : '';
  const anchorChecks = spec.anchorChecks ? `,\n  anchorChecks: ${formatValue(spec.anchorChecks, 2)}` : '';
  const modelCounts = spec.modelCounts ? `,\n  modelCounts: ${formatValue(spec.modelCounts, 2)}` : '';
  const interactionChecks = spec.interactionChecks ? `,\n  interactionChecks: ${formatValue(spec.interactionChecks, 2)}` : '';

  return [
    `const ${toIdentifier(spec.id)}: DemoSpec = {`,
    `  id: '${spec.id}',`,
    `  title: '${escapeString(spec.title)}',`,
    `  capability: '${escapeString(spec.capability)}',`,
    `  maxDiffRatio: ${spec.maxDiffRatio},`,
    '  root:',
    `${rootCode},`,
    '  requiredPaths: [',
    requiredPaths,
    `  ]${projectionPaths}${anchorChecks}${modelCounts}${interactionChecks},`,
    '};',
    '',
    'const scene = createSceneFromSpec(' + toIdentifier(spec.id) + ');',
    '<Scene3D perspective={100000} origin="50% 50%">',
    '  <Space3D position={{ x: 178, y: 86, z: 0 }} rotation={{ x: 58, z: -34 }}>',
    '    <Model3D model={scene} />',
    '  </Space3D>',
    '</Scene3D>',
  ].join('\n');
}

function formatNodeTree(node: DesignNode, depth = 0): string[] {
  const prefix = `${'  '.repeat(depth)}${depth === 0 ? '' : '- '}`;
  const meta = formatTreeMeta(node);
  const line = `${prefix}${node.id} <${node.kind}${node.kind === 'model' && node.modelName ? `:${node.modelName}` : ''}>${meta}`;
  if (node.kind !== 'model') return [line];

  const attachments = node.attachments?.map((item) => `${'  '.repeat(depth + 1)}@attach${item.mode === 'position-orientation' ? ':oriented' : ''} ${item.childId}.${item.childAnchor} -> ${item.parentId}.${item.parentAnchor}`) ?? [];
  return [line, ...attachments, ...node.children.flatMap((child) => formatNodeTree(child, depth + 1))];
}

function formatTreeMeta(node: DesignNode): string {
  const chunks: string[] = [];
  if (node.kind !== 'model') {
    chunks.push(`size=${formatTuple(node.size)}`);
    if (node.layers != null) chunks.push(`layers=${node.layers}`);
    if (node.depth != null) chunks.push(`depth=${node.depth}`);
    if (node.shape) chunks.push(`shape=${node.shape}`);
    if (node.interactive) chunks.push(`interactive=${node.interactive}`);
  }
  if (node.kind === 'model' && node.referenceShape) chunks.push(`reference=${node.referenceShape.kind}`);
  if (node.transform) chunks.push(`transform=${formatTransformInline(node.transform)}`);
  if (node.anchors) chunks.push(`anchors=${Object.keys(node.anchors).join(',')}`);
  return chunks.length > 0 ? ` ${chunks.join(' ')}` : '';
}

function formatNodeCode(node: DesignNode, indent: number): string {
  if (node.kind === 'model') return formatModelCode(node, indent);
  return formatPrimitiveCode(node, indent);
}

function formatModelCode(node: DesignModelNode, indent: number): string {
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);
  const lines = [
    `${pad}{`,
    `${childPad}id: '${escapeString(node.id)}',`,
    `${childPad}kind: 'model',`,
  ];
  if (node.modelName) lines.push(`${childPad}modelName: '${escapeString(node.modelName)}',`);
  if (node.transform) lines.push(`${childPad}transform: ${formatValue(transformObject(node.transform), indent + 2)},`);
  if (node.anchors) lines.push(`${childPad}anchors: ${formatAnchorMap(node.anchors, indent + 2)},`);
  if (node.referenceShape) lines.push(`${childPad}referenceShape: ${formatValue(node.referenceShape, indent + 2)},`);
  lines.push(`${childPad}children: [`);
  for (const child of node.children) {
    lines.push(`${formatNodeCode(child, indent + 4)},`);
  }
  lines.push(`${childPad}]${node.attachments ? ',' : ''}`);
  if (node.attachments) lines.push(`${childPad}attachments: ${formatAttachments(node.attachments, indent + 2)}`);
  lines.push(`${pad}}`);
  return lines.join('\n');
}

function formatPrimitiveCode(node: DesignPrimitiveNode, indent: number): string {
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);
  const lines = [
    `${pad}{`,
    `${childPad}id: '${escapeString(node.id)}',`,
    `${childPad}kind: '${node.kind}',`,
    `${childPad}size: ${formatTuple(node.size)},`,
  ];
  if (node.color) lines.push(`${childPad}color: ${formatTuple(node.color)},`);
  if (node.faceColors) lines.push(`${childPad}faceColors: ${formatValue(node.faceColors, indent + 2)},`);
  if (node.transform) lines.push(`${childPad}transform: ${formatValue(transformObject(node.transform), indent + 2)},`);
  if (node.anchors) lines.push(`${childPad}anchors: ${formatAnchorMap(node.anchors, indent + 2)},`);
  if (node.layers != null) lines.push(`${childPad}layers: ${node.layers},`);
  if (node.depth != null) lines.push(`${childPad}depth: ${node.depth},`);
  if (node.label) lines.push(`${childPad}label: '${escapeString(node.label)}',`);
  if (node.shape) lines.push(`${childPad}shape: '${node.shape}',`);
  if (node.interactive) lines.push(`${childPad}interactive: '${node.interactive}',`);
  lines.push(`${pad}}`);
  return lines.join('\n');
}

function formatAttachments(attachments: DesignAttachment[], indent: number): string {
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);
  return [
    '[',
    ...attachments.map((item) => {
      const mode = item.mode ? `, mode: '${item.mode}'` : '';
      return `${childPad}{ childId: '${escapeString(item.childId)}', childAnchor: '${escapeString(item.childAnchor)}', parentId: '${escapeString(item.parentId)}', parentAnchor: '${escapeString(item.parentAnchor)}'${mode} },`;
    }),
    `${pad}]`,
  ].join('\n');
}

function formatAnchorMap(anchors: DesignAnchorMap, indent: number): string {
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);
  return [
    '{',
    ...Object.entries(anchors).map(([id, value]) => `${childPad}${id}: ${Array.isArray(value) ? formatTuple(value) : formatValue(value, indent + 2)},`),
    `${pad}}`,
  ].join('\n');
}

function transformObject(transform: DesignTransform) {
  return Object.fromEntries(
    Object.entries(transform).filter(([, value]) => value != null),
  );
}

function formatTransformInline(transform: DesignTransform): string {
  return Object.entries(transformObject(transform))
    .map(([key, value]) => `${key}:${formatTuple(value as number[])}`)
    .join(',');
}

function formatTuple(values: readonly number[]): string {
  return `[${values.join(', ')}]`;
}

function formatValue(value: unknown, indent: number): string {
  return JSON.stringify(value, null, 2)
    .replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')
    .replace(/"/g, "'")
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${' '.repeat(indent)}${line}`))
    .join('\n');
}

function toIdentifier(id: string): string {
  return `${id.replace(/(^|-)([a-z])/g, (_match, _dash, letter: string) => letter.toUpperCase()).replace(/[^A-Za-z0-9_$]/g, '')}Demo`;
}

function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)',
  gap: 18,
  marginTop: 24,
};

const detailsPanelStyle: React.CSSProperties = {
  minWidth: 0,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#20232f',
};

const detailsTitleStyle: React.CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.78)',
  fontSize: 13,
  fontWeight: 800,
};

const preStyle: React.CSSProperties = {
  margin: 0,
  maxHeight: 360,
  overflow: 'auto',
  padding: 12,
  color: '#dce2ff',
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.55,
  whiteSpace: 'pre',
};
