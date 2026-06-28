import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Cube3D, Plane3D, Scene3D, Space3D } from '../src';

describe('@cube3d/react', () => {
  it('renders HTML planes and cube faces for a pseudo 3D scene', () => {
    const html = renderToStaticMarkup(
      <Scene3D>
        <Space3D rotation={{ x: 58, z: -34 }}>
          <Plane3D size={{ x: 420, y: 420 }} material={{ kind: 'solid', rgba: [50, 66, 68, 1] }} />
          <Cube3D size={{ x: 112, y: 112, z: 86 }} position={{ x: 70, y: 70, z: 43 }} />
          <Cube3D size={{ x: 76, y: 76, z: 148 }} position={{ x: 270, y: 235, z: 74 }} />
        </Space3D>
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-plane="true"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(12);
    expect(html).toContain('translate3d(270px, 235px, 74px)');
  });
});
