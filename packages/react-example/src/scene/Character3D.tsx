/*
    Cube3D React
    packages/react-example/src/scene/Character3D.tsx
    Repository: https://github.com/shezw/cube3d-react
*/

import React, { useMemo } from 'react';
import type { FaceDescriptor, SceneNode } from '@cube3d/core';
import { Model3D, Space3D } from '@cube3d/react';
import { createCharacterNode } from './models';

type Vec3Like = { x: number; y: number; z: number };

export type Character3DProps = {
  position: Vec3Like;
  rotation?: Partial<Vec3Like>;
  scale?: Partial<Vec3Like>;
};

export function Character3D({ position, rotation, scale }: Character3DProps) {
  const model = useMemo(() => createCharacterNode(), []);

  return (
    <Space3D
      position={position}
      rotation={rotation}
      scale={scale}
      size={{ x: 170, y: 220, z: 230 }}
      style={characterObjectStyle}
    >
      <div data-scene-object="character" style={objectMarkerStyle}>
        <Model3D
          model={model}
          nodeFaceContent={{ face: <span>└─┘</span> }}
          nodeFaceStyle={styleCharacterNode}
        />
      </div>
    </Space3D>
  );
}

export const characterMotionCss = `
@keyframes cube3d-character-idle {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -8px, 6px); }
}
`;

const characterObjectStyle: React.CSSProperties = {
  transformStyle: 'preserve-3d',
};

const objectMarkerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  animation: 'cube3d-character-idle 4.8s ease-in-out infinite',
  transformStyle: 'preserve-3d',
};

function styleCharacterNode(node: SceneNode, face: FaceDescriptor): React.CSSProperties | undefined {
  if (node.id === 'shadow') {
    return {
      borderRadius: '50%',
      filter: 'blur(8px)',
    };
  }

  if (node.id === 'face') {
    return {
      display: 'grid',
      placeItems: 'center',
      color: '#1a1c24',
      fontSize: 20,
      fontWeight: 900,
      background: 'transparent',
    };
  }

  if (node.id === 'head' && face.direction === 'front') {
    return {
      boxShadow: 'inset 0 -10px 0 rgba(190,138,88,0.28)',
    };
  }

  if (node.id === 'shell') {
    return {
      borderRadius: 5,
    };
  }

  if (node.id === 'greenButton' || node.id === 'orangeButton' || node.id === 'blueButton') {
    return {
      borderRadius: 999,
    };
  }

  if (node.id === 'leftHand' || node.id === 'rightHand') {
    return {
      borderRadius: node.id === 'leftHand' ? 7 : 8,
    };
  }

  if (node.id === 'cord') {
    return {
      borderLeft: '7px solid rgba(7,9,18,0.78)',
      borderBottom: '7px solid rgba(7,9,18,0.78)',
      borderRadius: '0 0 0 30px',
      background: 'transparent',
    };
  }

  return undefined;
}
