import { describe, expect, it } from 'vitest';
import { boxPrimitive, createBoxFaces, extrudePrimitive, getPrimitiveBounds, getPrimitiveFaces, materialToCss, planePrimitive, spritePrimitive } from '../src/index';

describe('@cube3d/core primitives', () => {
  it('describes box faces without CSS strings', () => {
    const faces = createBoxFaces({
      size: { x: 100, y: 80, z: 60 },
      material: { kind: 'solid', rgba: [200, 180, 160, 1] },
      contrast: 10,
    });

    expect(faces).toHaveLength(6);
    expect(faces.map((face) => face.direction)).toEqual(['front', 'back', 'left', 'right', 'top', 'bottom']);
    expect(faces[0].transform.position).toEqual({ x: 50, y: 40, z: 60 });
    expect(typeof faces[0].transform).toBe('object');
    expect(materialToCss(faces.find((face) => face.direction === 'bottom')?.material)).toBe('rgba(150, 130, 110, 1)');
  });

  it('supports per-face material overrides', () => {
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

  it('computes primitive bounds and descriptors', () => {
    expect(getPrimitiveBounds(boxPrimitive({ size: { x: 12, y: 20, z: 8 } }))).toEqual({
      min: { x: 0, y: 0, z: 0 },
      max: { x: 12, y: 20, z: 8 },
    });
    expect(getPrimitiveFaces(planePrimitive({ size: { x: 30, y: 40 } }))).toEqual([
      expect.objectContaining({
        direction: 'front',
        size: { x: 30, y: 40 },
        transform: expect.objectContaining({ position: { x: 15, y: 20, z: 0 } }),
      }),
    ]);
  });

  it('describes every box face size and transform', () => {
    const faces = createBoxFaces({ size: { x: 100, y: 80, z: 60 } });

    expect(faces).toEqual([
      expect.objectContaining({ direction: 'front', size: { x: 100, y: 80 }, transform: expect.objectContaining({ position: { x: 50, y: 40, z: 60 } }) }),
      expect.objectContaining({ direction: 'back', size: { x: 100, y: 80 }, transform: expect.objectContaining({ position: { x: 50, y: 40, z: 0 }, rotation: { x: 0, y: 180, z: 0 } }) }),
      expect.objectContaining({ direction: 'left', size: { x: 60, y: 80 }, transform: expect.objectContaining({ position: { x: 0, y: 40, z: 30 }, rotation: { x: 0, y: -90, z: 0 } }) }),
      expect.objectContaining({ direction: 'right', size: { x: 60, y: 80 }, transform: expect.objectContaining({ position: { x: 100, y: 40, z: 30 }, rotation: { x: 0, y: 90, z: 0 } }) }),
      expect.objectContaining({ direction: 'top', size: { x: 100, y: 60 }, transform: expect.objectContaining({ position: { x: 50, y: 0, z: 30 }, rotation: { x: 90, y: 0, z: 0 } }) }),
      expect.objectContaining({ direction: 'bottom', size: { x: 100, y: 60 }, transform: expect.objectContaining({ position: { x: 50, y: 80, z: 30 }, rotation: { x: -90, y: 0, z: 0 } }) }),
    ]);
  });

  it('describes sprite and extrude descriptors', () => {
    expect(getPrimitiveFaces(spritePrimitive({ size: { x: 18, y: 24 } }))).toEqual([
      expect.objectContaining({
        direction: 'front',
        size: { x: 18, y: 24 },
        transform: expect.objectContaining({ position: { x: 9, y: 12, z: 0 } }),
      }),
    ]);

    expect(getPrimitiveBounds(extrudePrimitive({ size: { x: 12, y: 8 }, depth: 9, layers: 4 }))).toEqual({
      min: { x: 0, y: 0, z: 0 },
      max: { x: 12, y: 8, z: 9 },
    });
    expect(getPrimitiveFaces(extrudePrimitive({ size: { x: 12, y: 8 }, depth: 9, layers: 4 })).map((face) => face.transform.position)).toEqual([
      { x: 6, y: 4, z: 0 },
      { x: 6, y: 4, z: 3 },
      { x: 6, y: 4, z: 6 },
      { x: 6, y: 4, z: 9 },
    ]);
  });
});
