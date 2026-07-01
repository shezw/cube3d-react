import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Model3D, Scene3D } from '@shezw/cube3d';
import { createCoverSceneNode } from '../../src/scene/models';

describe('cover scene DOM contract', () => {
  it('renders complex objects as model nodes instead of scattered character parts', () => {
    const html = renderToStaticMarkup(
      <Scene3D perspective={1150}>
        <Model3D model={createCoverSceneNode()} />
      </Scene3D>,
    );

    expect(html.match(/data-cube3d-model="character"/g)).toHaveLength(1);
    expect(html.match(/data-cube3d-model="controller"/g)).toHaveLength(1);
    expect(html.match(/data-cube3d-model="camera"/g)).toHaveLength(1);
    expect(html.match(/data-cube3d-model="island"/g)).toHaveLength(1);
    expect(html).toContain('data-cube3d-path="cover-scene/character/body"');
    expect(html).toContain('data-cube3d-path="cover-scene/character/head"');
    expect(html).toContain('data-cube3d-path="cover-scene/character/controller"');
    expect(html).toContain('data-cube3d-path="cover-scene/character/leftHand"');
    expect(html).toContain('data-cube3d-path="cover-scene/character/rightHand"');
    expect(html.match(/data-cube3d-node="/g)?.length).toBeGreaterThan(25);
    expect(html.match(/data-cube3d-face=/g)?.length).toBeGreaterThan(110);
  });
});
