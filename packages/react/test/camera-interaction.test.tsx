/*
    Cube3D React
    packages/react/test/camera-interaction.test.tsx

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boxPrimitive, modelNode, primitiveNode, type TimelineClip } from '@cube3d/core';
import { Camera3D, type Cube3DEventPayload, Model3D, resolveMotionPreset, Scene3D, useCamera3D, useTimeline3D } from '../src';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('@cube3d/react camera and interaction contract', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = undefined;
    container?.remove();
    container = undefined;
    vi.unstubAllGlobals();
  });

  it('renders camera as a wrapper transform without rewriting object transforms', () => {
    const model = modelNode({
      id: 'scene',
      modelName: 'scene',
      children: [
        primitiveNode({
          id: 'cube',
          primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
          transform: { position: { x: 4, y: 5, z: 6 } },
        }),
      ],
    });

    const html = renderToStaticMarkup(
      <Scene3D>
        <Camera3D state={{ position: { x: 100, y: -40, z: 10 }, rotation: { z: 15 }, zoom: 1.75, origin: '40% 60%' }}>
          <Model3D model={model} />
        </Camera3D>
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-camera="true"');
    expect(html).toContain('data-cube3d-camera-state=');
    expect(html).toContain('data-cube3d-camera-motion="idle"');
    expect(html).toContain('transform-origin:40% 60%');
    expect(html).toContain('translate3d(100px, -40px, 10px)');
    expect(html).toContain('scale3d(1.75, 1.75, 1.75)');
    expect(html).toContain('data-cube3d-path="scene/cube"');
    expect(html).toContain('translate3d(4px, 5px, 6px)');
  });

  it('moves immediately when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const api = renderCameraHarness();

    await act(async () => {
      await api.current.moveTo({ position: { x: 42, y: -8, z: 0 }, zoom: 2 }, { duration: 1000 });
    });

    expect(container?.innerHTML).toContain('translate3d(42px, -8px, 0px)');
    expect(container?.innerHTML).toContain('scale3d(2, 2, 2)');
  });

  it('interrupts an active camera motion before applying the next target', async () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const cancelAnimationFrameSpy = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameSpy);
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const api = renderCameraHarness();

    let firstMove: Promise<void>;
    await act(async () => {
      firstMove = api.current.moveTo({ position: { x: 120, y: 0, z: 0 } }, { duration: 1000 });
    });
    await act(async () => {
      await Promise.all([
        firstMove!,
        api.current.moveTo({ position: { x: -16, y: 24, z: 0 }, zoom: 1.25 }, { duration: 0 }),
      ]);
    });

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    expect(container?.innerHTML).toContain('translate3d(-16px, 24px, 0px)');
    expect(container?.innerHTML).toContain('scale3d(1.25, 1.25, 1.25)');
  });

  it('emits stable path, node, primitive, face, and face index in interaction payloads', () => {
    const model = modelNode({
      id: 'scene',
      modelName: 'scene',
      children: [
        primitiveNode({
          id: 'cube',
          primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
        }),
      ],
    });
    const facePayloads: Cube3DEventPayload[] = [];
    const nodePayloads: Cube3DEventPayload[] = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <Scene3D>
          <Model3D
            model={model}
            interactivePaths={['scene/cube']}
            onFaceClick={(event) => facePayloads.push(event)}
            onNodeClick={(event) => nodePayloads.push(event)}
          />
        </Scene3D>,
      );
    });

    const face = container.querySelector('[data-cube3d-path="scene/cube"] [data-cube3d-face="front"]');
    expect(face).toBeTruthy();
    act(() => {
      face?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(facePayloads).toHaveLength(1);
    expect(facePayloads[0]).toMatchObject({
      path: 'scene/cube',
      nodeId: 'cube',
      primitiveKind: 'box',
      face: 'front',
      faceIndex: 0,
    });
    expect(nodePayloads).toHaveLength(1);
    expect(nodePayloads[0]).toMatchObject({
      path: 'scene/cube',
      nodeId: 'cube',
      primitiveKind: 'box',
    });
  });

  it('applies node transform overrides without mutating the core model transform', () => {
    const cube = primitiveNode({
      id: 'cube',
      primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
      transform: { position: { x: 4, y: 5, z: 6 }, rotation: { z: 10 } },
    });
    const model = modelNode({
      id: 'scene',
      modelName: 'scene',
      children: [cube],
    });

    const html = renderToStaticMarkup(
      <Scene3D>
        <Model3D
          model={model}
          nodeTransformOverride={(_node, path) => (path === 'scene/cube' ? { position: { z: 18 }, scale: { x: 1.1, y: 1.1, z: 1.1 } } : undefined)}
        />
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-path="scene/cube"');
    expect(html).toContain('translate3d(4px, 5px, 18px)');
    expect(html).toContain('rotateZ(10deg)');
    expect(html).toContain('scale3d(1.1, 1.1, 1.1)');
    expect(cube.transform.position).toEqual({ x: 4, y: 5, z: 6 });
    expect(cube.transform.scale).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('resolves deterministic motion presets for interaction feedback', () => {
    expect(resolveMotionPreset('hoverLift', { active: true })).toEqual({ position: { z: 12 } });
    expect(resolveMotionPreset('pressDown', { active: true })).toMatchObject({ position: { z: -5 } });
    expect(resolveMotionPreset('openClose', { progress: 0.5 })).toEqual({ rotation: { y: 36 } });
    expect(resolveMotionPreset('rotateLoop', { progress: 0.25 })).toEqual({ rotation: { z: 90 } });
  });

  it('uses timeline evaluation as renderer-only node transform overrides', () => {
    const cube = primitiveNode({
      id: 'cube',
      primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
      transform: { position: { x: 4, y: 5, z: 6 } },
    });
    const model = modelNode({ id: 'scene', modelName: 'scene', children: [cube] });
    const clip = timelineClip();
    const api = { current: undefined as unknown as ReturnType<typeof useTimeline3D> };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    function Harness() {
      api.current = useTimeline3D(clip);
      return (
        <Scene3D>
          <Model3D model={model} nodeTransformOverride={api.current.nodeTransformOverride} />
          <span data-timeline-status={api.current.status} data-timeline-time={api.current.time} />
        </Scene3D>
      );
    }

    act(() => {
      root?.render(<Harness />);
    });

    expect(container.innerHTML).toContain('translate3d(4px, 5px, 0px)');

    act(() => {
      api.current.seek(500);
    });

    expect(container.innerHTML).toContain('translate3d(4px, 5px, 30px)');
    expect(container.innerHTML).toContain('rotateY(45deg)');
    expect(cube.transform.position).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('finishes timeline playback immediately when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const api = { current: undefined as unknown as ReturnType<typeof useTimeline3D> };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    function Harness() {
      api.current = useTimeline3D(timelineClip());
      return <span data-timeline-status={api.current.status} data-timeline-time={api.current.time} />;
    }

    act(() => {
      root?.render(<Harness />);
    });

    await act(async () => {
      api.current.play();
    });

    expect(container.innerHTML).toContain('data-timeline-status="done"');
    expect(container.innerHTML).toContain('data-timeline-time="1000"');
  });

  function renderCameraHarness() {
    const api = { current: undefined as unknown as ReturnType<typeof useCamera3D> };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    function Harness() {
      api.current = useCamera3D({ position: { x: 0, y: 0, z: 0 }, zoom: 1 });
      return (
        <Scene3D>
          <Camera3D state={api.current.state}>
            <div data-child />
          </Camera3D>
        </Scene3D>
      );
    }

    act(() => {
      root?.render(<Harness />);
    });

    return api;
  }

  function timelineClip(): TimelineClip {
    return {
      id: 'react-test',
      duration: 1000,
      tracks: [
        {
          targetPath: 'scene/cube',
          keyframes: [
            { at: 0, transform: { position: { z: 0 }, rotation: { y: 0 } } },
            { at: 1000, transform: { position: { z: 60 }, rotation: { y: 90 } } },
          ],
        },
      ],
    };
  }
});
