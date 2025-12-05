import React, { createContext, useContext, useMemo, useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import type { Vec3, Size3, MaterialSolid, Cube as CoreCube } from '@cube3d/core';
import { Cube } from '@cube3d/core';
import { keyframesToCss, ensureStyle, easingToCss } from '@cube3d/css-renderer';

export type Scene3DProps = {
  children?: React.ReactNode;
  perspective?: number;
  origin?: string; // e.g. '50% 50%'
  reducedMotion?: boolean;
};

type SceneCtx = { perspective?: number; origin?: string; reducedMotion?: boolean };
const SceneContext = createContext<SceneCtx>({});
export function useScene3D() { return useContext(SceneContext); }

export function Scene3D({ children, perspective, origin, reducedMotion }: Scene3DProps) {
  const ctx = useMemo(() => ({ perspective, origin, reducedMotion }), [perspective, origin, reducedMotion]);
  const style: React.CSSProperties = useMemo(() => ({
    perspective: perspective ? `${perspective}px` : undefined,
    perspectiveOrigin: origin,
    transformStyle: 'preserve-3d'
  }), [perspective, origin]);
  return (
    <SceneContext.Provider value={ctx}>
      <div style={style}>{children}</div>
    </SceneContext.Provider>
  );
}

export type NodeHandle = {
  animate: (name: string, frames: Parameters<typeof keyframesToCss>[1], options?: { duration?: number; easing?: string }) => void;
  getElement: () => HTMLDivElement | null;
};

export type Group3DProps = {
  children?: React.ReactNode;
  size?: Size3;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  className?: string;
  style?: React.CSSProperties;
};

export const Group3D = forwardRef<NodeHandle, Group3DProps>(function Group3D(
  { children, className, style, position, rotation, scale }: Group3DProps,
  ref: React.Ref<NodeHandle>
) {
  const elRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef<Vec3>(rotation || { x: 0, y: 0, z: 0 });
  const posRef = useRef<Vec3>(position || { x: 0, y: 0, z: 0 });
  const scaleRef = useRef<Vec3>(scale || { x: 1, y: 1, z: 1 });
  const dragging = useRef(false);
  const startPoint = useRef<{x:number;y:number}>({x:0,y:0});
  const startRot = useRef<Vec3>(rotRef.current);
  useImperativeHandle(ref, () => ({
    animate: (name: string, frames: Parameters<typeof keyframesToCss>[1], options?: { duration?: number; easing?: string }) => {
      const css = keyframesToCss(name, frames);
      const id = ensureStyle(css);
      const el = elRef.current!;
      el.style.animationName = name;
      el.style.animationDuration = `${options?.duration ?? 500}ms`;
      el.style.animationTimingFunction = options?.easing ?? 'ease-out';
      el.style.animationIterationCount = '1';
      // force reflow
      void el.offsetWidth;
      el.style.animationName = id.replace('c3d-','');
    },
    getElement: () => elRef.current
  }), []);

  const t = useMemo(() => {
    const r = rotRef.current;
    const p = posRef.current;
    const s = scaleRef.current;
    return `rotateX(${r.x}deg) rotateY(${r.y}deg) rotateZ(${r.z}deg) translate3d(${p.x}px, ${p.y}px, ${p.z}px) scale3d(${s.x}, ${s.y}, ${s.z})`;
  }, [rotRef.current.x, rotRef.current.y, rotRef.current.z, posRef.current.x, posRef.current.y, posRef.current.z, scaleRef.current.x, scaleRef.current.y, scaleRef.current.z]);

  useLayoutEffect(() => {
    rotRef.current = rotation || rotRef.current;
    posRef.current = position || posRef.current;
    scaleRef.current = scale || scaleRef.current;
  }, [rotation, position, scale]);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      startPoint.current = { x: e.clientX, y: e.clientY };
      startRot.current = { ...rotRef.current };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startPoint.current.x; // left-right
      const dy = e.clientY - startPoint.current.y; // up-down
      // Sensitivity: 0.4 deg per pixel
      const sens = 0.4;
      rotRef.current = {
        x: startRot.current.x + dy * sens, // up/down -> rotateX
        y: startRot.current.y + dx * sens, // left/right -> rotateY
        z: startRot.current.z,
      };
      // trigger re-render by updating style directly to avoid extra state
      if (el) {
        const r = rotRef.current; const p = posRef.current; const s = scaleRef.current;
        el.style.transform = `rotateX(${r.x}deg) rotateY(${r.y}deg) rotateZ(${r.z}deg) translate3d(${p.x}px, ${p.y}px, ${p.z}px) scale3d(${s.x}, ${s.y}, ${s.z})`;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return <div className={className} style={{ transformStyle: 'preserve-3d', transform: t, touchAction: 'none', ...style }} ref={elRef}>{children}</div>;
});

export type Cube3DProps = {
  size: Size3;
  material?: MaterialSolid;
  contrast?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function Cube3D({ size, material, contrast = 20, className, style, children }: Cube3DProps) {
  const cube = useMemo(() => new Cube({ size, material, contrast }), [size.x, size.y, size.z, material?.rgba?.join(','), contrast]);
  const faces = useMemo(() => buildFaces(size, material, contrast), [size, material, contrast]);
  return <div className={className} style={{ position: 'relative', width: `${size.x}px`, height: `${size.y}px`, transformStyle: 'preserve-3d', ...style }}>
    {faces.map((f: React.CSSProperties, i: number) => <div key={i} style={f} />)}
    {children}
  </div>;
}

function buildFaces(size: Size3, material?: MaterialSolid, contrast = 20) {
  const rgba = material?.rgba;
  const bg = rgba ? (c: number) => `rgba(${rgba[0]-c},${rgba[1]-c},${rgba[2]-c},${rgba[3]})` : undefined;
  const styles: React.CSSProperties[] = [];
  const W = size.x, H = size.y, Z = size.z;
  const push = (s: React.CSSProperties) => styles.push({ position: 'absolute', width: `${s.width}px`, height: `${s.height}px`, background: s.background, transform: s.transform } as any);

  // bottom (0)
  push({ width: W, height: H, background: bg ? bg(5*contrast) : undefined, transform: `translateZ(${Z/2}px)` });
  // front (1)
  push({ width: H, height: Z, background: bg ? bg(contrast) : undefined, transform: `rotateZ(-90deg) rotateX(90deg) translateX(${(Z-H)/2}px) translateZ(${H/2}px)` });
  // right (2)
  push({ width: W, height: Z, background: bg ? bg(2*contrast) : undefined, transform: `rotateZ(0deg) rotateX(90deg) translateZ(${Z/2}px)` });
  // left (3)
  push({ width: W, height: Z, background: bg ? bg(3*contrast) : undefined, transform: `rotateZ(180deg) rotateX(90deg) translateZ(${Z - (Z/2)}px)` });
  // back (4)
  push({ width: H, height: Z, background: bg ? bg(4*contrast) : undefined, transform: `rotateZ(90deg) rotateX(90deg) translateX(${-(Z-H)/2}px) translateZ(${W - (H/2)}px)` });
  // top (5)
  push({ width: W, height: H, background: bg ? bg(0) : undefined, transform: `rotateX(180deg) translateZ(${Z/2}px)` });

  return styles;
}
