import { describe, expect, it } from 'vitest';
import { attach, boxPrimitive, defineModel, groupNode, part, primitiveNode, validateModel, validateScene } from '../src/index';

describe('@cube3d/core validation', () => {
  it('rejects empty models', () => {
    expect(validateModel(defineModel('empty', [])).map((issue) => issue.code)).toEqual(['empty-model']);
  });

  it('rejects invalid primitive dimensions', () => {
    const node = primitiveNode({ id: 'bad', primitive: boxPrimitive({ size: { x: -1, y: 10, z: 10 } }) });
    expect(validateScene(node).map((issue) => issue.code)).toEqual(['invalid-size']);
  });

  it('rejects negative z, NaN and infinite primitive dimensions', () => {
    expect(validateScene(primitiveNode({ id: 'bad-z', primitive: boxPrimitive({ size: { x: 1, y: 1, z: -1 } }) })).map((issue) => issue.code)).toEqual(['invalid-size']);
    expect(validateScene(primitiveNode({ id: 'bad-nan', primitive: boxPrimitive({ size: { x: Number.NaN, y: 1, z: 1 } }) })).map((issue) => issue.code)).toEqual(['invalid-size']);
    expect(validateScene(primitiveNode({ id: 'bad-inf', primitive: boxPrimitive({ size: { x: 1, y: Infinity, z: 1 } }) })).map((issue) => issue.code)).toEqual(['invalid-size']);
  });

  it('rejects empty ids, invalid transforms and duplicate child ids', () => {
    const scene = groupNode({
      id: 'root',
      children: [
        primitiveNode({
          id: '',
          primitive: boxPrimitive({ size: { x: 10, y: 10, z: 10 } }),
          transform: { position: { x: Number.NaN } },
        }),
        primitiveNode({ id: 'dupe', primitive: boxPrimitive({ size: { x: 10, y: 10, z: 10 } }) }),
        primitiveNode({ id: 'dupe', primitive: boxPrimitive({ size: { x: 10, y: 10, z: 10 } }) }),
      ],
    });

    expect(validateScene(scene).map((issue) => issue.code)).toEqual(['empty-id', 'invalid-transform', 'duplicate-id']);
  });

  it('rejects duplicate part ids', () => {
    const model = defineModel('dupe', [
      part('x', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
      part('x', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
    ]);
    expect(validateModel(model).map((issue) => issue.code)).toEqual(['duplicate-id']);
  });

  it('rejects missing model parts and missing anchors', () => {
    const model = defineModel('broken', [
      part('body', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
    ], {
      attachments: [
        attach('head', 'bottom', 'body', 'neck'),
        attach('body', 'neck', 'ghost', 'top'),
        attach('body', 'neck', 'body', 'neck'),
      ],
    });

    expect(validateModel(model).map((issue) => issue.code)).toEqual([
      'missing-part',
      'missing-part',
      'missing-anchor',
      'missing-anchor',
    ]);
  });
});
