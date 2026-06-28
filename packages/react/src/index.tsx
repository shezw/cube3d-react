import React, {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type {
  AnimationOptions,
  CubeFace,
  FaceMaterials,
  FaceDirection,
  Keyframes,
  Material,
  MaterialImage,
  MaterialSolid,
  PartialTransform3D,
  Size2,
  Size3,
  Vec3,
} from '@cube3d/core';
import { createBoxFaces, materialToCss, transformToCss } from '@cube3d/core';
import { easingToCss, ensureStyle, keyframesToCss } from '@cube3d/css-renderer';

export type Scene3DProps = {
  children?: React.ReactNode;
  perspective?: number;
  origin?: string;
  className?: string;
  style?: React.CSSProperties;
};

type SceneContextValue = {
  perspective: number;
  origin: string;
};

const SceneContext = createContext<SceneContextValue>({
  perspective: 900,
  origin: '50% 50%',
});

export function useScene3D(): SceneContextValue {
  return useContext(SceneContext);
}

export function Scene3D({
  children,
  perspective = 900,
  origin = '50% 50%',
  className,
  style,
}: Scene3DProps) {
  const value = useMemo(() => ({ perspective, origin }), [perspective, origin]);

  return (
    <SceneContext.Provider value={value}>
      <div
        className={className}
        style={{
          position: 'relative',
          perspective: `${perspective}px`,
          perspectiveOrigin: origin,
          transformStyle: 'preserve-3d',
          overflow: 'visible',
          ...style,
        }}
      >
        {children}
      </div>
    </SceneContext.Provider>
  );
}

export type NodeHandle = {
  animate: (name: string, frames: Keyframes, options?: AnimationOptions) => void;
  getElement: () => HTMLDivElement | null;
};

export type TransformProps = PartialTransform3D & {
  position?: Partial<Vec3>;
  rotation?: Partial<Vec3>;
  scale?: Partial<Vec3>;
};

export type Group3DProps = TransformProps & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  size?: Partial<Size3>;
  origin?: string;
};

export const Group3D = forwardRef<NodeHandle, Group3DProps>(function Group3D(
  { children, className, style, size, origin = '50% 50%', position, rotation, scale },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      animate: (name, frames, options = {}) => {
        const css = keyframesToCss(name, frames);
        ensureStyle(css);
        const element = elRef.current;
        if (!element) return;

        element.style.animation = [
          name,
          `${options.duration ?? 500}ms`,
          easingToCss(options.easing) ?? 'ease-out',
          `${options.delay ?? 0}ms`,
          String(options.iterations ?? 1),
          options.direction ?? 'normal',
          options.fillMode ?? 'both',
        ].join(' ');
      },
      getElement: () => elRef.current,
    }),
    [],
  );

  return (
    <div
      ref={elRef}
      className={className}
      style={{
        position: 'absolute',
        width: size?.x == null ? undefined : `${size.x}px`,
        height: size?.y == null ? undefined : `${size.y}px`,
        transformStyle: 'preserve-3d',
        transformOrigin: origin,
        transform: transformToCss({ position, rotation, scale }),
        ...style,
      }}
    >
      {children}
    </div>
  );
});

export type Space3DProps = Group3DProps;

export const Space3D = forwardRef<NodeHandle, Space3DProps>(function Space3D(props, ref) {
  return <Group3D ref={ref} {...props} />;
});

export type Plane3DProps = TransformProps & {
  size: Size2;
  material?: Material;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  faceStyle?: React.CSSProperties;
  origin?: string;
};

export function Plane3D({
  size,
  material,
  children,
  className,
  style,
  faceStyle,
  origin = '50% 50%',
  position,
  rotation,
  scale,
}: Plane3DProps) {
  return (
    <Group3D
      className={className}
      size={{ x: size.x, y: size.y, z: 0 }}
      origin={origin}
      position={position}
      rotation={rotation}
      scale={scale}
      style={style}
    >
      <div
        data-cube3d-plane
        style={{
          position: 'absolute',
          inset: 0,
          boxSizing: 'border-box',
          background: materialToCss(material),
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'visible',
          ...faceStyle,
        }}
      >
        {children}
      </div>
    </Group3D>
  );
}

export type Sprite3DProps = Plane3DProps & {
  alignToCamera?: boolean;
};

export function Sprite3D({ alignToCamera: _alignToCamera, faceStyle, ...props }: Sprite3DProps) {
  return (
    <Plane3D
      {...props}
      faceStyle={{
        backgroundColor: 'transparent',
        overflow: 'visible',
        ...faceStyle,
      }}
    />
  );
}

export type Cube3DProps = TransformProps & {
  size: Size3;
  material?: MaterialSolid;
  materials?: FaceMaterials;
  contrast?: number;
  faces?: Partial<Record<FaceDirection, React.ReactNode>>;
  faceClassName?: string;
  faceStyle?: React.CSSProperties | ((face: CubeFace) => React.CSSProperties | undefined);
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function Cube3D({
  size,
  material,
  materials,
  contrast = 20,
  faces,
  faceClassName,
  faceStyle,
  className,
  style,
  children,
  position,
  rotation,
  scale,
}: Cube3DProps) {
  const cubeFaces = useMemo(
    () => createBoxFaces({ size, material, materials, contrast }),
    [size.x, size.y, size.z, material?.rgba.join(','), materialKey(materials), contrast],
  );

  return (
    <Group3D
      className={className}
      size={size}
      position={position}
      rotation={rotation}
      scale={scale}
      style={{
        ...style,
      }}
    >
      {cubeFaces.map((face) => (
        <div
          key={face.direction}
          data-cube3d-face={face.direction}
          className={faceClassName}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${face.size.x}px`,
            height: `${face.size.y}px`,
            boxSizing: 'border-box',
            overflow: 'hidden',
            background: materialToCss(face.material),
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'visible',
            transform: face.transform,
            ...(typeof faceStyle === 'function' ? faceStyle(face) : faceStyle),
          }}
        >
          {faces?.[face.direction]}
        </div>
      ))}
      {children}
    </Group3D>
  );
}

export type Box3DProps = Cube3DProps;

export function Box3D(props: Box3DProps) {
  return <Cube3D {...props} />;
}

export type Extrude3DProps = TransformProps & {
  children: React.ReactNode;
  depth?: number;
  layers?: number;
  className?: string;
  style?: React.CSSProperties;
  layerClassName?: string;
  layerStyle?: React.CSSProperties | ((layer: { index: number; progress: number; isFront: boolean }) => React.CSSProperties | undefined);
};

export function Extrude3D({
  children,
  depth = 24,
  layers = 10,
  className,
  style,
  layerClassName,
  layerStyle,
  position,
  rotation,
  scale,
}: Extrude3DProps) {
  const safeLayers = Math.max(1, Math.floor(layers));
  const step = safeLayers === 1 ? 0 : depth / (safeLayers - 1);

  return (
    <Group3D className={className} position={position} rotation={rotation} scale={scale} style={style}>
      {Array.from({ length: safeLayers }, (_, index) => {
        const progress = safeLayers === 1 ? 1 : index / (safeLayers - 1);
        const isFront = index === safeLayers - 1;
        return (
          <div
            key={index}
            aria-hidden={isFront ? undefined : true}
            className={layerClassName}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${index * step}px)`,
              ...(typeof layerStyle === 'function' ? layerStyle({ index, progress, isFront }) : layerStyle),
            }}
          >
            {children}
          </div>
        );
      })}
    </Group3D>
  );
}

function materialKey(materials?: FaceMaterials): string {
  if (!materials) return '';
  return Object.entries(materials)
    .map(([direction, material]) => `${direction}:${material ? materialToCss(material) : ''}`)
    .join('|');
}
