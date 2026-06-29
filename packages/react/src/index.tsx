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
  FaceDescriptor,
  FaceDirection,
  FaceMaterials,
  Keyframes,
  Material,
  MaterialImage,
  MaterialSolid,
  PartialTransform3D,
  Primitive,
  SceneNode,
  Size2,
  Size3,
  Vec3,
} from '@cube3d/core';
import {
  boxPrimitive,
  extrudePrimitive,
  getPrimitiveFaces,
  groupNode,
  materialToCss,
  normalizeTransform,
  planePrimitive,
  primitiveNode,
  spritePrimitive,
} from '@cube3d/core';
import { easingToCss, ensureStyle, keyframesToCss } from '@cube3d/css-renderer';

export type Scene3DProps = {
  children?: React.ReactNode;
  model?: SceneNode;
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
  model,
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
        {model ? <Node3D node={model} /> : null}
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

export type Node3DProps = {
  node: SceneNode;
  children?: React.ReactNode;
  faceContent?: Partial<Record<FaceDirection, React.ReactNode>>;
  nodeFaceContent?: Record<string, React.ReactNode | Partial<Record<FaceDirection, React.ReactNode>>>;
  faceClassName?: string;
  faceStyle?: React.CSSProperties | ((face: FaceDescriptor, index: number) => React.CSSProperties | undefined);
  nodeFaceStyle?: (node: SceneNode, face: FaceDescriptor, index: number) => React.CSSProperties | undefined;
  className?: string;
  style?: React.CSSProperties;
  path?: string;
};

export function Node3D({ node, children, faceContent, nodeFaceContent, faceClassName, faceStyle, nodeFaceStyle, className, style, path }: Node3DProps) {
  const primitive = node.primitive;
  const faces = primitive ? getPrimitiveFaces(primitive) : [];
  const resolvedFaceContent = faceContent ?? contentForNode(nodeFaceContent?.[node.id]);
  const nodePath = path ?? node.id;

  return (
    <div
      data-cube3d-node={node.id}
      data-cube3d-path={nodePath}
      data-cube3d-model={node.kind === 'model' ? node.modelName : undefined}
      data-cube3d-primitive={primitive?.kind}
      data-cube3d-pivot={node.transform.pivot ? vec3ToData(node.transform.pivot) : undefined}
      className={className}
      style={{
        position: 'absolute',
        width: primitive ? `${primitiveSize(primitive).x}px` : undefined,
        height: primitive ? `${primitiveSize(primitive).y}px` : undefined,
        transformStyle: 'preserve-3d',
        transformOrigin: node.transform.pivot ? pivotToCss(node.transform.pivot) : '50% 50%',
        transform: transformToCss(node.transform),
        ...style,
      }}
    >
      {node.transform.pivot ? (
        <span
          data-cube3d-pivot-marker
          data-cube3d-pivot-path={`${nodePath}/pivot`}
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            pointerEvents: 'none',
            transform: transformToCss({ position: node.transform.pivot }),
          }}
        />
      ) : null}
      {Object.entries(node.anchors ?? {}).map(([id, anchor]) => (
        <span
          key={id}
          data-cube3d-anchor={id}
          data-cube3d-anchor-path={`${nodePath}/${id}`}
          data-cube3d-anchor-normal={anchor.normal ? vec3ToData(anchor.normal) : undefined}
          data-cube3d-anchor-tangent={anchor.tangent ? vec3ToData(anchor.tangent) : undefined}
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            pointerEvents: 'none',
            transform: transformToCss({ position: anchor.position, rotation: anchor.rotation }),
          }}
        />
      ))}

      {primitive ? renderPrimitiveFaces(
        primitive,
        faces,
        resolvedFaceContent,
        faceClassName,
        (face, index) => ({
          ...(typeof faceStyle === 'function' ? faceStyle(face, index) : faceStyle),
          ...nodeFaceStyle?.(node, face, index),
        }),
        children,
      ) : null}
      {(node.children ?? []).map((child) => (
        <Node3D
          key={child.id}
          node={child}
          path={`${nodePath}/${child.id}`}
          faceClassName={faceClassName}
          faceStyle={faceStyle}
          nodeFaceContent={nodeFaceContent}
          nodeFaceStyle={nodeFaceStyle}
        />
      ))}
      {primitive?.kind === 'extrude' ? null : children}
    </div>
  );
}

export type Model3DProps = Omit<Node3DProps, 'node'> & {
  model: SceneNode;
};

export function Model3D({ model, ...props }: Model3DProps) {
  return <Node3D node={model} {...props} />;
}

export type Part3DProps = Node3DProps;

export function Part3D(props: Part3DProps) {
  return <Node3D {...props} />;
}

export type Group3DProps = TransformProps & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  size?: Partial<Size3>;
  origin?: string;
  id?: string;
};

export const Group3D = forwardRef<NodeHandle, Group3DProps>(function Group3D(
  { children, className, style, size, origin = '50% 50%', position, rotation, scale, id = 'group' },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const node = useMemo(
    () => groupNode({ id, transform: { position, rotation, scale } }),
    [id, position?.x, position?.y, position?.z, rotation?.x, rotation?.y, rotation?.z, scale?.x, scale?.y, scale?.z],
  );

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
      data-cube3d-node={node.id}
      data-cube3d-path={node.id}
      className={className}
      style={{
        position: 'absolute',
        width: size?.x == null ? undefined : `${size.x}px`,
        height: size?.y == null ? undefined : `${size.y}px`,
        transformStyle: 'preserve-3d',
        transformOrigin: origin,
        transform: transformToCss(node.transform),
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
  id?: string;
};

export function Plane3D({
  size,
  material,
  children,
  className,
  style,
  faceStyle,
  position,
  rotation,
  scale,
  id = 'plane',
}: Plane3DProps) {
  const node = useMemo(
    () => primitiveNode({ id, primitive: planePrimitive({ size, material }), transform: { position, rotation, scale } }),
    [id, size.x, size.y, materialKey(material), position?.x, position?.y, position?.z, rotation?.x, rotation?.y, rotation?.z, scale?.x, scale?.y, scale?.z],
  );

  return <Node3D node={node} className={className} style={style} faceStyle={faceStyle}>{children}</Node3D>;
}

export type Sprite3DProps = Plane3DProps & {
  alignToCamera?: boolean;
};

export function Sprite3D({
  alignToCamera: _alignToCamera,
  size,
  material,
  children,
  className,
  style,
  faceStyle,
  position,
  rotation,
  scale,
  id = 'sprite',
}: Sprite3DProps) {
  const node = useMemo(
    () => primitiveNode({ id, primitive: spritePrimitive({ size, material }), transform: { position, rotation, scale } }),
    [id, size.x, size.y, materialKey(material), position?.x, position?.y, position?.z, rotation?.x, rotation?.y, rotation?.z, scale?.x, scale?.y, scale?.z],
  );

  return (
    <Node3D
      node={node}
      className={className}
      style={style}
      faceStyle={{
        backgroundColor: 'transparent',
        overflow: 'visible',
        ...faceStyle,
      }}
    >
      {children}
    </Node3D>
  );
}

export type Cube3DProps = TransformProps & {
  size: Size3;
  material?: MaterialSolid;
  materials?: FaceMaterials;
  contrast?: number;
  faces?: Partial<Record<FaceDirection, React.ReactNode>>;
  faceClassName?: string;
  faceStyle?: React.CSSProperties | ((face: FaceDescriptor) => React.CSSProperties | undefined);
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
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
  id = 'box',
}: Cube3DProps) {
  const node = useMemo(
    () => primitiveNode({ id, primitive: boxPrimitive({ size, material, materials, contrast }), transform: { position, rotation, scale } }),
    [id, size.x, size.y, size.z, material?.rgba.join(','), materialMapKey(materials), contrast, position?.x, position?.y, position?.z, rotation?.x, rotation?.y, rotation?.z, scale?.x, scale?.y, scale?.z],
  );

  return (
    <Node3D
      node={node}
      className={className}
      style={style}
      faceContent={faces}
      faceClassName={faceClassName}
      faceStyle={(face) => (typeof faceStyle === 'function' ? faceStyle(face) : faceStyle)}
    >
      {children}
    </Node3D>
  );
}

export type Box3DProps = Cube3DProps;

export function Box3D(props: Box3DProps) {
  return <Cube3D {...props} />;
}

export type Extrude3DProps = TransformProps & {
  children: React.ReactNode;
  size?: Size2;
  depth?: number;
  layers?: number;
  className?: string;
  style?: React.CSSProperties;
  layerClassName?: string;
  layerStyle?: React.CSSProperties | ((layer: { index: number; progress: number; isFront: boolean }) => React.CSSProperties | undefined);
  id?: string;
};

export function Extrude3D({
  children,
  size = { x: 0, y: 0 },
  depth = 24,
  layers = 10,
  className,
  style,
  layerClassName,
  layerStyle,
  position,
  rotation,
  scale,
  id = 'extrude',
}: Extrude3DProps) {
  const safeLayers = Math.max(1, Math.floor(layers));
  const node = useMemo(
    () => primitiveNode({ id, primitive: extrudePrimitive({ size, depth, layers: safeLayers }), transform: { position, rotation, scale } }),
    [id, size.x, size.y, depth, safeLayers, position?.x, position?.y, position?.z, rotation?.x, rotation?.y, rotation?.z, scale?.x, scale?.y, scale?.z],
  );

  return (
    <Node3D
      node={node}
      className={className}
      style={style}
      faceClassName={layerClassName}
      faceStyle={(face, index) => {
        const progress = safeLayers === 1 ? 1 : index / (safeLayers - 1);
        return typeof layerStyle === 'function' ? layerStyle({ index, progress, isFront: index === safeLayers - 1 }) : layerStyle;
      }}
    >
      {children}
    </Node3D>
  );
}

function renderPrimitiveFaces(
  primitive: Primitive,
  faces: FaceDescriptor[],
  faceContent?: Partial<Record<FaceDirection, React.ReactNode>>,
  faceClassName?: string,
  faceStyle?: React.CSSProperties | ((face: FaceDescriptor, index: number) => React.CSSProperties | undefined),
  children?: React.ReactNode,
) {
  return faces.map((face, index) => {
    const isExtrude = primitive.kind === 'extrude';
    const faceChildren = isExtrude ? faceContent?.[face.direction] ?? children : faceContent?.[face.direction];
    return (
      <div
        key={`${face.direction}-${index}`}
        data-cube3d-face={face.direction}
        data-cube3d-face-index={index}
        data-cube3d-layer-index={isExtrude ? index : undefined}
        data-cube3d-plane={primitive.kind === 'plane' ? true : undefined}
        className={faceClassName}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: face.size.x === 0 ? undefined : `${face.size.x}px`,
          height: face.size.y === 0 ? undefined : `${face.size.y}px`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: materialToCss(face.material),
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'visible',
          transform: `translate(-50%, -50%) ${transformToCss(face.transform)}`,
          ...(typeof faceStyle === 'function' ? faceStyle(face, index) : faceStyle),
        }}
      >
        {faceChildren}
      </div>
    );
  });
}

function primitiveSize(primitive: Primitive): Size2 {
  if (primitive.kind === 'box') return { x: primitive.size.x, y: primitive.size.y };
  return primitive.size;
}

function transformToCss(transform?: PartialTransform3D): string {
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

function pivotToCss(pivot: Vec3): string {
  return `${pivot.x}px ${pivot.y}px ${pivot.z}px`;
}

function vec3ToData(value: Vec3): string {
  return `${value.x},${value.y},${value.z}`;
}

function materialKey(material?: Material): string {
  return material ? materialToCss(material) ?? '' : '';
}

function materialMapKey(materials?: FaceMaterials): string {
  if (!materials) return '';
  return Object.entries(materials)
    .map(([direction, material]) => `${direction}:${material ? materialToCss(material) : ''}`)
    .join('|');
}

function contentForNode(content?: React.ReactNode | Partial<Record<FaceDirection, React.ReactNode>>): Partial<Record<FaceDirection, React.ReactNode>> | undefined {
  if (content == null || React.isValidElement(content) || typeof content === 'string' || typeof content === 'number') {
    return content == null ? undefined : { front: content };
  }
  return content as Partial<Record<FaceDirection, React.ReactNode>>;
}
