/*
    cube3d-react
    packages/react-example/src/scene/Character3D.tsx    2026-06-29

     ______     __  __     ______     ______     __     __
    /\  ___\   /\ \_\ \   /\  ___\   /\___  \   /\ \  _ \ \
    \ \___  \  \ \  __ \  \ \  __\   \/_/  /__  \ \ \/ ".\ \
     \/\_____\  \ \_\ \_\  \ \_____\   /\_____\  \ \__/".~\_\
      \/_____/   \/_/\/_/   \/_____/   \/_____/   \/_/   \/_/.com

    @link    : local
    @author  : Codex
    @email   : local
*/

import React from 'react';
import { Box3D, Plane3D, Space3D, Sprite3D } from '@cube3d/react';

type Rgba = [number, number, number, number];
type Vec3Like = { x: number; y: number; z: number };

export type Character3DProps = {
  position: Vec3Like;
  rotation?: Partial<Vec3Like>;
  scale?: Partial<Vec3Like>;
};

export function Character3D({ position, rotation, scale }: Character3DProps) {
  return (
    <Space3D
      position={position}
      rotation={rotation}
      scale={scale}
      size={{ x: 170, y: 220, z: 230 }}
      style={characterObjectStyle}
    >
      <div data-scene-object="character" style={objectMarkerStyle}>
        <Plane3D
          size={{ x: 146, y: 118 }}
          position={{ x: -15, y: 118, z: -12 }}
          material={{ kind: 'solid', rgba: [15, 17, 28, 0.22] }}
          faceStyle={shadowStyle}
        />

        <CharacterBody />
        <CharacterHead />
        <CharacterArms />
        <Controller3D />
        <CharacterHands />
      </div>
    </Space3D>
  );
}

function CharacterBody() {
  return (
    <Space3D position={{ x: 32, y: 30, z: 70 }}>
      <Box3D
        size={{ x: 84, y: 76, z: 76 }}
        material={{ kind: 'solid', rgba: [73, 84, 235, 1] }}
        materials={{
          top: { kind: 'solid', rgba: [96, 107, 255, 1] },
          front: { kind: 'solid', rgba: [63, 70, 205, 1] },
          right: { kind: 'solid', rgba: [52, 58, 184, 1] },
        }}
        contrast={12}
      />
      <Box3D size={{ x: 36, y: 28, z: 24 }} position={{ x: 24, y: -16, z: 46 }} material={solid([222, 188, 147, 1])} contrast={8} />
      <Box3D size={{ x: 104, y: 28, z: 24 }} position={{ x: -10, y: 66, z: -26 }} material={solid([47, 54, 185, 1])} contrast={8} />
      <Box3D size={{ x: 20, y: 60, z: 26 }} position={{ x: 8, y: 86, z: -58 }} material={solid([38, 42, 96, 1])} contrast={6} />
      <Box3D size={{ x: 20, y: 60, z: 26 }} position={{ x: 58, y: 86, z: -58 }} material={solid([38, 42, 96, 1])} contrast={6} />
    </Space3D>
  );
}

function CharacterHead() {
  return (
    <Space3D position={{ x: 42, y: -8, z: 122 }}>
      <Box3D
        size={{ x: 68, y: 60, z: 54 }}
        material={solid([238, 222, 198, 1])}
        materials={{
          front: { kind: 'solid', rgba: [242, 226, 204, 1] },
          top: { kind: 'solid', rgba: [250, 238, 220, 1] },
          right: { kind: 'solid', rgba: [218, 195, 168, 1] },
        }}
        faceStyle={(face) => ({
          boxShadow: face.direction === 'front' ? 'inset 0 -10px 0 rgba(190,138,88,0.28)' : undefined,
        })}
        contrast={8}
      />
      <Sprite3D size={{ x: 50, y: 24 }} position={{ x: 9, y: 38, z: 29 }} faceStyle={faceStyle}>
        <span>└─┘</span>
      </Sprite3D>
      <Box3D size={{ x: 88, y: 68, z: 14 }} position={{ x: -10, y: -10, z: 48 }} material={solid([244, 234, 218, 1])} contrast={8} />
      <Box3D size={{ x: 64, y: 48, z: 20 }} position={{ x: 2, y: -25, z: 58 }} material={solid([238, 226, 210, 1])} contrast={9} />
    </Space3D>
  );
}

function CharacterArms() {
  return (
    <>
      <Space3D position={{ x: 4, y: 62, z: 96 }} rotation={{ z: -10 }}>
        <Box3D size={{ x: 30, y: 68, z: 28 }} material={solid([222, 188, 147, 1])} contrast={9} />
        <Box3D size={{ x: 32, y: 34, z: 30 }} position={{ x: -2, y: -2, z: 10 }} material={solid([74, 84, 220, 1])} contrast={8} />
      </Space3D>

      <Space3D position={{ x: 100, y: 62, z: 96 }} rotation={{ z: 12 }}>
        <Box3D size={{ x: 30, y: 68, z: 28 }} material={solid([222, 188, 147, 1])} contrast={9} />
        <Box3D size={{ x: 32, y: 34, z: 30 }} position={{ x: -1, y: -2, z: 10 }} material={solid([68, 78, 213, 1])} contrast={8} />
      </Space3D>
    </>
  );
}

function CharacterHands() {
  return (
    <>
      <Box3D
        size={{ x: 36, y: 32, z: 30 }}
        position={{ x: 2, y: 112, z: 64 }}
        material={solid([226, 190, 148, 1])}
        faceStyle={{ borderRadius: 7 }}
        contrast={8}
      />
      <Box3D
        size={{ x: 38, y: 34, z: 32 }}
        position={{ x: 108, y: 112, z: 64 }}
        material={solid([226, 190, 148, 1])}
        faceStyle={{ borderRadius: 8 }}
        contrast={8}
      />
    </>
  );
}

function Controller3D() {
  return (
    <Space3D position={{ x: -4, y: 116, z: 38 }}>
      <Box3D
        size={{ x: 132, y: 78, z: 26 }}
        material={solid([82, 83, 132, 1])}
        materials={{
          top: { kind: 'solid', rgba: [101, 102, 154, 1] },
          front: { kind: 'solid', rgba: [62, 64, 108, 1] },
        }}
        faceStyle={{ borderRadius: 5 }}
        contrast={9}
      />
      <ButtonDot color={[42, 183, 99, 1]} x={22} y={23} />
      <ButtonDot color={[221, 139, 55, 1]} x={54} y={31} />
      <ButtonDot color={[57, 154, 210, 1]} x={32} y={52} />
      <Box3D size={{ x: 16, y: 16, z: 42 }} position={{ x: 88, y: 40, z: 24 }} material={solid([42, 45, 62, 1])} contrast={6} />
      <Sprite3D size={{ x: 84, y: 154 }} position={{ x: 111, y: 76, z: 18 }} faceStyle={cordStyle} />
    </Space3D>
  );
}

function ButtonDot({ color, x, y }: { color: Rgba; x: number; y: number }) {
  return (
    <Box3D
      size={{ x: 20, y: 20, z: 8 }}
      position={{ x, y, z: 28 }}
      material={solid(color)}
      faceStyle={{ borderRadius: 999 }}
      contrast={8}
    />
  );
}

function solid(rgba: Rgba) {
  return { kind: 'solid' as const, rgba };
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

const shadowStyle: React.CSSProperties = {
  borderRadius: '50%',
  filter: 'blur(8px)',
  transform: 'scale(1.1)',
};

const faceStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  color: '#1a1c24',
  fontSize: 20,
  fontWeight: 900,
  background: 'transparent',
};

const cordStyle: React.CSSProperties = {
  borderLeft: '7px solid rgba(7,9,18,0.78)',
  borderBottom: '7px solid rgba(7,9,18,0.78)',
  borderRadius: '0 0 0 30px',
  background: 'transparent',
};
