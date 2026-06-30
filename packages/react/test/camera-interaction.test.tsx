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
import { boxPrimitive, modelNode, primitiveNode } from '@cube3d/core';
import { Camera3D, type Cube3DEventPayload, Model3D, Scene3D, useCamera3D } from '../src';

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
});
