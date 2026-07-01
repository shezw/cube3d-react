/*
    Cube3D React
    packages/react-example/src/demos/LazyThreeReference.tsx    2026-07-01

     ______     __  __     ______     ______     __     __
    /\  ___\   /\ \_\ \   /\  ___\   /\___  \   /\ \  _ \ \
    \ \___  \  \ \  __ \  \ \  __\   \/_/  /__  \ \ \/ ".\ \
     \/\_____\  \ \_\ \_\  \ \_____\   /\_____\  \ \__/".~\_\
      \/_____/   \/_/\/_/   \/_____/   \/_____/   \/_/   \/_/.com

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import React, { lazy, Suspense } from 'react';
import { stageSize, type DemoSpec } from './registry';

const ThreeReference = lazy(() => import('./ThreeReference').then((module) => ({ default: module.ThreeReference })));

export function LazyThreeReference({ spec }: { spec: DemoSpec }) {
  return (
    <Suspense fallback={<div data-reference-loading data-design-spec={spec.id} data-design-case={spec.selectedCase ?? ''} style={fallbackStyle} />}>
      <ThreeReference spec={spec} />
    </Suspense>
  );
}

const fallbackStyle: React.CSSProperties = {
  width: stageSize.width,
  height: stageSize.height,
  overflow: 'hidden',
  background: '#20232f',
};
