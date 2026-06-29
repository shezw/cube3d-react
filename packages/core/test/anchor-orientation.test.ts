/*
    Cube3D React
    packages/core/test/anchor-orientation.test.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { describe, expect, it } from 'vitest';
import {
  angleBetweenVec3,
  attachWithOrientation,
  boxPrimitive,
  defineModel,
  part,
  resolveModel,
  resolveScene,
} from '../src/index';

describe('@cube3d/core anchor orientation', () => {
  it('transforms anchor normal and tangent into world space', () => {
    const scene = resolveScene(resolveModel(defineModel('oriented', [
      part('base', boxPrimitive({ size: { x: 40, y: 20, z: 20 } }), {
        transform: { position: { x: 60, y: 40, z: 0 }, rotation: { z: 90 } },
        anchors: {
          socket: {
            id: 'socket',
            position: { x: 20, y: 10, z: 20 },
            normal: { x: 1, y: 0, z: 0 },
            tangent: { x: 0, y: 1, z: 0 },
          },
        },
      }),
    ])));

    const socket = scene.children[0].worldAnchors.socket;
    expect(socket.position.x).toBeCloseTo(50, 4);
    expect(socket.position.y).toBeCloseTo(60, 4);
    expect(socket.normal).toBeTruthy();
    expect(socket.tangent).toBeTruthy();
    expect(socket.normal!.x).toBeCloseTo(0, 4);
    expect(socket.normal!.y).toBeCloseTo(1, 4);
    expect(socket.tangent!.x).toBeCloseTo(-1, 4);
    expect(socket.tangent!.y).toBeCloseTo(0, 4);
  });

  it('aligns explicit orientation attachments by anchor rotation', () => {
    const model = defineModel('connector', [
      part('socket', boxPrimitive({ size: { x: 40, y: 28, z: 18 } }), {
        transform: { position: { x: 120, y: 80, z: 10 }, rotation: { z: 35 } },
        anchors: {
          out: {
            id: 'out',
            position: { x: 40, y: 14, z: 18 },
            rotation: { z: 20 },
            normal: { x: 1, y: 0, z: 0 },
          },
        },
      }),
      part('plug', boxPrimitive({ size: { x: 28, y: 18, z: 18 } }), {
        anchors: {
          in: {
            id: 'in',
            position: { x: 0, y: 9, z: 18 },
            rotation: { z: -10 },
            normal: { x: 1, y: 0, z: 0 },
          },
        },
      }),
    ], {
      attachments: [attachWithOrientation('plug', 'in', 'socket', 'out')],
    });

    const scene = resolveScene(resolveModel(model));
    const socket = scene.children[0].worldAnchors.out;
    const plug = scene.children[1].worldAnchors.in;

    expect(plug.position.x).toBeCloseTo(socket.position.x, 4);
    expect(plug.position.y).toBeCloseTo(socket.position.y, 4);
    expect(scene.children[1].node.transform.rotation.z).toBeCloseTo(65, 4);
    expect(angleBetweenVec3(socket.normal!, plug.normal!)).toBeLessThan(0.001);
  });
});
