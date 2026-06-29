/*
    Cube3D React
    packages/react/test/renderer-core-contract.test.tsx
    Repository: https://github.com/shezw/cube3d-react
*/

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { boxPrimitive, getPrimitiveFaces, modelNode, primitiveNode } from '@cube3d/core';
import { Box3D, Model3D, Scene3D } from '../src';

describe('@cube3d/react renderer and core contract', () => {
  it('renders one DOM face for each core face descriptor with stable path and index', () => {
    const primitive = boxPrimitive({ size: { x: 32, y: 24, z: 16 } });
    const model = modelNode({
      id: 'shape',
      modelName: 'shape',
      children: [
        primitiveNode({
          id: 'box',
          primitive,
          transform: { position: { x: 4, y: 5, z: 6 }, rotation: { z: 12 } },
        }),
      ],
    });
    const faces = getPrimitiveFaces(primitive);

    const html = renderToStaticMarkup(
      <Scene3D>
        <Model3D model={model} />
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-model="shape"');
    expect(html).toContain('data-cube3d-path="shape/box"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(faces.length);
    for (const [index, face] of faces.entries()) {
      expect(html).toContain(`data-cube3d-face="${face.direction}"`);
      expect(html).toContain(`data-cube3d-face-index="${index}"`);
      expect(html).toContain(`width:${face.size.x}px`);
      expect(html).toContain(`height:${face.size.y}px`);
    }
    expect(html).toContain('translate3d(4px, 5px, 6px)');
    expect(html).toContain('rotateZ(12deg)');
  });

  it('keeps JSX and model APIs semantically equivalent for a single box primitive', () => {
    const size = { x: 20, y: 30, z: 40 };
    const jsxHtml = renderToStaticMarkup(
      <Scene3D>
        <Box3D id="box" size={size} position={{ x: 1, y: 2, z: 3 }} />
      </Scene3D>,
    );
    const modelHtml = renderToStaticMarkup(
      <Scene3D>
        <Model3D model={modelNode({
          id: 'box',
          modelName: 'box',
          children: [
            primitiveNode({
              id: 'box',
              primitive: boxPrimitive({ size, contrast: 20 }),
              transform: { position: { x: 1, y: 2, z: 3 } },
            }),
          ],
        })} />
      </Scene3D>,
    );

    expect(jsxHtml.match(/data-cube3d-face=/g)).toHaveLength(modelHtml.match(/data-cube3d-face=/g)!.length);
    expect(jsxHtml).toContain('data-cube3d-primitive="box"');
    expect(modelHtml).toContain('data-cube3d-primitive="box"');
    expect(jsxHtml).toContain('translate3d(1px, 2px, 3px)');
    expect(modelHtml).toContain('translate3d(1px, 2px, 3px)');
  });
});
