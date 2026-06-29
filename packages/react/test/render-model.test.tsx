import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { boxPrimitive, modelNode, primitiveNode } from '@cube3d/core';
import { Model3D, Scene3D } from '../src';

describe('@cube3d/react model rendering', () => {
  it('renders a core model as semantic DOM', () => {
    const model = modelNode({
      id: 'character',
      modelName: 'character',
      children: [
        primitiveNode({ id: 'body', primitive: boxPrimitive({ size: { x: 80, y: 70, z: 60 } }) }),
      ],
    });

    const html = renderToStaticMarkup(
      <Scene3D>
        <Model3D model={model} />
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-model="character"');
    expect(html).toContain('data-cube3d-node="body"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(6);
  });
});
