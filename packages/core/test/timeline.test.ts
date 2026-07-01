/*
    Cube3D React
    packages/core/test/timeline.test.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { describe, expect, it } from 'vitest';
import {
  easeTimelineProgress,
  evaluateTimeline,
  evaluateTimelineTrack,
  interpolatePartialTransform,
  resolveTimelineState,
  type TimelineClip,
} from '../src/index';

describe('@cube3d/core timeline math', () => {
  const clip: TimelineClip = {
    id: 'intro',
    duration: 1000,
    tracks: [
      {
        targetPath: 'scene/cube',
        keyframes: [
          { at: 0, transform: { position: { z: 0 }, rotation: { y: 0 } } },
          { at: 500, transform: { position: { z: 40 }, rotation: { y: 45 } } },
          { at: 1000, transform: { position: { z: 0 }, rotation: { y: 90 } } },
        ],
      },
    ],
  };

  it('evaluates path-keyed transform overrides at an absolute time', () => {
    const result = evaluateTimeline(clip, 250);

    expect(result.state).toMatchObject({
      time: 250,
      localTime: 250,
      progress: 0.25,
      done: false,
    });
    expect(result.transforms['scene/cube']).toEqual({
      position: { z: 20 },
      rotation: { y: 22.5 },
    });
  });

  it('does not write unspecified transform channels during interpolation', () => {
    const result = interpolatePartialTransform(
      { position: { z: 10 } },
      { position: { z: 30 }, scale: { x: 1.5 } },
      0.5,
    );

    expect(result).toEqual({
      position: { z: 20 },
      scale: { x: 1.25 },
    });
  });

  it('supports loop and alternate direction without mutating clip data', () => {
    const state = resolveTimelineState({ ...clip, loop: true, direction: 'alternate' }, 1250);
    const result = evaluateTimeline({ ...clip, loop: true, direction: 'alternate' }, 1250);

    expect(state.iteration).toBe(1);
    expect(state.direction).toBe('reverse');
    expect(state.localTime).toBe(750);
    expect(result.transforms['scene/cube']).toEqual({
      position: { z: 20 },
      rotation: { y: 67.5 },
    });
    expect(clip.tracks[0].keyframes[1].transform.position?.z).toBe(40);
  });

  it('uses deterministic easing for segment interpolation', () => {
    expect(easeTimelineProgress('linear', 0.5)).toBe(0.5);
    expect(easeTimelineProgress('ease-in', 0.5)).toBe(0.25);

    const result = evaluateTimelineTrack({
      targetPath: 'scene/eased',
      keyframes: [
        { at: 0, transform: { position: { x: 0 } }, easing: 'ease-in' },
        { at: 100, transform: { position: { x: 100 } } },
      ],
    }, 50);

    expect(result).toEqual({ position: { x: 25 } });
  });
});
