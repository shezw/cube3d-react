export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Size2 = {
  x: number;
  y: number;
};

export type Size3 = {
  x: number;
  y: number;
  z: number;
};

export type Transform3D = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type PartialTransform3D = Partial<{
  position: Partial<Vec3>;
  rotation: Partial<Vec3>;
  scale: Partial<Vec3>;
}>;

export type KeyframeTransform = Partial<{
  translateX: number | string;
  translateY: number | string;
  translateZ: number | string;
  rotateX: number | string;
  rotateY: number | string;
  rotateZ: number | string;
  scaleX: number | string;
  scaleY: number | string;
  scaleZ: number | string;
}>;

export type Keyframes = Record<number, { transform?: KeyframeTransform } & Record<string, unknown>>;

export type Easing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | { cubicBezier: [number, number, number, number] };

export type AnimationOptions = {
  duration?: number;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  easing?: Easing;
};

export type MaterialSolid = {
  kind: 'solid';
  rgba: [number, number, number, number];
};

export type MaterialImage = {
  kind: 'image';
  src: string;
};

export type Material = MaterialSolid | MaterialImage;

export type FaceDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
export type FaceMaterials = Partial<Record<FaceDirection, Material>>;

export type CubeFace = {
  direction: FaceDirection;
  size: Size2;
  transform: string;
  material?: Material;
  shade: number;
};

export const FACE_DIRECTIONS: FaceDirection[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];

export const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };
export const UNIT_VEC3: Vec3 = { x: 1, y: 1, z: 1 };

export function vec3(value?: Partial<Vec3>, fallback: Vec3 = ZERO_VEC3): Vec3 {
  return {
    x: value?.x ?? fallback.x,
    y: value?.y ?? fallback.y,
    z: value?.z ?? fallback.z,
  };
}

export function normalizeTransform(transform?: PartialTransform3D): Transform3D {
  return {
    position: vec3(transform?.position),
    rotation: vec3(transform?.rotation),
    scale: vec3(transform?.scale, UNIT_VEC3),
  };
}

export function transformToCss(transform?: PartialTransform3D): string {
  const next = normalizeTransform(transform);
  const { position, rotation, scale } = next;
  return [
    `translate3d(${position.x}px, ${position.y}px, ${position.z}px)`,
    `rotateX(${rotation.x}deg)`,
    `rotateY(${rotation.y}deg)`,
    `rotateZ(${rotation.z}deg)`,
    `scale3d(${scale.x}, ${scale.y}, ${scale.z})`,
  ].join(' ');
}

export function createCubeFaces(size: Size3, material?: MaterialSolid, contrast = 20): CubeFace[] {
  const { x, y, z } = size;
  return [
    {
      direction: 'front',
      size: { x, y },
      transform: `translate(-50%, -50%) translateZ(${z / 2}px)`,
      material: shadeMaterial(material, 0),
      shade: 0,
    },
    {
      direction: 'back',
      size: { x, y },
      transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${z / 2}px)`,
      material: shadeMaterial(material, 4 * contrast),
      shade: 4 * contrast,
    },
    {
      direction: 'left',
      size: { x: z, y },
      transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${x / 2}px)`,
      material: shadeMaterial(material, 3 * contrast),
      shade: 3 * contrast,
    },
    {
      direction: 'right',
      size: { x: z, y },
      transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${x / 2}px)`,
      material: shadeMaterial(material, 2 * contrast),
      shade: 2 * contrast,
    },
    {
      direction: 'top',
      size: { x, y: z },
      transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${y / 2}px)`,
      material: shadeMaterial(material, contrast),
      shade: contrast,
    },
    {
      direction: 'bottom',
      size: { x, y: z },
      transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${y / 2}px)`,
      material: shadeMaterial(material, 5 * contrast),
      shade: 5 * contrast,
    },
  ];
}

export function createBoxFaces(init: { size: Size3; material?: MaterialSolid; materials?: FaceMaterials; contrast?: number }): CubeFace[] {
  const { size, material, materials, contrast = 20 } = init;
  return createCubeFaces(size, material, contrast).map((face) => ({
    ...face,
    material: materials?.[face.direction] ?? face.material,
  }));
}

export function materialToCss(material?: Material): string | undefined {
  if (!material) return undefined;
  if (material.kind === 'image') return `url("${material.src}") center / cover no-repeat`;
  const [r, g, b, a] = material.rgba;
  return `rgba(${clampColor(r)}, ${clampColor(g)}, ${clampColor(b)}, ${a})`;
}

export function shadeMaterial(material?: MaterialSolid, shade = 0): MaterialSolid | undefined {
  if (!material) return undefined;
  const [r, g, b, a] = material.rgba;
  return {
    kind: 'solid',
    rgba: [clampColor(r - shade), clampColor(g - shade), clampColor(b - shade), a],
  };
}

export class Node3D {
  readonly size?: Size3;
  transform: Transform3D;

  constructor(init: { size?: Size3; transform?: PartialTransform3D } = {}) {
    this.size = init.size;
    this.transform = normalizeTransform(init.transform);
  }
}

export class Cube extends Node3D {
  readonly size: Size3;
  readonly material?: MaterialSolid;
  readonly materials?: FaceMaterials;
  readonly contrast: number;

  constructor(init: { size: Size3; material?: MaterialSolid; materials?: FaceMaterials; contrast?: number; transform?: PartialTransform3D }) {
    super({ size: init.size, transform: init.transform });
    this.size = init.size;
    this.material = init.material;
    this.materials = init.materials;
    this.contrast = init.contrast ?? 20;
  }

  faces(): CubeFace[] {
    return createBoxFaces({ size: this.size, material: this.material, materials: this.materials, contrast: this.contrast });
  }
}

function clampColor(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
