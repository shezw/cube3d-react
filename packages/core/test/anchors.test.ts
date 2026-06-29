import { describe, expect, it } from 'vitest';
import { attach, boxPrimitive, defineModel, part, resolveModel, resolveScene, validateModel } from '../src/index';

describe('@cube3d/core anchors', () => {
  it('aligns child anchors to parent anchors when resolving a model', () => {
    const character = defineModel('character', [
      part('body', boxPrimitive({ size: { x: 80, y: 80, z: 60 } }), {
        anchors: { neck: { id: 'neck', position: { x: 40, y: 0, z: 60 } } },
      }),
      part('head', boxPrimitive({ size: { x: 50, y: 50, z: 50 } }), {
        anchors: { bottom: { id: 'bottom', position: { x: 25, y: 50, z: 0 } } },
      }),
    ], {
      attachments: [attach('head', 'bottom', 'body', 'neck')],
    });

    expect(validateModel(character)).toEqual([]);
    const world = resolveScene(resolveModel(character));
    const body = world.children.find((child) => child.node.id === 'body')!;
    const head = world.children.find((child) => child.node.id === 'head')!;
    expect(head.worldAnchors.bottom.position).toEqual(body.worldAnchors.neck.position);
  });

  it('reports missing anchors', () => {
    const broken = defineModel('broken', [
      part('a', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
      part('b', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
    ], {
      attachments: [attach('b', 'bottom', 'a', 'top')],
    });

    expect(validateModel(broken).map((issue) => issue.code)).toEqual(['missing-anchor', 'missing-anchor']);
  });
});
