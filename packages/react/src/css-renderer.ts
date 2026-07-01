/*
    Cube3D React
    packages/react/src/css-renderer.ts    2026-07-01

     ______     __  __     ______     ______     __     __
    /\  ___\   /\ \_\ \   /\  ___\   /\___  \   /\ \  _ \ \
    \ \___  \  \ \  __ \  \ \  __\   \/_/  /__  \ \ \/ ".\ \
     \/\_____\  \ \_\ \_\  \ \_____\   /\_____\  \ \__/".~\_\
      \/_____/   \/_/\/_/   \/_____/   \/_____/   \/_/   \/_/.com

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import type { Easing, Keyframes } from './core';

export function easingToCss(easing?: Easing): string | undefined {
  if (!easing) return undefined;
  if (typeof easing === 'string') return easing;
  const [a, b, c, d] = easing.cubicBezier;
  return `cubic-bezier(${a},${b},${c},${d})`;
}

export function keyframesToCss(name: string, frames: Keyframes): string {
  const body = Object.keys(frames)
    .sort((a, b) => Number(a) - Number(b))
    .map((p) => {
      const f = frames[Number(p)];
      const t = f.transform || {};
      const parts: string[] = [];
      if (t.rotateX !== undefined) parts.push(`rotateX(${unit(t.rotateX, 'deg')})`);
      if (t.rotateY !== undefined) parts.push(`rotateY(${unit(t.rotateY, 'deg')})`);
      if (t.rotateZ !== undefined) parts.push(`rotateZ(${unit(t.rotateZ, 'deg')})`);
      if (t.translateX !== undefined) parts.push(`translateX(${unit(t.translateX, 'px')})`);
      if (t.translateY !== undefined) parts.push(`translateY(${unit(t.translateY, 'px')})`);
      if (t.translateZ !== undefined) parts.push(`translateZ(${unit(t.translateZ, 'px')})`);
      if (t.scaleX !== undefined) parts.push(`scaleX(${unit(t.scaleX, '')})`);
      if (t.scaleY !== undefined) parts.push(`scaleY(${unit(t.scaleY, '')})`);
      if (t.scaleZ !== undefined) parts.push(`scaleZ(${unit(t.scaleZ, '')})`);
      const transform = parts.length ? `transform: ${parts.join(' ')};` : '';
      return `  ${p}% { ${transform} }`;
    })
    .join('\n');
  return `@keyframes ${name} {\n${body}\n}`;
}

export function ensureStyle(css: string, styleId?: string, root: Document | ShadowRoot = document): string {
  const id = styleId || `c3d-${hash(css)}`;
  const doc = root instanceof Document ? root : root.ownerDocument!;
  let el = doc.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = doc.createElement('style');
    el.id = id;
    el.textContent = css;
    if (root instanceof Document) {
      doc.head.appendChild(el);
    } else {
      root.appendChild(el);
    }
  }
  return id;
}

function unit(v: number | string, u: string): string {
  return typeof v === 'string' ? v : `${v}${u}`;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
