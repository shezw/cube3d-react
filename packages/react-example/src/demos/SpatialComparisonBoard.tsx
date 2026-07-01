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
import { LazyThreeReference } from './LazyThreeReference';
import { createSceneFromSpec } from './sceneFactory';
import { getDemoSpec, stageSize, type DemoCaseOption, type DemoSpec } from './registry';
import type { DesignModelNode, DesignPrimitiveNode, DesignTransform } from './spec';

type SpatialState = {
  id: 'before' | 'after' | 'stress';
  label: string;
  intent: string;
  spec: DemoSpec;
};

export function SpatialComparisonBoard({ baseSpec, cases }: { baseSpec: DemoSpec; cases: DemoCaseOption[] }) {
  const caseSpecs = useMemo(() => cases.map((item) => {
    const spec = getDemoSpec(baseSpec.id, item.id);
    return { option: item, spec, states: createSpatialStates(spec, item) };
  }), [baseSpec.id, cases]);

  return (
    <section data-spatial-comparison={baseSpec.id} style={boardStyle}>
      {caseSpecs.map(({ option, spec, states }) => {
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

            <div data-spatial-state-grid={option.id} style={stateGridStyle}>
              <span aria-hidden="true" />
              {states.map((state) => (
                <div key={`${state.id}-label`} data-spatial-state-label={state.id} style={stateLabelStyle}>
                  <strong>{state.label}</strong>
                  <span>{state.intent}</span>
                </div>
              ))}

              <div style={rendererLabelStyle}>WebGL</div>
              {states.map((state) => (
                <StatePanel key={`reference-${state.id}`} caseId={option.id} state={state} kind="reference">
                  <LazyThreeReference spec={state.spec} />
                </StatePanel>
              ))}

              <div style={rendererLabelStyle}>Cube3D</div>
              {states.map((state) => (
                <StatePanel key={`candidate-${state.id}`} caseId={option.id} state={state} kind="candidate">
                  <CubeCandidate spec={state.spec} />
                </StatePanel>
              ))}
            </div>

            <p data-spatial-case-check={option.id} style={checkStyle}>{result.message}</p>
          </article>
        );
      })}
    </section>
  );
}

function StatePanel({ caseId, children, state, kind }: { caseId: string; children: React.ReactNode; state: SpatialState; kind: 'reference' | 'candidate' }) {
  return (
    <div
      data-spatial-state-panel={kind}
      data-spatial-state={state.id}
      data-spatial-case={caseId}
      style={miniViewportStyle}
    >
      <div style={miniScaleStyle}>{children}</div>
    </div>
  );
}

function createSpatialStates(spec: DemoSpec, option: DemoCaseOption): SpatialState[] {
  return [
    {
      id: 'before',
      label: 'Before',
      intent: beforeIntent(spec.id),
      spec: createBeforeState(spec),
    },
    {
      id: 'after',
      label: 'After',
      intent: option.expected,
      spec: createAfterState(spec),
    },
    {
      id: 'stress',
      label: 'Stress',
      intent: stressIntent(spec.id),
      spec: createStressState(spec),
    },
  ];
}

function beforeIntent(id: DemoSpec['id']) {
  if (id === 'anchor-orientation') return 'same objects before attachment is applied';
  if (id === 'pivot-origin') return 'same object with zero rotation around its pivot';
  if (id === 'world-bounds') return 'same stack before the tested world transform';
  return 'initial state';
}

function stressIntent(id: DemoSpec['id']) {
  if (id === 'anchor-orientation') return 'same attachment under an extra parent transform';
  if (id === 'pivot-origin') return 'same pivot with a stronger rotation';
  if (id === 'world-bounds') return 'same stack under a stronger transform context';
  return 'stress state';
}

function createBeforeState(spec: DemoSpec) {
  const next = cloneSpec(spec);
  if (spec.id === 'anchor-orientation') {
    const caseNode = selectedCaseModel(next);
    caseNode.attachments = caseNode.attachments?.filter((item) => item.childId !== 'plug') ?? [];
    return presentSpatialSpec(next);
  }
  if (spec.id === 'pivot-origin') {
    const door = primitiveChild(selectedCaseModel(next), 'door');
    door.transform = { ...door.transform, rotation: [0, 0, 0] };
    return presentSpatialSpec(next);
  }
  if (spec.id === 'world-bounds') {
    normalizeWorldBoundsCase(next);
    return presentSpatialSpec(next);
  }
  return presentSpatialSpec(next);
}

function createAfterState(spec: DemoSpec) {
  return presentSpatialSpec(cloneSpec(spec));
}

function createStressState(spec: DemoSpec) {
  const next = cloneSpec(spec);
  if (spec.id === 'anchor-orientation') {
    const caseNode = selectedCaseModel(next);
    caseNode.transform = combineTransform(caseNode.transform, {
      rotation: [0, 0, ((caseNode.transform?.rotation?.[2] ?? 0) + 24)],
      scale: scaleTuple(caseNode.transform?.scale, 1.12),
    });
    return presentSpatialSpec(next);
  }
  if (spec.id === 'pivot-origin') {
    const door = primitiveChild(selectedCaseModel(next), 'door');
    door.transform = { ...door.transform, rotation: [0, 0, -72] };
    return presentSpatialSpec(next);
  }
  if (spec.id === 'world-bounds') {
    stressWorldBoundsCase(next);
    return presentSpatialSpec(next);
  }
  return presentSpatialSpec(next);
}

function cloneSpec(spec: DemoSpec): DemoSpec {
  return JSON.parse(JSON.stringify(spec)) as DemoSpec;
}

function selectedCaseModel(spec: DemoSpec) {
  const selectedCase = spec.selectedCase;
  if (!selectedCase) throw new Error(`${spec.id} requires selectedCase for spatial state rendering.`);
  const node = spec.root.children.find((child) => child.id === selectedCase);
  if (!node || node.kind !== 'model') throw new Error(`${spec.id}/${selectedCase} should be a model node.`);
  return node;
}

function presentSpatialSpec(spec: DemoSpec) {
  if (!spec.selectedCase) return spec;
  const caseNode = selectedCaseModel(spec);
  const factor = presentationScale(spec.id);
  caseNode.transform = {
    ...caseNode.transform,
    position: presentationPosition(spec.id),
    scale: scaleTuple(caseNode.transform?.scale, factor),
  };
  return spec;
}

function presentationScale(id: DemoSpec['id']) {
  if (id === 'pivot-origin') return 1.6;
  if (id === 'world-bounds') return 1.65;
  return 1.65;
}

function presentationPosition(id: DemoSpec['id']): [number, number, number] {
  if (id === 'pivot-origin') return [18, 78, 10];
  if (id === 'world-bounds') return [32, 98, 12];
  return [22, 88, 12];
}

function primitiveChild(parent: DesignModelNode, id: string): DesignPrimitiveNode {
  const node = parent.children.find((child) => child.id === id);
  if (!node || node.kind === 'model') throw new Error(`${parent.id}/${id} should be a primitive node.`);
  return node;
}

function modelChild(parent: DesignModelNode, id: string): DesignModelNode {
  const node = parent.children.find((child) => child.id === id);
  if (!node || node.kind !== 'model') throw new Error(`${parent.id}/${id} should be a model node.`);
  return node;
}

function combineTransform(base: DesignTransform | undefined, patch: DesignTransform): DesignTransform {
  return { ...base, ...patch };
}

function scaleTuple(scale: DesignTransform['scale'], factor: number): [number, number, number] {
  const resolved = scale ?? [1, 1, 1];
  return [resolved[0] * factor, resolved[1] * factor, resolved[2] * factor];
}

function normalizeWorldBoundsCase(spec: DemoSpec) {
  const caseNode = selectedCaseModel(spec);
  if (caseNode.id === 'nestedScaledStack') {
    caseNode.transform = { ...caseNode.transform, rotation: [0, 0, 0], scale: [1, 1, 1] };
    modelChild(caseNode, 'innerStack').transform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    return;
  }
  caseNode.transform = { ...caseNode.transform, rotation: [0, 0, 0], scale: [1, 1, 1] };
}

function stressWorldBoundsCase(spec: DemoSpec) {
  const caseNode = selectedCaseModel(spec);
  if (caseNode.id === 'translatedStack') {
    caseNode.transform = { ...caseNode.transform, rotation: [0, 0, -18], scale: [1.12, 1.12, 1.12] };
    return;
  }
  if (caseNode.id === 'rotatedStack') {
    caseNode.transform = { ...caseNode.transform, rotation: [0, 0, -46], scale: [1.06, 1.06, 1.06] };
    return;
  }
  caseNode.transform = { ...caseNode.transform, rotation: [0, 0, 12], scale: [1.34, 1.34, 1.34] };
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
  const orientationText = shouldAlignOrientation
    ? `anchor direction guide angle ${normalAngle.toFixed(4)}deg`
    : `anchor direction guides intentionally differ by ${normalAngle.toFixed(2)}deg`;
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

const miniScale = 0.52;

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 16,
  alignItems: 'start',
};

const cardStyle: React.CSSProperties = {
  minWidth: 0,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#20232f',
};

const cardHeaderStyle: React.CSSProperties = {
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
  maxWidth: 720,
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

const stateGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `56px repeat(3, ${Math.round(stageSize.width * miniScale)}px)`,
  gap: '8px 10px',
  padding: '10px 12px 12px',
  alignItems: 'start',
  overflowX: 'auto',
};

const stateLabelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  minHeight: 44,
  color: 'rgba(255,255,255,0.72)',
  fontSize: 10,
  lineHeight: 1.25,
};

const miniViewportStyle: React.CSSProperties = {
  width: Math.round(stageSize.width * miniScale),
  height: Math.round(stageSize.height * miniScale),
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#20232f',
};

const rendererLabelStyle: React.CSSProperties = {
  height: Math.round(stageSize.height * miniScale),
  display: 'grid',
  alignItems: 'center',
  color: 'rgba(255,255,255,0.68)',
  fontSize: 11,
  fontWeight: 800,
};

const miniScaleStyle: React.CSSProperties = {
  width: stageSize.width,
  height: stageSize.height,
  transform: `scale(${miniScale})`,
  transformOrigin: 'top left',
};

const checkStyle: React.CSSProperties = {
  margin: 0,
  padding: '0 12px 12px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 12,
  lineHeight: 1.4,
};
