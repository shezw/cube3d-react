import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Scene3D, Group3D, Cube3D } from '@cube3d/react';

describe('React components render', () => {
  it('renders a basic scene with a cube', () => {
    const { container } = render(
      <Scene3D perspective={900}>
        <Group3D rotation={{ x: -120, y: 0, z: 45 }}>
          <Cube3D size={{ x: 100, y: 100, z: 100 }} material={{ kind: 'solid', rgba: [200,200,200,1], contrast: 20 }} />
        </Group3D>
      </Scene3D>
    );
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});
