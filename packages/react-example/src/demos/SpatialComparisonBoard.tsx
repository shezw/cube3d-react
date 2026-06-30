/*
    Cube3D React
    packages/react-example/src/demos/SpatialComparisonBoard.tsx

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import React, { useMemo } from 'react';
import { angleBetweenVec3, findWorldNode, getWorldBoundsReport, resolveScene } from '@cube3d/core';
import { CubeCandidate } from './CubeCandidate';
import { createSceneFromSpec } from './sceneFactory';
import { getDemoSpec, stageSize, type DemoCaseOption, type DemoSpec } from './registry';
import { ThreeReference } from './ThreeReference';

export function SpatialComparisonBoard({ baseSpec, cases }: { baseSpec: DemoSpec; cases: DemoCaseOption[] }) {
  const caseSpecs = useMemo(() => cases.map((item) => ({ option: item, spec: getDemoSpec(baseSpec.id, item.id) })), [baseSpec.id, cases]);

  return (
    <section data-spatial-comparison={baseSpec.id} style={boardStyle}>
      {caseSpecs.map(({ option, spec }) => {
        const result = evaluateSpatialCase(spec, option);
        return (
          <article key={option.id} data-spatial-case-card={option.id} style={cardStyle}>
            <header style={cardHeaderStyle}>
              <div>
                <h3 style={caseTitleStyle}>{option.label}</h3>
                <p style={expectationStyle}>{option.expected}</p>
              </div>
              <span
                data-spatial-case-result={result.passed ? 'pass' : 'fail'}
                style={{ ...resultBadgeStyle, ...(result.passed ? passBadgeStyle : failBadgeStyle) }}
              >
                {result.passed ? 'PASS' : 'FAIL'}
              </span>
            </header>

            <div style={miniPanelsStyle}>
              <MiniPanel label="WebGL" kind="reference">
                <ThreeReference spec={spec} />
              </MiniPanel>
              <MiniPanel label="Cube3D" kind="candidate">
                <CubeCandidate spec={spec} />
              </MiniPanel>
            </div>

            <p data-spatial-case-check={option.id} style={checkStyle}>{result.message}</p>
          </article>
        );
      })}
    </section>
  );
}

function MiniPanel({ children, label, kind }: { children: React.ReactNode; label: string; kind: 'reference' | 'candidate' }) {
  return (
    <figure style={miniFigureStyle}>
      <figcaption style={miniCaptionStyle}>{label}</figcaption>
      <div data-spatial-panel={kind} style={miniViewportStyle}>
        <div style={miniScaleStyle}>{children}</div>
      </div>
    </figure>
  );
}

function evaluateSpatialCase(spec: DemoSpec, option: DemoCaseOption) {
  if (spec.id === 'anchor-orientation') return evaluateAnchorCase(spec, option);
  if (spec.id === 'pivot-origin') return evaluatePivotCase(spec, option);
  if (spec.id === 'world-bounds') return evaluateBoundsCase(spec, option);
  return { passed: true, message: 'No spatial check configured.' };
}

function evaluateAnchorCase(spec: DemoSpec, option: DemoCaseOption) {
  const world = resolveScene(createSceneFromSpec(spec));
  const path = `anchor-orientation/${option.id}`;
  const socket = findWorldNode(world, `${path}/socket`)?.worldAnchors.out;
  const plug = findWorldNode(world, `${path}/plug`)?.worldAnchors.in;
  if (!socket || !plug) return { passed: false, message: 'Missing socket.out or plug.in anchor.' };
  const positionDistance = distance3(socket.position, plug.position);
  const normalAngle = angleBetweenVec3(socket.normal!, plug.normal!);
  const shouldAlignOrientation = option.id !== 'positionOnlyControl';
  const passed = positionDistance < 0.001 && (shouldAlignOrientation ? normalAngle < 0.001 : normalAngle > 0.1);
  const orientationText = shouldAlignOrientation ? `normal angle ${normalAngle.toFixed(4)} rad` : `normal intentionally differs by ${normalAngle.toFixed(2)} rad`;
  return {
    passed,
    message: `Expected anchor positions to coincide; measured ${positionDistance.toFixed(3)}px, ${orientationText}.`,
  };
}

function evaluatePivotCase(spec: DemoSpec, option: DemoCaseOption) {
  const world = resolveScene(createSceneFromSpec(spec));
  const path = `pivot-origin/${option.id}`;
  const door = findWorldNode(world, `${path}/door`);
  const handle = findWorldNode(world, `${path}/handle`);
  const doorHandle = door?.worldAnchors.handle;
  const handleMount = handle?.worldAnchors.mount;
  if (!door || !doorHandle || !handleMount) return { passed: false, message: 'Missing door.handle or handle.mount anchor.' };
  const handleDistance = distance3(doorHandle.position, handleMount.position);
  const pivot = door.node.transform.pivot;
  const passed = Boolean(pivot) && handleDistance < 0.001;
  return {
    passed,
    message: `Expected rotation around pivot [${pivot?.x ?? 0}, ${pivot?.y ?? 0}, ${pivot?.z ?? 0}] and attached handle; handle gap ${handleDistance.toFixed(3)}px.`,
  };
}

function evaluateBoundsCase(spec: DemoSpec, option: DemoCaseOption) {
  const world = resolveScene(createSceneFromSpec(spec));
  const report = getWorldBoundsReport(world);
  const byPath = new Map(report.map((item) => [item.path, item]));
  const root = byPath.get('world-bounds');
  const targetPath = option.id === 'nestedScaledStack' ? 'world-bounds/nestedScaledStack/innerStack' : `world-bounds/${option.id}`;
  const target = byPath.get(targetPath);
  const passed = contains(root?.bounds, target?.bounds);
  return {
    passed,
    message: `Expected root bounds to contain ${targetPath}; root size ${formatSize(root?.size)}, target size ${formatSize(target?.size)}.`,
  };
}

function distance3(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function contains(
  parent?: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  child?: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
) {
  if (!parent || !child) return false;
  return parent.min.x <= child.min.x
    && parent.min.y <= child.min.y
    && parent.min.z <= child.min.z
    && parent.max.x >= child.max.x
    && parent.max.y >= child.max.y
    && parent.max.z >= child.max.z;
}

function formatSize(size?: { x: number; y: number; z: number }) {
  if (!size) return 'missing';
  return `${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`;
}

const miniScale = 0.34;

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  alignItems: 'start',
};

const cardStyle: React.CSSProperties = {
  minWidth: 0,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#20232f',
};

const cardHeaderStyle: React.CSSProperties = {
  minHeight: 116,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  padding: '12px 12px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const caseTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
};

const expectationStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: 'rgba(255,255,255,0.62)',
  fontSize: 12,
  lineHeight: 1.4,
};

const resultBadgeStyle: React.CSSProperties = {
  alignSelf: 'start',
  padding: '4px 6px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 800,
};

const passBadgeStyle: React.CSSProperties = {
  color: '#dfffe8',
  background: 'rgba(59, 190, 108, 0.22)',
  border: '1px solid rgba(59, 190, 108, 0.45)',
};

const failBadgeStyle: React.CSSProperties = {
  color: '#ffe5e5',
  background: 'rgba(220, 70, 90, 0.22)',
  border: '1px solid rgba(220, 70, 90, 0.45)',
};

const miniPanelsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  padding: 10,
};

const miniFigureStyle: React.CSSProperties = {
  margin: 0,
  display: 'grid',
  gap: 5,
};

const miniCaptionStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.66)',
  fontSize: 11,
  fontWeight: 700,
};

const miniViewportStyle: React.CSSProperties = {
  width: Math.round(stageSize.width * miniScale),
  height: Math.round(stageSize.height * miniScale),
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#20232f',
};

const miniScaleStyle: React.CSSProperties = {
  width: stageSize.width,
  height: stageSize.height,
  transform: `scale(${miniScale})`,
  transformOrigin: 'top left',
};

const checkStyle: React.CSSProperties = {
  margin: 0,
  minHeight: 58,
  padding: '0 12px 12px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 12,
  lineHeight: 1.4,
};
