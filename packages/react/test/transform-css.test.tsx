import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Box3D, Scene3D } from '../src';

describe('@shezw/cube3d transform CSS', () => {
  it('serializes transforms in the renderer layer', () => {
    const html = renderToStaticMarkup(
      <Scene3D>
        <Box3D id="box" size={{ x: 20, y: 20, z: 20 }} position={{ x: 1, y: 2, z: 3 }} rotation={{ z: 45 }} />
      </Scene3D>,
    );

    expect(html).toContain('translate3d(1px, 2px, 3px)');
    expect(html).toContain('rotateZ(45deg)');
  });
});
