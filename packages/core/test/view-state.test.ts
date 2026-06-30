/*
    Cube3D React
    packages/core/test/view-state.test.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { describe, expect, it } from 'vitest';
import {
  composeViewTransform,
  createBounds,
  fitViewToBounds,
  interpolateViewState,
  projectBoundsToRect,
} from '../src/index';

describe('@cube3d/core view state math', () => {
  it('composes a pure view state into a transform without producing CSS', () => {
    const transform = composeViewTransform({
      position: { x: 10, y: -20, z: 30 },
      rotation: { x: 12, y: 0, z: -18 },
      zoom: 1.5,
      origin: { x: 100, y: 80, z: 0 },
    });

    expect(transform.position).toEqual({ x: 10, y: -20, z: 30 });
    expect(transform.rotation).toEqual({ x: 12, y: 0, z: -18 });
    expect(transform.scale).toEqual({ x: 1.5, y: 1.5, z: 1.5 });
    expect(transform.pivot).toEqual({ x: 100, y: 80, z: 0 });
  });

  it('interpolates camera-like view state with clamped progress', () => {
    const start = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      zoom: 1,
    };
    const end = {
      position: { x: 100, y: -50, z: 20 },
      rotation: { x: 20, y: 10, z: -30 },
      zoom: 3,
    };

    expect(interpolateViewState(start, end, 0.25)).toMatchObject({
      position: { x: 25, y: -12.5, z: 5 },
      rotation: { x: 5, y: 2.5, z: -7.5 },
      zoom: 1.5,
    });
    expect(interpolateViewState(start, end, -1).position).toEqual(start.position);
    expect(interpolateViewState(start, end, 2).position).toEqual(end.position);
  });

  it('fits bounds into a viewport and returns a deterministic projected rect', () => {
    const bounds = createBounds({ x: 10, y: 20, z: 4 }, { x: 110, y: 70, z: 24 });
    const view = fitViewToBounds(bounds, {
      viewport: { x: 300, y: 200 },
      padding: 20,
      minZoom: 0.5,
      maxZoom: 4,
    });
    const rect = projectBoundsToRect(bounds, view);

    expect(view.zoom).toBeCloseTo(2.6, 4);
    expect(rect.width).toBeCloseTo(260, 4);
    expect(rect.height).toBeCloseTo(130, 4);
    expect(rect.centerX).toBeCloseTo(150, 4);
    expect(rect.centerY).toBeCloseTo(100, 4);
  });
});
