import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { boxPrimitive, primitiveNode } from '@cube3d/core';
import { Node3D, Scene3D } from '../src';

describe('@cube3d/react DOM contract', () => {
  it('emits node, primitive, face, and anchor attributes', () => {
    const node = primitiveNode({
      id: 'anchored-box',
      primitive: boxPrimitive({ size: { x: 20, y: 20, z: 20 } }),
      anchors: {
        top: { id: 'top', position: { x: 10, y: 0, z: 20 } },
      },
    });

    const html = renderToStaticMarkup(
      <Scene3D>
        <Node3D node={node} />
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-node="anchored-box"');
    expect(html).toContain('data-cube3d-path="anchored-box"');
    expect(html).toContain('data-cube3d-primitive="box"');
    expect(html).toContain('data-cube3d-anchor="top"');
    expect(html).toContain('data-cube3d-anchor-path="anchored-box/top"');
    expect(html).toContain('data-cube3d-face-index="0"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(6);
  });
});
