import { describe, expect, it } from 'vitest';
import { createCubeFaces, materialToCss, normalizeTransform, transformToCss } from '../src/index';

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
});
