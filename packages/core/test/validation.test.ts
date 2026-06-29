import { describe, expect, it } from 'vitest';
import { boxPrimitive, defineModel, part, primitiveNode, validateModel, validateScene } from '../src/index';

describe('@cube3d/core validation', () => {
  it('rejects empty models', () => {
    expect(validateModel(defineModel('empty', [])).map((issue) => issue.code)).toEqual(['empty-model']);
  });

  it('rejects invalid primitive dimensions', () => {
    const node = primitiveNode({ id: 'bad', primitive: boxPrimitive({ size: { x: -1, y: 10, z: 10 } }) });
    expect(validateScene(node).map((issue) => issue.code)).toEqual(['invalid-size']);
  });

  it('rejects duplicate part ids', () => {
    const model = defineModel('dupe', [
      part('x', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
      part('x', boxPrimitive({ size: { x: 10, y: 10, z: 10 } })),
    ]);
    expect(validateModel(model).map((issue) => issue.code)).toEqual(['duplicate-id']);
  });
});
