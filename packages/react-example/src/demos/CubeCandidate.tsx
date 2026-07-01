/*
    Cube3D React
    packages/react-example/src/demos/CubeCandidate.tsx

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import React, { useLayoutEffect, useMemo, useState } from 'react';
import { type FaceDescriptor, type SceneNode } from '@shezw/cube3d/core';
import { Camera3D, type Camera3DState, Model3D, resolveMotionPreset, Scene3D, Space3D, useCamera3D, useTimeline3D } from '@shezw/cube3d';
import { createSceneFromSpec, findDesignNodeById, flattenDesignNodes } from './sceneFactory';
import { stageSize, type DemoSpec } from './registry';
import type { DemoCameraState, DesignPrimitiveNode } from './spec';

export function CubeCandidate({ spec }: { spec: DemoSpec }) {
  const model = useMemo(() => createSceneFromSpec(spec), [spec]);
  const designNodeCount = useMemo(() => countNodes(spec.root), [spec]);
  const timeline = useTimeline3D(spec.timeline?.clip ?? emptyTimelineClip);

  return (
    <div
      data-candidate-stage
      data-design-source="shared-demo-spec"
      data-design-spec={spec.id}
      data-design-case={spec.selectedCase ?? ''}
      data-design-node-count={designNodeCount}
      style={candidateShellStyle}
    >
      <Scene3D perspective={100000} origin="50% 50%" style={{ width: stageSize.width, height: stageSize.height }}>
        <CandidateCameraFrame spec={spec} model={model} timeline={timeline} />
      </Scene3D>
      {spec.timeline ? <TimelinePanel timeline={timeline} duration={spec.timeline.clip.duration} /> : null}
    </div>
  );
}

function CandidateCameraFrame({
  spec,
  model,
  timeline,
}: {
  spec: DemoSpec;
  model: SceneNode;
  timeline: ReturnType<typeof useTimeline3D>;
}) {
  const camera = useCamera3D(initialCameraState(spec));

  return (
    <Camera3D state={camera.state}>
      <Space3D position={{ x: 178, y: 86, z: 0 }} rotation={{ x: 58, z: -34 }} size={{ x: 300, y: 230, z: 180 }}>
        <CandidateContent spec={spec} model={model} camera={camera} timeline={timeline} />
      </Space3D>
    </Camera3D>
  );
}

function CandidateContent({
  spec,
  model,
  camera,
  timeline,
}: {
  spec: DemoSpec;
  model: SceneNode;
  camera: ReturnType<typeof useCamera3D>;
  timeline: ReturnType<typeof useTimeline3D>;
}) {
  const [activePath, setActivePath] = useState(spec.callout?.initialPath ?? spec.contentBindings?.[0]?.path ?? 'none');
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | undefined>();
  const [feedbackPath, setFeedbackPath] = useState('none');
  const [activeSection, setActiveSection] = useState(spec.cameraScroll?.sections[0]?.id ?? '');
  const [characterState, setCharacterState] = useState('idle');
  const interactivePaths = useMemo(() => semanticInteractionPaths(spec), [spec]);
  const feedbackTargets = useMemo(() => new Set(spec.feedbackTargets ?? []), [spec]);
  const hasSemanticInteraction = interactivePaths.length > 0;
  const selectedBinding = spec.contentBindings?.find((binding) => binding.path === activePath);
  const nodeFaceContent = useMemo(
    () => ({
      ...solidTextFaceContent(spec),
      'button-box': {
        front: (
          <button
            data-demo-action="cube-face"
            type="button"
            style={faceButtonStyle}
            onClick={() => {
              setClicked(true);
              setActivePath('button-box/front');
              setFeedbackPath('button-box/front');
            }}
          >
            click
          </button>
        ),
      },
      'controller-hit': {
        front: (
          <button
            data-demo-action="controller-button"
            type="button"
            style={faceButtonStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
              setActivePath('controller/front');
              setFeedbackPath('controller/front');
            }}
          >
            grip
          </button>
        ),
      },
      'html-sprite': {
        front: (
          <button
            data-demo-action="sprite-button"
            type="button"
            onClick={() => {
              setActivePath('html-sprite/button');
              setFeedbackPath('html-sprite/button');
            }}
            style={htmlButtonStyle}
          >
            focusable html
          </button>
        ),
      },
      sprite: { front: <span style={spriteLabelStyle}>HTML</span> },
      extrude: { front: <span style={extrudeTextStyle}>ART</span> },
      cubeText: { front: <span style={extrudeTextStyle}>CUBE3D</span> },
      htmlText: { front: <span style={extrudeTextStyle}>HTML</span> },
      caption: { front: <span style={spriteLabelStyle}>live text</span> },
      label: { front: <span style={spriteLabelStyle}>click cubeB</span> },
      htmlPanel: { front: <button data-demo-action="semantic-html-panel" type="button" style={htmlButtonStyle}>panel</button> },
      visualWord: { front: <span style={extrudeTextStyle}>VISUAL</span> },
      cubeWord: { front: <span style={extrudeTextStyle}>CUBE</span> },
    }),
    [spec],
  );

  return (
    <>
      <Model3D
        model={model}
        nodeFaceContent={nodeFaceContent}
        nodeFaceStyle={(node, face, index) => nodeFaceStyle(spec, node, face, index, { clicked, hovered })}
        nodeTransformOverride={(node, path) => mergeTransformFragments(
          spec.timeline ? timeline.nodeTransformOverride(node, path) : undefined,
          nodeTransformOverride(node, path, { feedbackPath, hoveredPath, feedbackTargets, characterState }, spec),
        )}
        interactivePaths={hasSemanticInteraction ? interactivePaths : undefined}
        onNodeClick={hasSemanticInteraction ? (event) => {
          setFeedbackPath(feedbackTargets.has(event.path) ? event.path : 'none');
          if (spec.cameraFocus && event.path === spec.cameraFocus.interactivePath) {
            setActivePath(event.path);
            void camera.moveTo(toCameraState(spec.cameraFocus.target), { duration: 0 });
            return;
          }
          const binding = spec.contentBindings?.find((item) => item.path === event.path);
          if (binding) {
            setActivePath(event.path);
            if (binding.camera) void camera.moveTo(toCameraState(binding.camera), { duration: 0 });
            if (binding.characterState) setCharacterState(binding.characterState);
          }
          if (spec.characterReaction && event.path === spec.characterReaction.triggerPath) {
            setCharacterState(spec.characterReaction.reactionState);
          }
        } : undefined}
        onNodePointerEnter={hasSemanticInteraction ? (event) => setHoveredPath(feedbackTargets.has(event.path) ? event.path : undefined) : undefined}
        onNodePointerLeave={hasSemanticInteraction ? () => setHoveredPath(undefined) : undefined}
      />
      {spec.cameraScroll ? (
        <CameraScrollRail
          spec={spec}
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section.id);
            setActivePath(section.path);
            void camera.moveTo(toCameraState(section.camera), { duration: 0 });
          }}
        />
      ) : null}
      {spec.contentBindings ? (
        <ContentPanel selectedPath={activePath} binding={selectedBinding} characterState={characterState} />
      ) : null}
      {spec.callout ? <CalloutOverlay spec={spec} selectedPath={activePath} binding={selectedBinding} /> : null}
      {(spec.interactionChecks || spec.cameraFocus || spec.cameraScroll || spec.contentBindings || spec.characterReaction) && activePath !== 'none' ? (
        <div
          data-demo-debug
          data-demo-selected-path={activePath}
          data-demo-feedback-path={feedbackPath}
          data-demo-character-state={characterState}
          data-demo-active-section={activeSection}
          style={debugPanelStyle}
        >
          path: {activePath}
        </div>
      ) : null}
    </>
  );
}

function nodeFaceStyle(
  spec: DemoSpec,
  node: SceneNode,
  face: FaceDescriptor,
  index: number,
  state: { clicked: boolean; hovered: boolean },
): React.CSSProperties | undefined {
  const designNode = findDesignNodeById(spec.root, node.id);
  const interactive = designNode?.kind === 'model' ? undefined : designNode?.interactive;

  if (node.primitive?.kind === 'extrude') {
    const isLayeredText = designNode?.kind !== 'model' && designNode?.renderMode === 'layered-text';
    const topLayerIndex = node.primitive.layers - 1;
    const textLayerColor = isLayeredText
      ? index === topLayerIndex
        ? '#f07aa2'
        : '#b9577b'
      : index === 0
        ? '#b9577b'
        : '#f07aa2';
    return {
      ...(isLayeredText ? { background: 'transparent' } : undefined),
      color: textLayerColor,
      fontSize: node.id === 'visualWord' || node.id === 'cubeWord' || node.id === 'cubeText' ? 25 : 30,
      fontWeight: 900,
      fontFamily: 'Arial Black, Impact, sans-serif',
      lineHeight: 1,
      overflow: 'visible',
    };
  }

  if (node.primitive?.kind === 'sprite') {
    return {
      display: 'grid',
      placeItems: 'center',
      overflow: 'visible',
      pointerEvents: interactive ? 'auto' : undefined,
      ...(designNode?.kind !== 'model' && designNode?.shape === 'circle' ? { borderRadius: '50%' } : undefined),
      ...(node.id === 'controller-hit' ? { background: 'transparent' } : undefined),
    };
  }

  if (node.primitive?.kind === 'plane' && designNode?.kind !== 'model' && designNode.solidTextFace) {
    return {
      background: 'transparent',
      overflow: 'visible',
      pointerEvents: 'none',
    };
  }

  if (node.primitive?.kind === 'plane' && designNode?.kind !== 'model' && designNode.solidTextEdge) {
    return {
      backfaceVisibility: 'hidden',
      pointerEvents: 'none',
    };
  }

  if (node.primitive?.kind === 'plane' && designNode?.kind !== 'model' && designNode?.shape === 'circle') {
    return { borderRadius: '50%' };
  }

  if (node.id.includes('Button')) {
    return { borderRadius: 999 };
  }

  if (node.id === 'controller' && spec.id === 'interaction-html') {
    return state.hovered ? { background: 'rgba(118,122,196,1)' } : undefined;
  }

  if (interactive === 'cube-face' && face.direction === 'front') {
    return {
      overflow: 'visible',
      ...(state.clicked ? { background: 'rgba(92,222,140,1)' } : undefined),
    };
  }

  if (interactive === 'cube-face') {
    return { pointerEvents: 'none' };
  }

  return undefined;
}

function nodeTransformOverride(
  node: SceneNode,
  path: string,
  state: { feedbackPath: string; hoveredPath?: string; feedbackTargets: Set<string>; characterState: string },
  spec: DemoSpec,
) {
  if (spec.characterReaction && path === spec.characterReaction.characterPath && state.characterState === spec.characterReaction.reactionState) {
    return { position: { z: node.transform.position.z + 12 } };
  }
  if (path === state.feedbackPath && state.feedbackTargets.has(path)) {
    const lift = resolveMotionPreset('hoverLift', { active: true });
    return { position: { z: node.transform.position.z + (lift.position?.z ?? 0) } };
  }
  if (path === state.hoveredPath && state.feedbackTargets.has(path)) {
    const lift = resolveMotionPreset('hoverLift', { progress: 0.55 });
    return { position: { z: node.transform.position.z + (lift.position?.z ?? 0) } };
  }
  return undefined;
}

function semanticInteractionPaths(spec: DemoSpec) {
  const paths = [
    spec.cameraFocus?.interactivePath,
    ...(spec.interactionTargets ?? []),
    spec.characterReaction?.triggerPath,
  ].filter(Boolean) as string[];
  return Array.from(new Set(paths));
}

function mergeTransformFragments(...fragments: Array<ReturnType<typeof nodeTransformOverride> | undefined>) {
  const result = fragments.reduce((merged, fragment) => {
    if (!fragment) return merged;
    return {
      position: fragment.position || merged.position
        ? { ...merged.position, ...fragment.position }
        : undefined,
      rotation: fragment.rotation || merged.rotation
        ? { ...merged.rotation, ...fragment.rotation }
        : undefined,
      scale: fragment.scale || merged.scale
        ? { ...merged.scale, ...fragment.scale }
        : undefined,
      pivot: fragment.pivot || merged.pivot
        ? { ...merged.pivot, ...fragment.pivot }
        : undefined,
    };
  }, {} as NonNullable<ReturnType<typeof nodeTransformOverride>>);
  return Object.keys(result).length > 0 ? result : undefined;
}

function TimelinePanel({
  timeline,
  duration,
}: {
  timeline: ReturnType<typeof useTimeline3D>;
  duration: number;
}) {
  return (
    <div
      data-timeline-panel
      data-timeline-status={timeline.status}
      data-timeline-time={timeline.time.toFixed(2)}
      data-timeline-progress={timeline.evaluation.state.progress.toFixed(4)}
      style={timelinePanelStyle}
    >
      <button type="button" data-timeline-action="play" style={timelineButtonStyle} onClick={timeline.play}>Play</button>
      <button type="button" data-timeline-action="pause" style={timelineButtonStyle} onClick={timeline.pause}>Pause</button>
      <button type="button" data-timeline-action="seek-mid" style={timelineButtonStyle} onClick={() => timeline.seek(duration / 2)}>Mid</button>
      <button type="button" data-timeline-action="stop" style={timelineButtonStyle} onClick={timeline.stop}>Stop</button>
    </div>
  );
}

function CameraScrollRail({
  spec,
  activeSection,
  onSectionChange,
}: {
  spec: DemoSpec;
  activeSection: string;
  onSectionChange: (section: NonNullable<DemoSpec['cameraScroll']>['sections'][number]) => void;
}) {
  const sections = spec.cameraScroll?.sections ?? [];
  return (
    <div
      data-camera-scroll-rail
      data-camera-scroll-active={activeSection}
      style={scrollRailStyle}
      onScroll={(event) => {
        const element = event.currentTarget;
        const maxScroll = Math.max(1, element.scrollHeight - element.clientHeight);
        const progress = element.scrollTop / maxScroll;
        const index = Math.min(sections.length - 1, Math.round(progress * (sections.length - 1)));
        const section = sections[index];
        if (section && section.id !== activeSection) onSectionChange(section);
      }}
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          data-camera-scroll-section={section.id}
          aria-pressed={activeSection === section.id}
          style={scrollSectionStyle}
          onClick={() => onSectionChange(section)}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}

function ContentPanel({
  selectedPath,
  binding,
  characterState,
}: {
  selectedPath: string;
  binding?: NonNullable<DemoSpec['contentBindings']>[number];
  characterState: string;
}) {
  return (
    <aside
      data-content-panel
      data-content-path={selectedPath}
      data-content-character-state={characterState}
      style={contentPanelStyle}
    >
      <strong>{binding?.title ?? 'No selection'}</strong>
      <span>{binding?.body ?? 'Select an object.'}</span>
    </aside>
  );
}

function CalloutOverlay({
  spec,
  selectedPath,
  binding,
}: {
  spec: DemoSpec;
  selectedPath: string;
  binding?: NonNullable<DemoSpec['contentBindings']>[number];
}) {
  const [target, setTarget] = useState({ x: 120, y: 120 });

  useLayoutEffect(() => {
    const stage = document.querySelector(`[data-candidate-stage][data-design-spec="${spec.id}"]`);
    const faces = Array.from(document.querySelectorAll(`[data-cube3d-path="${selectedPath}"] [data-cube3d-face]`));
    const stageRect = stage?.getBoundingClientRect();
    const rects = faces.map((face) => face.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
    if (!stageRect || rects.length === 0) return;
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    setTarget({
      x: (left + right) / 2 - stageRect.left,
      y: (top + bottom) / 2 - stageRect.top,
    });
  }, [binding, selectedPath, spec.id]);

  return (
    <div data-callout data-callout-path={selectedPath} data-callout-x={target.x.toFixed(2)} data-callout-y={target.y.toFixed(2)} style={calloutLayerStyle}>
      <svg aria-hidden="true" style={calloutSvgStyle}>
        <line x1={target.x} y1={target.y} x2={405} y2={82} stroke="rgba(255,230,128,0.9)" strokeWidth="2" />
        <circle cx={target.x} cy={target.y} r="4" fill="rgba(255,230,128,0.96)" />
      </svg>
      <div style={calloutCardStyle}>
        <strong>{binding?.title ?? selectedPath}</strong>
        <span>{binding?.body ?? 'Projected callout target.'}</span>
      </div>
    </div>
  );
}

function solidTextFaceContent(spec: DemoSpec) {
  const entries = flattenDesignNodes(spec.root)
    .filter((entry): entry is { path: string; node: DesignPrimitiveNode } => (
      entry.node.kind !== 'model' && (Boolean(entry.node.solidTextFace) || Boolean(entry.node.solidTextEdge))
    ))
    .map(({ node }) => [
      node.id,
      {
        front: node.solidTextFace
          ? <SolidTextSvgFace face={node.solidTextFace} />
          : <SolidTextSideMarker edge={node.solidTextEdge!} />,
      },
    ] as const);
  return Object.fromEntries(entries);
}

function SolidTextSvgFace({ face }: { face: NonNullable<DesignPrimitiveNode['solidTextFace']> }) {
  return (
    <svg
      data-cube3d-face={face.role}
      data-cube3d-glyph={face.glyph}
      data-cube3d-glyph-index={face.glyphIndex}
      data-cube3d-contours={face.contours.join(',')}
      data-solid-text-face={face.role}
      data-solid-text-glyph={face.glyph}
      data-solid-text-glyph-index={face.glyphIndex}
      viewBox={face.viewBox}
      preserveAspectRatio="none"
      style={solidTextSvgStyle}
    >
      <path d={face.path} fill={rgba(face.color)} fillRule="evenodd" />
    </svg>
  );
}

function SolidTextSideMarker({ edge }: { edge: NonNullable<DesignPrimitiveNode['solidTextEdge']> }) {
  return (
    <span
      data-cube3d-face="side"
      data-cube3d-glyph={edge.glyph}
      data-cube3d-glyph-index={edge.glyphIndex}
      data-cube3d-contour={edge.contour}
      data-cube3d-contour-index={edge.contourIndex}
      data-cube3d-edge-index={edge.edgeIndex}
      data-cube3d-edge-role={edge.role}
      data-solid-text-edge
      style={solidTextSideMarkerStyle}
    />
  );
}

function countNodes(node: DemoSpec['root']): number {
  return 1 + node.children.reduce((sum, child) => sum + (child.kind === 'model' ? countNodes(child) : 1), 0);
}

function initialCameraState(spec: DemoSpec): Camera3DState {
  return toCameraState(
    spec.cameraFocus?.initial ??
    spec.cameraScroll?.initial,
  );
}

const candidateShellStyle: React.CSSProperties = {
  position: 'relative',
  width: stageSize.width,
  height: stageSize.height,
  overflow: 'hidden',
  background: '#20232f',
};

const spriteLabelStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  color: '#1c2030',
  fontSize: 14,
  fontWeight: 900,
};

const extrudeTextStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
};

const faceButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
  color: '#fff',
  background: 'rgba(255,255,255,0.12)',
  fontWeight: 800,
  cursor: 'pointer',
  pointerEvents: 'auto',
};

const htmlButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.4)',
  color: '#102018',
  background: 'rgba(255,255,255,0.62)',
  fontSize: 12,
  fontWeight: 800,
};

const debugPanelStyle: React.CSSProperties = {
  position: 'absolute',
  left: 8,
  top: 8,
  color: '#fff',
  fontSize: 12,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.36)',
  border: '1px solid rgba(255,255,255,0.16)',
};

const scrollRailStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: 20,
  width: 102,
  height: 92,
  display: 'grid',
  gap: 10,
  overflowY: 'auto',
  padding: 6,
  background: 'rgba(12,15,26,0.55)',
  border: '1px solid rgba(255,255,255,0.18)',
};

const scrollSectionStyle: React.CSSProperties = {
  minHeight: 54,
  border: '1px solid rgba(255,255,255,0.22)',
  color: '#eef1ff',
  background: 'rgba(255,255,255,0.12)',
  fontWeight: 800,
  cursor: 'pointer',
};

const contentPanelStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  bottom: 12,
  width: 164,
  display: 'grid',
  gap: 4,
  padding: '8px 10px',
  color: '#f6f7ff',
  fontSize: 11,
  lineHeight: 1.3,
  background: 'rgba(18,22,36,0.78)',
  border: '1px solid rgba(255,255,255,0.18)',
  pointerEvents: 'none',
};

const timelinePanelStyle: React.CSSProperties = {
  position: 'absolute',
  left: 10,
  bottom: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 52px)',
  gap: 6,
  padding: 8,
  background: 'rgba(18,22,36,0.72)',
  border: '1px solid rgba(255,255,255,0.18)',
  pointerEvents: 'auto',
  zIndex: 10,
};

const timelineButtonStyle: React.CSSProperties = {
  minHeight: 28,
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#eef1ff',
  background: 'rgba(255,255,255,0.12)',
  fontWeight: 800,
  cursor: 'pointer',
};

const emptyTimelineClip = {
  id: 'empty',
  duration: 0,
  tracks: [],
};

const calloutLayerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const calloutSvgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
};

const calloutCardStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: 52,
  width: 116,
  display: 'grid',
  gap: 4,
  padding: 8,
  color: '#1b2032',
  fontSize: 10,
  lineHeight: 1.25,
  background: 'rgba(255,236,148,0.94)',
  border: '1px solid rgba(255,255,255,0.42)',
};

const solidTextSvgStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none',
};

const solidTextSideMarkerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

function rgba(color: [number, number, number, number]) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
}

function toCameraState(state?: DemoCameraState): Camera3DState {
  return {
    position: state?.position ? { x: state.position[0], y: state.position[1], z: state.position[2] } : undefined,
    rotation: state?.rotation ? { x: state.rotation[0], y: state.rotation[1], z: state.rotation[2] } : undefined,
    zoom: state?.zoom,
    origin: state?.origin,
  };
}
