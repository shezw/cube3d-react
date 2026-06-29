/*
    cube3d-react
    packages/react-example/src/demos/CubeCandidate.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useMemo, useState } from 'react';
import {
  attach,
  boxPrimitive,
  defineModel,
  modelNode,
  part,
  primitiveNode,
  resolveModel,
  type FaceDescriptor,
  type SceneNode,
} from '@cube3d/core';
import { Box3D, Extrude3D, Model3D, Plane3D, Scene3D, Space3D, Sprite3D } from '@cube3d/react';
import { createCharacterNode, createCoverSceneNode } from '../scene/models';
import type { DemoId } from './registry';
import { stageSize } from './registry';

export function CubeCandidate({ demoId }: { demoId: DemoId }) {
  return (
    <div data-candidate-stage data-demo-id={demoId} style={candidateShellStyle}>
      <Scene3D perspective={780} origin="50% 45%" style={{ width: stageSize.width, height: stageSize.height }}>
        <Space3D position={{ x: 178, y: 86, z: 0 }} rotation={{ x: 58, z: -34 }} size={{ x: 300, y: 230, z: 180 }}>
          <CandidateContent demoId={demoId} />
        </Space3D>
      </Scene3D>
    </div>
  );
}

function CandidateContent({ demoId }: { demoId: DemoId }) {
  if (demoId === 'primitive-lab') return <PrimitiveLabCandidate />;
  if (demoId === 'transform-room') return <Model3D model={createTransformRoomModel()} />;
  if (demoId === 'anchor-assembly') return <Model3D model={createHeadAssemblyModel()} nodeFaceStyle={anchorFaceStyle} />;
  if (demoId === 'nested-model') return <Model3D model={createCharacterNode()} nodeFaceStyle={nestedFaceStyle} />;
  if (demoId === 'object-field') return <Model3D model={createObjectFieldModel()} />;
  if (demoId === 'interaction-html') return <InteractionCandidate />;
  return <Model3D model={createCoverSceneNode()} nodeFaceStyle={coverFaceStyle} />;
}

function PrimitiveLabCandidate() {
  return (
    <>
      <Box3D id="box" size={{ x: 68, y: 68, z: 60 }} position={{ x: 22, y: 42, z: 20 }} material={solid([76, 102, 232, 1])} />
      <Plane3D id="plane" size={{ x: 120, y: 70 }} position={{ x: 106, y: 116, z: 6 }} material={solid([106, 122, 223, 1])} />
      <Sprite3D id="sprite" size={{ x: 62, y: 42 }} position={{ x: 232, y: 58, z: 28 }} material={solid([240, 169, 80, 1])}>
        <span style={spriteLabelStyle}>HTML</span>
      </Sprite3D>
      <Extrude3D id="extrude" depth={14} layers={6} position={{ x: 206, y: 136, z: 20 }} layerStyle={extrudeLayerStyle}>
        ART
      </Extrude3D>
    </>
  );
}

function InteractionCandidate() {
  const [activePath, setActivePath] = useState('none');
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <Box3D
        id="button-box"
        size={{ x: 62, y: 62, z: 54 }}
        position={{ x: 36, y: 74, z: 28 }}
        material={solid(clicked ? [92, 222, 140, 1] : [76, 102, 232, 1])}
        faceStyle={interactiveFaceStyle}
        faces={{
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
        }}
      />
      <Box3D
        id="controller"
        size={{ x: 110, y: 46, z: 20 }}
        position={{ x: 148, y: 92, z: 24 }}
        material={solid(hovered ? [118, 122, 196, 1] : [101, 102, 154, 1])}
        faceStyle={{ pointerEvents: 'none' }}
      />
      <Sprite3D id="controller-hit" size={{ x: 88, y: 28 }} position={{ x: 158, y: 100, z: 52 }} faceStyle={hitSpriteStyle}>
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
      </Sprite3D>
      <Sprite3D id="html-sprite" size={{ x: 118, y: 40 }} position={{ x: 136, y: 36, z: 44 }} faceStyle={htmlSpriteStyle}>
        <button data-demo-action="sprite-button" type="button" onClick={() => setActivePath('html-sprite/button')} style={htmlButtonStyle}>
          focusable html
        </button>
      </Sprite3D>
      <div data-demo-debug style={debugPanelStyle}>path: {activePath}</div>
    </>
  );
}

function createTransformRoomModel(): SceneNode {
  return modelNode({
    id: 'transform-room',
    modelName: 'transform-room',
    children: [
      primitiveNode({ id: 'parent', primitive: boxPrimitive({ size: { x: 36, y: 36, z: 36 }, material: solid([76, 102, 232, 1]) }), transform: { position: { x: 52, y: 52, z: 22 }, rotation: { z: 22 } } }),
      primitiveNode({ id: 'child-a', primitive: boxPrimitive({ size: { x: 26, y: 26, z: 26 }, material: solid([240, 169, 80, 1]) }), transform: { position: { x: 100, y: 30, z: 34 }, rotation: { z: 30 } } }),
      primitiveNode({ id: 'child-b', primitive: boxPrimitive({ size: { x: 34, y: 34, z: 34 }, material: solid([63, 196, 118, 1]) }), transform: { position: { x: 152, y: 72, z: 48 }, rotation: { z: -18 }, scale: { x: 1.2, y: 1.2, z: 1.2 } } }),
      primitiveNode({ id: 'child-c', primitive: boxPrimitive({ size: { x: 50, y: 28, z: 38 }, material: solid([222, 95, 120, 1]) }), transform: { position: { x: 214, y: 114, z: 26 } } }),
    ],
  });
}

function createHeadAssemblyModel(): SceneNode {
  const model = defineModel('head-assembly', [
    part('body', boxPrimitive({ size: { x: 72, y: 58, z: 56 }, material: solid([76, 102, 232, 1]) }), {
      transform: { position: { x: 84, y: 102, z: 28 } },
      anchors: { neck: { id: 'neck', position: { x: 36, y: 0, z: 56 } } },
    }),
    part('neck', boxPrimitive({ size: { x: 26, y: 22, z: 20 }, material: solid([226, 190, 148, 1]) }), {
      anchors: { bottom: { id: 'bottom', position: { x: 13, y: 22, z: 0 } }, top: { id: 'top', position: { x: 13, y: 0, z: 20 } } },
    }),
    part('head', boxPrimitive({ size: { x: 52, y: 46, z: 46 }, material: solid([238, 222, 198, 1]) }), {
      anchors: { bottom: { id: 'bottom', position: { x: 26, y: 46, z: 0 } }, top: { id: 'top', position: { x: 26, y: 0, z: 46 } } },
    }),
    part('hatBrim', boxPrimitive({ size: { x: 74, y: 42, z: 12 }, material: solid([244, 234, 216, 1]) }), {
      anchors: { bottom: { id: 'bottom', position: { x: 37, y: 42, z: 0 } }, top: { id: 'top', position: { x: 37, y: 0, z: 12 } } },
    }),
    part('hatTop', boxPrimitive({ size: { x: 50, y: 32, z: 20 }, material: solid([238, 226, 210, 1]) }), {
      anchors: { bottom: { id: 'bottom', position: { x: 25, y: 32, z: 0 } } },
    }),
  ], {
    transform: { rotation: { z: 0 }, scale: { x: 1.05, y: 1.05, z: 1.05 } },
    attachments: [
      attach('neck', 'bottom', 'body', 'neck'),
      attach('head', 'bottom', 'neck', 'top'),
      attach('hatBrim', 'bottom', 'head', 'top'),
      attach('hatTop', 'bottom', 'hatBrim', 'top'),
    ],
  });
  return resolveModel(model, 'head-assembly');
}

function createObjectFieldModel(): SceneNode {
  return modelNode({
    id: 'object-field',
    modelName: 'object-field',
    children: [
      primitiveNode({ id: 'base', primitive: boxPrimitive({ size: { x: 220, y: 150, z: 8 }, material: solid([67, 80, 230, 1]) }), transform: { position: { x: 42, y: 54, z: 2 } } }),
      primitiveNode({ id: 'cubeA', primitive: boxPrimitive({ size: { x: 48, y: 48, z: 58 }, material: solid([222, 112, 92, 1]) }), transform: { position: { x: 76, y: 82, z: 12 } } }),
      primitiveNode({ id: 'cubeB', primitive: boxPrimitive({ size: { x: 70, y: 48, z: 78 }, material: solid([240, 213, 98, 1]) }), transform: { position: { x: 154, y: 72, z: 12 } } }),
      primitiveNode({ id: 'camera', primitive: boxPrimitive({ size: { x: 48, y: 36, z: 42 }, material: solid([78, 144, 188, 1]) }), transform: { position: { x: 236, y: 36, z: 18 } } }),
      primitiveNode({ id: 'prop', primitive: boxPrimitive({ size: { x: 42, y: 34, z: 24 }, material: solid([70, 178, 104, 1]) }), transform: { position: { x: 8, y: 38, z: 14 } } }),
    ],
  });
}

function anchorFaceStyle(node: SceneNode): React.CSSProperties | undefined {
  if (node.anchors && Object.keys(node.anchors).length > 0) return { outline: '1px solid rgba(106,240,139,0.32)' };
  return undefined;
}

function nestedFaceStyle(node: SceneNode): React.CSSProperties | undefined {
  if (node.id === 'cord') return { borderLeft: '5px solid rgba(7,9,18,0.75)', borderBottom: '5px solid rgba(7,9,18,0.75)', background: 'transparent' };
  if (node.id.includes('Button')) return { borderRadius: 999 };
  return undefined;
}

function coverFaceStyle(node: SceneNode, face: FaceDescriptor): React.CSSProperties | undefined {
  if (node.id === 'base' && face.direction === 'top') return { boxShadow: '0 20px 54px rgba(0,0,0,0.3)' };
  return nestedFaceStyle(node);
}

function interactiveFaceStyle(face: FaceDescriptor): React.CSSProperties | undefined {
  return face.direction === 'front' ? { overflow: 'visible' } : { pointerEvents: 'none' };
}

function extrudeLayerStyle({ isFront }: { isFront: boolean }): React.CSSProperties {
  return {
    color: isFront ? '#f07aa2' : '#b9577b',
    fontSize: 36,
    fontWeight: 900,
    fontFamily: 'Arial Black, Impact, sans-serif',
    lineHeight: 1,
    overflow: 'visible',
  };
}

function solid(rgba: [number, number, number, number]) {
  return { kind: 'solid' as const, rgba };
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

const htmlSpriteStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  overflow: 'visible',
  background: 'rgba(88,200,121,0.78)',
};

const hitSpriteStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  overflow: 'visible',
  background: 'transparent',
  pointerEvents: 'none',
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
