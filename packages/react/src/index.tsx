import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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
  Transform3D,
  TimelineClip,
  TimelineEvaluation,
  Vec3,
  ViewState,
} from '@cube3d/core';
import {
  boxPrimitive,
  composeViewTransform,
  evaluateTimeline,
  extrudePrimitive,
  getPrimitiveFaces,
  groupNode,
  interpolateViewState,
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

export type Camera3DState = {
  position?: Partial<Vec3>;
  rotation?: Partial<Vec3>;
  zoom?: number;
  origin?: string;
};

export type CameraMotionOptions = {
  duration?: number;
  easing?: string;
  signal?: AbortSignal;
};

export type Camera3DMotionState = 'idle' | 'moving';
export type Timeline3DStatus = 'idle' | 'playing' | 'paused' | 'done';

export type Camera3DProps = {
  state: Camera3DState;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  motion?: Camera3DMotionState;
};

export function Camera3D({ state, children, className, style, motion = 'idle' }: Camera3DProps) {
  const normalized = normalizeCamera3DState(state);
  const transform = composeViewTransform(cameraStateToViewState(normalized));

  return (
    <div
      data-cube3d-camera
      data-cube3d-camera-state={cameraStateToData(normalized)}
      data-cube3d-camera-motion={motion}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        transformStyle: 'preserve-3d',
        transformOrigin: normalized.origin,
        transform: transformToCss(transform),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function useCamera3D(initial: Camera3DState): {
  state: Camera3DState;
  set: (next: Camera3DState) => void;
  moveTo: (next: Camera3DState, options?: CameraMotionOptions) => Promise<void>;
  reset: () => void;
} {
  const initialRef = useRef(normalizeCamera3DState(initial));
  const stateRef = useRef(normalizeCamera3DState(initial));
  const activeMotionRef = useRef<{ frame: number | null; finish: () => void } | null>(null);
  const [state, setState] = useState<Camera3DState>(stateRef.current);

  const cancelActiveMotion = useCallback(() => {
    const activeMotion = activeMotionRef.current;
    if (!activeMotion) return;
    if (activeMotion.frame != null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(activeMotion.frame);
    }
    activeMotionRef.current = null;
    activeMotion.finish();
  }, []);

  const applyState = useCallback((next: Camera3DState) => {
    const merged = mergeCamera3DState(stateRef.current, next);
    stateRef.current = merged;
    setState(merged);
  }, []);

  const set = useCallback((next: Camera3DState) => {
    cancelActiveMotion();
    applyState(next);
  }, [applyState, cancelActiveMotion]);

  const reset = useCallback(() => {
    cancelActiveMotion();
    stateRef.current = initialRef.current;
    setState(initialRef.current);
  }, [cancelActiveMotion]);

  const moveTo = useCallback((next: Camera3DState, options: CameraMotionOptions = {}) => {
    cancelActiveMotion();
    const target = mergeCamera3DState(stateRef.current, next);
    const duration = Math.max(0, options.duration ?? 500);
    if (options.signal?.aborted || duration === 0 || prefersReducedMotion()) {
      stateRef.current = target;
      setState(target);
      return Promise.resolve();
    }

    const start = stateRef.current;
    const startView = cameraStateToViewState(start);
    const targetView = cameraStateToViewState(target);
    const easing = resolveCameraEasing(options.easing);
    const startedAt = now();

    return new Promise<void>((resolve) => {
      const finish = () => resolve();
      const abortHandler = () => {
        cancelActiveMotion();
        stateRef.current = target;
        setState(target);
      };
      options.signal?.addEventListener('abort', abortHandler, { once: true });

      const step = (timestamp: number) => {
        const progress = Math.min(1, (timestamp - startedAt) / duration);
        const eased = easing(progress);
        const view = interpolateViewState(startView, targetView, eased);
        const frameState = viewStateToCameraState(view, progress >= 1 ? target.origin : start.origin);
        stateRef.current = frameState;
        setState(frameState);
        if (progress >= 1) {
          options.signal?.removeEventListener('abort', abortHandler);
          activeMotionRef.current = null;
          resolve();
          return;
        }
        activeMotionRef.current = {
          frame: requestAnimationFrame(step),
          finish,
        };
      };

      activeMotionRef.current = {
        frame: requestAnimationFrame(step),
        finish,
      };
    });
  }, [cancelActiveMotion]);

  useEffect(() => () => cancelActiveMotion(), [cancelActiveMotion]);

  return { state, set, moveTo, reset };
}

export type Timeline3DOptions = {
  initialTime?: number;
  autoplay?: boolean;
  playbackRate?: number;
};

export type Timeline3DController = {
  time: number;
  status: Timeline3DStatus;
  evaluation: TimelineEvaluation;
  transforms: Record<string, PartialTransform3D>;
  nodeTransformOverride: NodeTransformOverride;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
};

export function useTimeline3D(clip: TimelineClip, options: Timeline3DOptions = {}): Timeline3DController {
  const playbackRate = Math.max(0.0001, options.playbackRate ?? 1);
  const [time, setTime] = useState(options.initialTime ?? 0);
  const [status, setStatus] = useState<Timeline3DStatus>(options.autoplay ? 'playing' : 'idle');
  const timeRef = useRef(time);

  const setTimelineTime = useCallback((next: number) => {
    const safeTime = Number.isFinite(next) ? next : 0;
    timeRef.current = safeTime;
    setTime(safeTime);
  }, []);

  const play = useCallback(() => {
    const currentEvaluation = evaluateTimeline(clip, timeRef.current);
    if (currentEvaluation.state.done) setTimelineTime(0);
    setStatus('playing');
  }, [clip, setTimelineTime]);

  const pause = useCallback(() => setStatus('paused'), []);

  const stop = useCallback(() => {
    setStatus('idle');
    setTimelineTime(0);
  }, [setTimelineTime]);

  const seek = useCallback((next: number) => {
    setTimelineTime(next);
    if (status === 'done') setStatus('paused');
  }, [setTimelineTime, status]);

  useEffect(() => {
    if (status !== 'playing') return undefined;
    const endTime = Math.max(0, (clip.delay ?? 0) + clip.duration);
    if (prefersReducedMotion()) {
      setTimelineTime(endTime);
      setStatus('done');
      return undefined;
    }

    let frame: number | null = null;
    const startedAt = now();
    const startTime = timeRef.current;
    const step = (timestamp: number) => {
      const next = startTime + ((timestamp - startedAt) * playbackRate);
      const evaluation = evaluateTimeline(clip, next);
      const nextTime = evaluation.state.done ? endTime : next;
      setTimelineTime(nextTime);
      if (evaluation.state.done) {
        setStatus('done');
        return;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      if (frame != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    };
  }, [clip, playbackRate, setTimelineTime, status]);

  const evaluation = useMemo(() => evaluateTimeline(clip, time), [clip, time]);
  const nodeTransformOverride = useCallback<NodeTransformOverride>(
    (_node, path) => evaluation.transforms[path],
    [evaluation],
  );

  return {
    time,
    status,
    evaluation,
    transforms: evaluation.transforms,
    nodeTransformOverride,
    play,
    pause,
    stop,
    seek,
  };
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
  nodeTransformOverride?: NodeTransformOverride;
  className?: string;
  style?: React.CSSProperties;
  path?: string;
} & InteractionProps;

export type Cube3DEventPayload = {
  path: string;
  nodeId: string;
  modelName?: string;
  primitiveKind?: string;
  face?: FaceDirection;
  faceIndex?: number;
  nativeEvent: React.MouseEvent | React.PointerEvent;
};

export type InteractionProps = {
  interactivePaths?: string[];
  onNodeClick?: (event: Cube3DEventPayload) => void;
  onNodePointerEnter?: (event: Cube3DEventPayload) => void;
  onNodePointerLeave?: (event: Cube3DEventPayload) => void;
  onFaceClick?: (event: Cube3DEventPayload) => void;
};

export type NodeTransformOverride = (node: SceneNode, path: string) => PartialTransform3D | undefined;

export type MotionPreset =
  | 'hoverLift'
  | 'pressDown'
  | 'idleFloat'
  | 'pulse'
  | 'shake'
  | 'reveal'
  | 'openClose'
  | 'rotateLoop';

export type CameraMotionPreset =
  | 'focus'
  | 'dollyIn'
  | 'orbitReveal'
  | 'sectionTransition'
  | 'resetView';

export type MotionPresetState = {
  active?: boolean;
  progress?: number;
  intensity?: number;
};

export function resolveMotionPreset(preset: MotionPreset, state: MotionPresetState = {}): PartialTransform3D {
  const progress = clamp01(state.progress ?? (state.active ? 1 : 0));
  const intensity = state.intensity ?? 1;
  if (preset === 'hoverLift') return { position: { z: 12 * progress * intensity } };
  if (preset === 'pressDown') return { position: { z: -5 * progress * intensity }, scale: { x: 1 - 0.03 * progress, y: 1 - 0.03 * progress, z: 1 - 0.03 * progress } };
  if (preset === 'idleFloat') return { position: { z: Math.sin(progress * Math.PI * 2) * 6 * intensity } };
  if (preset === 'pulse') return { scale: { x: 1 + 0.08 * progress * intensity, y: 1 + 0.08 * progress * intensity, z: 1 + 0.08 * progress * intensity } };
  if (preset === 'shake') return { position: { x: Math.sin(progress * Math.PI * 8) * 8 * intensity } };
  if (preset === 'reveal') return { position: { z: -24 + 24 * progress }, scale: { x: progress, y: progress, z: progress } };
  if (preset === 'openClose') return { rotation: { y: 72 * progress * intensity } };
  return { rotation: { z: 360 * progress * intensity } };
}

export function Node3D({
  node,
  children,
  faceContent,
  nodeFaceContent,
  faceClassName,
  faceStyle,
  nodeFaceStyle,
  nodeTransformOverride,
  className,
  style,
  path,
  interactivePaths,
  onNodeClick,
  onNodePointerEnter,
  onNodePointerLeave,
  onFaceClick,
}: Node3DProps) {
  const primitive = node.primitive;
  const faces = primitive ? getPrimitiveFaces(primitive) : [];
  const resolvedFaceContent = faceContent ?? contentForNode(nodeFaceContent?.[node.id]);
  const nodePath = path ?? node.id;
  const renderedTransform = mergeTransformOverride(node.transform, nodeTransformOverride?.(node, nodePath));
  const interaction = {
    interactivePaths,
    onNodeClick,
    onNodePointerEnter,
    onNodePointerLeave,
    onFaceClick,
  };
  const hasInteraction = hasInteractionProps(interaction);
  const isInteractive = isInteractivePath(nodePath, interactivePaths);

  return (
    <div
      data-cube3d-node={node.id}
      data-cube3d-path={nodePath}
      data-cube3d-model={node.kind === 'model' ? node.modelName : undefined}
      data-cube3d-primitive={primitive?.kind}
      data-cube3d-pivot={renderedTransform.pivot ? vec3ToData(renderedTransform.pivot) : undefined}
      data-cube3d-interactive={hasInteraction && isInteractive ? true : undefined}
      className={className}
      onClick={hasInteraction && isInteractive && onNodeClick ? (event) => onNodeClick(createEventPayload(node, nodePath, event)) : undefined}
      onPointerEnter={hasInteraction && isInteractive && onNodePointerEnter ? (event) => onNodePointerEnter(createEventPayload(node, nodePath, event)) : undefined}
      onPointerLeave={hasInteraction && isInteractive && onNodePointerLeave ? (event) => onNodePointerLeave(createEventPayload(node, nodePath, event)) : undefined}
      style={{
        position: 'absolute',
        width: primitive ? `${primitiveSize(primitive).x}px` : undefined,
        height: primitive ? `${primitiveSize(primitive).y}px` : undefined,
        transformStyle: 'preserve-3d',
        transformOrigin: renderedTransform.pivot ? pivotToCss(renderedTransform.pivot) : '50% 50%',
        transform: transformToCss(renderedTransform),
        pointerEvents: hasInteraction && isInteractive ? 'auto' : style?.pointerEvents,
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
        node,
        nodePath,
        interaction,
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
          nodeTransformOverride={nodeTransformOverride}
          interactivePaths={interactivePaths}
          onNodeClick={onNodeClick}
          onNodePointerEnter={onNodePointerEnter}
          onNodePointerLeave={onNodePointerLeave}
          onFaceClick={onFaceClick}
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
  node?: SceneNode,
  nodePath?: string,
  interaction?: InteractionProps,
) {
  return faces.map((face, index) => {
    const isExtrude = primitive.kind === 'extrude';
    const faceChildren = isExtrude ? faceContent?.[face.direction] ?? children : faceContent?.[face.direction];
    const hasInteraction = interaction ? hasInteractionProps(interaction) : false;
    const isInteractive = nodePath ? isInteractivePath(nodePath, interaction?.interactivePaths) : false;
    return (
      <div
        key={`${face.direction}-${index}`}
        data-cube3d-face={face.direction}
        data-cube3d-face-index={index}
        data-cube3d-layer-index={isExtrude ? index : undefined}
        data-cube3d-plane={primitive.kind === 'plane' ? true : undefined}
        data-cube3d-interactive={hasInteraction && isInteractive ? true : undefined}
        className={faceClassName}
        onClick={hasInteraction && isInteractive && node && nodePath && interaction?.onFaceClick
          ? (event) => interaction.onFaceClick?.(createEventPayload(node, nodePath, event, face, index))
          : undefined}
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
          pointerEvents: hasInteraction ? (isInteractive ? 'auto' : 'none') : undefined,
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

function mergeTransformOverride(base: PartialTransform3D, override?: PartialTransform3D): Transform3D {
  if (!override) return normalizeTransform(base);
  const normalized = normalizeTransform(base);
  return normalizeTransform({
    position: { ...normalized.position, ...override.position },
    rotation: { ...normalized.rotation, ...override.rotation },
    scale: { ...normalized.scale, ...override.scale },
    pivot: override.pivot || normalized.pivot
      ? { ...(normalized.pivot ?? { x: 0, y: 0, z: 0 }), ...override.pivot }
      : undefined,
  });
}

type NormalizedCamera3DState = {
  position: Vec3;
  rotation: Vec3;
  zoom: number;
  origin: string;
};

function normalizeCamera3DState(state?: Camera3DState): NormalizedCamera3DState {
  return {
    position: vec3FromPartial(state?.position),
    rotation: vec3FromPartial(state?.rotation),
    zoom: Number.isFinite(state?.zoom) && state?.zoom != null ? state.zoom : 1,
    origin: state?.origin ?? '50% 50%',
  };
}

function mergeCamera3DState(current: Camera3DState, next: Camera3DState): NormalizedCamera3DState {
  const normalizedCurrent = normalizeCamera3DState(current);
  return {
    position: { ...normalizedCurrent.position, ...next.position },
    rotation: { ...normalizedCurrent.rotation, ...next.rotation },
    zoom: Number.isFinite(next.zoom) && next.zoom != null ? next.zoom : normalizedCurrent.zoom,
    origin: next.origin ?? normalizedCurrent.origin,
  };
}

function cameraStateToViewState(state: NormalizedCamera3DState): ViewState {
  return {
    position: state.position,
    rotation: state.rotation,
    zoom: state.zoom,
  };
}

function viewStateToCameraState(view: ViewState, origin = '50% 50%'): NormalizedCamera3DState {
  return {
    position: view.position,
    rotation: view.rotation,
    zoom: view.zoom,
    origin,
  };
}

function cameraStateToData(state: NormalizedCamera3DState): string {
  return JSON.stringify({
    position: state.position,
    rotation: state.rotation,
    zoom: state.zoom,
    origin: state.origin,
  });
}

function vec3FromPartial(value?: Partial<Vec3>): Vec3 {
  return {
    x: value?.x ?? 0,
    y: value?.y ?? 0,
    z: value?.z ?? 0,
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function resolveCameraEasing(easing = 'ease-out'): (progress: number) => number {
  if (easing === 'linear') return (progress) => progress;
  if (easing === 'ease-in') return (progress) => progress * progress;
  if (easing === 'ease-in-out') {
    return (progress) => (progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2);
  }
  return (progress) => 1 - (1 - progress) * (1 - progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function hasInteractionProps(props: InteractionProps): boolean {
  return Boolean(
    props.interactivePaths?.length ||
    props.onNodeClick ||
    props.onNodePointerEnter ||
    props.onNodePointerLeave ||
    props.onFaceClick,
  );
}

function isInteractivePath(path: string, interactivePaths?: string[]): boolean {
  if (!interactivePaths || interactivePaths.length === 0) return true;
  return interactivePaths.includes(path);
}

function createEventPayload(
  node: SceneNode,
  path: string,
  nativeEvent: React.MouseEvent | React.PointerEvent,
  face?: FaceDescriptor,
  faceIndex?: number,
): Cube3DEventPayload {
  return {
    path,
    nodeId: node.id,
    modelName: node.modelName,
    primitiveKind: node.primitive?.kind,
    face: face?.direction,
    faceIndex,
    nativeEvent,
  };
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
