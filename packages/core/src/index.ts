export type Vec3 = { x: number; y: number; z: number };
export type Size3 = { x: number; y: number; z: number };

export type Transform3D = {
  translate: Vec3;
  rotate: Vec3; // degrees
  scale: Vec3;
};

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

export type Easing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | { cubicBezier: [number, number, number, number] };

export type AnimationOptions = {
  duration?: number; // ms
  delay?: number; // ms
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  easing?: Easing;
};

export class Node3D {
  readonly size: Size3;
  transform: Transform3D;
  offset: Vec3;
  constructor(size: Size3) {
    this.size = size;
    this.transform = { translate: { x: 0, y: 0, z: 0 }, rotate: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    this.offset = { x: 0, y: 0, z: 0 };
  }
}

export type MaterialSolid = { kind: 'solid'; rgba: [number, number, number, number]; contrast?: number };
export type MaterialImage = { kind: 'image'; src: string };
export type Material = MaterialSolid | MaterialImage;

export type FaceDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export type CubeInit = {
  size: Size3;
  material?: MaterialSolid;
  contrast?: number;
};

export class Cube extends Node3D {
  readonly contrast: number;
  readonly material?: MaterialSolid;
  constructor(init: CubeInit) {
    super(init.size);
    this.contrast = init.contrast ?? 20;
    this.material = init.material;
  }
}
