import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { boxPrimitive, extrudePrimitive, modelNode, primitiveNode } from '@cube3d/core';
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

  it('renders nodeFaceContent inside extrude layers', () => {
    const model = modelNode({
      id: 'text',
      modelName: 'text',
      children: [
        primitiveNode({
          id: 'word',
          primitive: extrudePrimitive({ size: { x: 80, y: 24 }, depth: 12, layers: 4 }),
        }),
      ],
    });

    const html = renderToStaticMarkup(
      <Scene3D>
        <Model3D model={model} nodeFaceContent={{ word: { front: <span>WORD</span> } }} />
      </Scene3D>,
    );

    expect(html).toContain('WORD');
    expect(html.match(/data-cube3d-layer-index=/g)).toHaveLength(4);
  });
});
