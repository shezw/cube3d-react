import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Box3D, Cube3D, Extrude3D, Plane3D, Scene3D, Space3D, Sprite3D } from '../src';

describe('@shezw/cube3d compatibility components', () => {
  it('keeps JSX box and cube APIs backed by primitive nodes', () => {
    const html = renderToStaticMarkup(
      <Scene3D>
        <Space3D rotation={{ x: 58, z: -34 }}>
          <Plane3D id="floor" size={{ x: 420, y: 420 }} material={{ kind: 'solid', rgba: [50, 66, 68, 1] }} />
          <Cube3D id="cube-a" size={{ x: 112, y: 112, z: 86 }} position={{ x: 70, y: 70, z: 43 }} />
          <Box3D id="cube-b" size={{ x: 76, y: 76, z: 148 }} position={{ x: 270, y: 235, z: 74 }} />
        </Space3D>
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-node="floor"');
    expect(html).toContain('data-cube3d-primitive="plane"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(13);
    expect(html).toContain('translate3d(270px, 235px, 74px)');
  });

  it('renders sprites and extrusion layers', () => {
    const html = renderToStaticMarkup(
      <Scene3D>
        <Sprite3D id="sprite" size={{ x: 60, y: 40 }} position={{ x: 10, y: 10, z: 40 }}>
          icon
        </Sprite3D>
        <Extrude3D id="word" depth={12} layers={4} position={{ x: 20, y: 20, z: 50 }}>
          TEXT
        </Extrude3D>
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-primitive="sprite"');
    expect(html).toContain('data-cube3d-path="sprite"');
    expect(html).toContain('icon');
    expect(html.match(/TEXT/g)).toHaveLength(4);
    expect(html).toContain('data-cube3d-layer-index="3"');
    expect(html).toContain('translate3d(0px, 0px, 12px)');
  });
});
