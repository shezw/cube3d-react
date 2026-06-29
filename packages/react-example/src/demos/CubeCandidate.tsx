/*
    cube3d-react
    packages/react-example/src/demos/CubeCandidate.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useMemo, useState } from 'react';
import { type FaceDescriptor, type SceneNode } from '@cube3d/core';
import { Model3D, Scene3D, Space3D } from '@cube3d/react';
import { createSceneFromSpec, findDesignNodeById } from './sceneFactory';
import { stageSize, type DemoSpec } from './registry';

export function CubeCandidate({ spec }: { spec: DemoSpec }) {
  const model = useMemo(() => createSceneFromSpec(spec), [spec]);
  const designNodeCount = useMemo(() => countNodes(spec.root), [spec]);

  return (
    <div
      data-candidate-stage
      data-design-source="shared-demo-spec"
      data-design-spec={spec.id}
      data-design-node-count={designNodeCount}
      style={candidateShellStyle}
    >
      <Scene3D perspective={100000} origin="50% 50%" style={{ width: stageSize.width, height: stageSize.height }}>
        <Space3D position={{ x: 178, y: 86, z: 0 }} rotation={{ x: 58, z: -34 }} size={{ x: 300, y: 230, z: 180 }}>
          <CandidateContent spec={spec} model={model} />
        </Space3D>
      </Scene3D>
    </div>
  );
}

function CandidateContent({ spec, model }: { spec: DemoSpec; model: SceneNode }) {
  const [activePath, setActivePath] = useState('none');
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const nodeFaceContent = useMemo(
    () => ({
      'button-box': {
        front: (
          <button
            data-demo-action="cube-face"
            type="button"
            style={faceButtonStyle}
            onClick={() => {
              setClicked(true);
              setActivePath('button-box/front');
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
            onClick={() => setActivePath('controller/front')}
          >
            grip
          </button>
        ),
      },
      'html-sprite': {
        front: (
          <button data-demo-action="sprite-button" type="button" onClick={() => setActivePath('html-sprite/button')} style={htmlButtonStyle}>
            focusable html
          </button>
        ),
      },
      sprite: { front: <span style={spriteLabelStyle}>HTML</span> },
      extrude: { front: <span style={extrudeTextStyle}>ART</span> },
      visualWord: { front: <span style={extrudeTextStyle}>VISUAL</span> },
      cubeWord: { front: <span style={extrudeTextStyle}>CUBE</span> },
    }),
    [],
  );

  return (
    <>
      <Model3D
        model={model}
        nodeFaceContent={nodeFaceContent}
        nodeFaceStyle={(node, face, index) => nodeFaceStyle(spec, node, face, index, { clicked, hovered })}
      />
      {spec.interactionChecks ? <div data-demo-debug style={debugPanelStyle}>path: {activePath}</div> : null}
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
    return {
      color: index === 0 ? '#b9577b' : '#f07aa2',
      fontSize: node.id === 'visualWord' || node.id === 'cubeWord' ? 25 : 30,
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
      background: node.id === 'controller-hit' ? 'transparent' : undefined,
    };
  }

  if (node.id === 'cord') {
    return {
      borderLeft: '5px solid rgba(7,9,18,0.75)',
      borderBottom: '5px solid rgba(7,9,18,0.75)',
      background: 'transparent',
    };
  }

  if (node.id.includes('Button')) {
    return { borderRadius: 999 };
  }

  if (node.id === 'controller' && spec.id === 'interaction-html') {
    return { background: state.hovered ? 'rgba(118,122,196,1)' : undefined };
  }

  if (interactive === 'cube-face' && face.direction === 'front') {
    return { overflow: 'visible', background: state.clicked ? 'rgba(92,222,140,1)' : undefined };
  }

  if (interactive === 'cube-face') {
    return { pointerEvents: 'none' };
  }

  return undefined;
}

function countNodes(node: DemoSpec['root']): number {
  return 1 + node.children.reduce((sum, child) => sum + (child.kind === 'model' ? countNodes(child) : 1), 0);
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
