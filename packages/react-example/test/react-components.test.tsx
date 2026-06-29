import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Box3D, Extrude3D, Plane3D, Scene3D, Space3D, Sprite3D } from '@cube3d/react';
import { Character3D, characterMotionCss } from '../src/scene/Character3D';

describe('React pseudo 3D scene', () => {
  it('renders the visual target capability mix', () => {
    const html = renderToStaticMarkup(
      <Scene3D perspective={900}>
        <Space3D rotation={{ x: 58, y: 0, z: -34 }}>
          <Plane3D size={{ x: 420, y: 420 }} material={{ kind: 'solid', rgba: [50, 66, 68, 1] }} />
          <Box3D size={{ x: 112, y: 112, z: 86 }} position={{ x: 70, y: 70, z: 43 }} material={{ kind: 'solid', rgba: [214, 112, 92, 1] }} />
          <Sprite3D size={{ x: 70, y: 40 }} position={{ x: 220, y: 80, z: 92 }}>prop</Sprite3D>
          <Extrude3D depth={16} layers={8} position={{ x: 120, y: 180, z: 70 }}>ART</Extrude3D>
        </Space3D>
      </Scene3D>,
    );

    expect(html).toContain('data-cube3d-plane="true"');
    expect(html.match(/data-cube3d-face=/g)).toHaveLength(6);
    expect(html).toContain('prop');
    expect(html.match(/ART/g)).toHaveLength(8);
  });

  it('renders the player as one grouped character object', () => {
    const html = renderToStaticMarkup(
      <Scene3D>
        <Space3D rotation={{ x: 58, y: 0, z: -34 }}>
          <style>{characterMotionCss}</style>
          <Character3D position={{ x: 420, y: 18, z: 82 }} />
        </Space3D>
      </Scene3D>,
    );

    expect(html).toContain('data-scene-object="character"');
    expect(html).toContain('cube3d-character-idle');
    expect(html.match(/data-cube3d-face=/g)?.length).toBeGreaterThan(70);
  });
});
