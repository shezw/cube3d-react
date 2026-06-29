/*
    Cube3D React
    packages/react-example/test/browser/cover-scene.spec.ts
    Repository: https://github.com/shezw/cube3d-react
*/

import { expect, test } from '@playwright/test';

test.describe('cover scene browser structure', () => {
  test('renders visible model-driven objects with aligned projected anchors', async ({ page }) => {
    await page.goto('/?demo=cover-scene');
    await expect(page.locator('[data-cube3d-model="character"]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-model="controller"]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-model="camera"]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-model="island"]')).toHaveCount(1);

    const scene = await page.evaluate(() => {
      const root = document.getElementById('root')?.getBoundingClientRect();
      return {
        rootArea: root ? root.width * root.height : 0,
        bodyText: document.body.innerText,
        modelAreas: {
          character: modelArea('character'),
          controller: modelArea('controller'),
          camera: modelArea('camera'),
          island: modelArea('island'),
        },
        keyPaths: [
          'cover-scene/character/body',
          'cover-scene/character/head',
          'cover-scene/character/controller',
          'cover-scene/character/leftHand',
          'cover-scene/character/rightHand',
        ].map((path) => ({ path, exists: Boolean(document.querySelector(`[data-cube3d-path="${path}"]`)) })),
        anchorDistances: {
          headToNeck: anchorDistance('cover-scene/character/head', 'bottom', 'cover-scene/character/neck', 'top'),
          hatToHead: anchorDistance('cover-scene/character/hatBrim', 'bottom', 'cover-scene/character/head', 'top'),
          leftGrip: anchorDistance('cover-scene/character/leftHand', 'grip', 'cover-scene/character/controller', 'leftGrip'),
          rightGrip: anchorDistance('cover-scene/character/rightHand', 'grip', 'cover-scene/character/controller', 'rightGrip'),
        },
      };

      function modelArea(modelName: string) {
        const model = document.querySelector(`[data-cube3d-model="${modelName}"]`);
        const path = model?.getAttribute('data-cube3d-path');
        if (!path) return 0;
        const faces = Array.from(document.querySelectorAll(`[data-cube3d-path="${path}"] [data-cube3d-face], [data-cube3d-path^="${path}/"] [data-cube3d-face]`));
        const rects = faces.map((face) => face.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
        if (rects.length === 0) return 0;
        const left = Math.min(...rects.map((rect) => rect.left));
        const top = Math.min(...rects.map((rect) => rect.top));
        const right = Math.max(...rects.map((rect) => rect.right));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        return Math.max(0, right - left) * Math.max(0, bottom - top);
      }

      function anchorDistance(aPath: string, aAnchor: string, bPath: string, bAnchor: string) {
        const a = anchorPoint(aPath, aAnchor);
        const b = anchorPoint(bPath, bAnchor);
        if (!a || !b) return Number.POSITIVE_INFINITY;
        return Math.hypot(a.x - b.x, a.y - b.y);
      }

      function anchorPoint(path: string, anchor: string) {
        const element = document.querySelector(`[data-cube3d-path="${path}"] > [data-cube3d-anchor="${anchor}"]`);
        if (!element) return undefined;
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }
    });

    expect(scene.rootArea).toBeGreaterThan(0);
    expect(scene.bodyText).toContain('Cover Scene');
    expect(scene.modelAreas.character).toBeGreaterThan(1_000);
    expect(scene.modelAreas.controller).toBeGreaterThan(300);
    expect(scene.modelAreas.camera).toBeGreaterThan(300);
    expect(scene.modelAreas.island).toBeGreaterThan(10_000);
    expect(scene.keyPaths.every((item) => item.exists)).toBe(true);
    expect(scene.anchorDistances.headToNeck).toBeLessThan(2);
    expect(scene.anchorDistances.hatToHead).toBeLessThan(2);
    expect(scene.anchorDistances.leftGrip).toBeLessThan(2);
    expect(scene.anchorDistances.rightGrip).toBeLessThan(2);
  });
});
