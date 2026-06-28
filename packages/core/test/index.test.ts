import { describe, expect, it } from 'vitest';
import { createBoxFaces, createCubeFaces, materialToCss, normalizeTransform, transformToCss } from '../src/index';

describe('@cube3d/core', () => {
  it('normalizes sparse transforms', () => {
    expect(normalizeTransform({ position: { x: 12 }, scale: { z: 2 } })).toEqual({
      position: { x: 12, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 2 },
    });
  });

  it('serializes transforms in object-space order', () => {
    expect(transformToCss({ position: { x: 10, y: 20, z: 30 }, rotation: { z: 45 } })).toContain(
      'translate3d(10px, 20px, 30px) rotateX(0deg) rotateY(0deg) rotateZ(45deg)',
    );
  });

  it('creates six real cube faces with shaded solid material', () => {
    const faces = createCubeFaces({ x: 100, y: 80, z: 60 }, { kind: 'solid', rgba: [200, 180, 160, 1] }, 10);

    expect(faces).toHaveLength(6);
    expect(faces.map((face) => face.direction)).toEqual(['front', 'back', 'left', 'right', 'top', 'bottom']);
    expect(faces.find((face) => face.direction === 'right')?.size).toEqual({ x: 60, y: 80 });
    expect(materialToCss(faces.find((face) => face.direction === 'bottom')?.material)).toBe('rgba(150, 130, 110, 1)');
  });

  it('allows explicit per-face materials to override generated shading', () => {
    const faces = createBoxFaces({
      size: { x: 120, y: 80, z: 24 },
      material: { kind: 'solid', rgba: [100, 100, 200, 1] },
      materials: {
        top: { kind: 'solid', rgba: [255, 230, 120, 1] },
        front: { kind: 'image', src: '/cover.png' },
      },
    });

    expect(materialToCss(faces.find((face) => face.direction === 'top')?.material)).toBe('rgba(255, 230, 120, 1)');
    expect(materialToCss(faces.find((face) => face.direction === 'front')?.material)).toBe('url("/cover.png") center / cover no-repeat');
  });
});
