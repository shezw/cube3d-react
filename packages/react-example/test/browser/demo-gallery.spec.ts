/*
    cube3d-react
    packages/react-example/test/browser/demo-gallery.spec.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { writeFileSync } from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { demoDefinitions, type DemoId } from '../../src/demos/registry';

test.describe('WebGL reference demo gallery', () => {
  for (const demo of demoDefinitions) {
    test(`${demo.id} matches reference and structural contract`, async ({ page }, testInfo) => {
      await page.goto(`/?demo=${demo.id}`);
      await expect(page.locator('[data-validation-panel="reference"]')).toBeVisible();
      await expect(page.locator('[data-validation-panel="candidate"]')).toBeVisible();

      const diffRatio = await comparePanels(page, testInfo, demo.id);
      expect(diffRatio).toBeLessThan(demo.maxDiffRatio);
      await assertDemoStructure(page, demo.id);
    });
  }
});

async function comparePanels(page: Page, testInfo: TestInfo, demoId: DemoId) {
  const reference = await panelScreenshot(page.locator('[data-validation-panel="reference"]'));
  const candidate = await panelScreenshot(page.locator('[data-validation-panel="candidate"]'));
  const referencePng = PNG.sync.read(reference);
  const candidatePng = PNG.sync.read(candidate);
  expect(candidatePng.width).toBe(referencePng.width);
  expect(candidatePng.height).toBe(referencePng.height);

  const diff = new PNG({ width: referencePng.width, height: referencePng.height });
  const diffPixels = pixelmatch(referencePng.data, candidatePng.data, diff.data, referencePng.width, referencePng.height, {
    threshold: 0.8,
    includeAA: false,
  });
  const diffRatio = diffPixels / (referencePng.width * referencePng.height);
  const prefix = `${demoId}-${Math.round(diffRatio * 10000)}`;
  const referencePath = testInfo.outputPath(`${prefix}-reference.png`);
  const candidatePath = testInfo.outputPath(`${prefix}-candidate.png`);
  const diffPath = testInfo.outputPath(`${prefix}-diff.png`);
  const reportPath = testInfo.outputPath(`${prefix}-geometry-report.json`);

  writeFileSync(referencePath, reference);
  writeFileSync(candidatePath, candidate);
  writeFileSync(diffPath, PNG.sync.write(diff));
  writeFileSync(reportPath, JSON.stringify({ demoId, diffRatio, diffPixels, width: referencePng.width, height: referencePng.height }, null, 2));
  await testInfo.attach('reference', { path: referencePath, contentType: 'image/png' });
  await testInfo.attach('candidate', { path: candidatePath, contentType: 'image/png' });
  await testInfo.attach('diff', { path: diffPath, contentType: 'image/png' });
  await testInfo.attach('geometry-report', { path: reportPath, contentType: 'application/json' });
  return diffRatio;
}

async function panelScreenshot(locator: Locator) {
  return locator.screenshot({ animations: 'disabled' });
}

async function assertDemoStructure(page: Page, demoId: DemoId) {
  if (demoId === 'primitive-lab') {
    await expect(page.locator('[data-cube3d-path="box"] [data-cube3d-face]')).toHaveCount(6);
    await expect(page.locator('[data-cube3d-path="plane"] [data-cube3d-face]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-path="sprite"] [data-cube3d-face]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-path="extrude"] [data-cube3d-layer-index]')).toHaveCount(6);
    return;
  }

  if (demoId === 'transform-room') {
    for (const path of ['transform-room/parent', 'transform-room/child-a', 'transform-room/child-b', 'transform-room/child-c']) {
      await expect(page.locator(`[data-cube3d-path="${path}"]`)).toHaveCount(1);
    }
    return;
  }

  if (demoId === 'anchor-assembly') {
    await expect(page.locator('[data-cube3d-model="head-assembly"]')).toHaveCount(1);
    await expectProjectedAnchorDistance(page, 'head-assembly/head', 'bottom', 'head-assembly/neck', 'top', 2);
    await expectProjectedAnchorDistance(page, 'head-assembly/hatBrim', 'bottom', 'head-assembly/head', 'top', 2);
    return;
  }

  if (demoId === 'nested-model') {
    await expect(page.locator('[data-cube3d-model="controller"]')).toHaveCount(1);
    for (const path of ['character/controller/shell', 'character/controller/stick', 'character/leftHand', 'character/rightHand']) {
      await expect(page.locator(`[data-cube3d-path="${path}"]`)).toHaveCount(1);
    }
    await expectProjectedAnchorDistance(page, 'character/leftHand', 'grip', 'character/controller', 'leftGrip', 2);
    await expectProjectedAnchorDistance(page, 'character/rightHand', 'grip', 'character/controller', 'rightGrip', 2);
    return;
  }

  if (demoId === 'object-field') {
    for (const path of ['object-field/base', 'object-field/cubeA', 'object-field/cubeB', 'object-field/camera', 'object-field/prop']) {
      await expect(page.locator(`[data-cube3d-path="${path}"]`)).toHaveCount(1);
      await expectVisibleFaceArea(page, path);
    }
    return;
  }

  if (demoId === 'interaction-html') {
    await page.locator('[data-demo-action="cube-face"]').click();
    await expect(page.locator('[data-demo-debug]')).toContainText('button-box/front');
    await page.locator('[data-demo-action="controller-button"]').hover();
    await page.locator('[data-demo-action="controller-button"]').click();
    await expect(page.locator('[data-demo-debug]')).toContainText('controller/front');
    await page.locator('[data-demo-action="sprite-button"]').focus();
    await expect(page.locator('[data-demo-action="sprite-button"]')).toBeFocused();
    return;
  }

  await expect(page.locator('[data-cube3d-model="character"]')).toHaveCount(1);
  await expect(page.locator('[data-cube3d-model="controller"]')).toHaveCount(1);
  await expect(page.locator('[data-cube3d-model="camera"]')).toHaveCount(1);
  await expect(page.locator('[data-cube3d-model="island"]')).toHaveCount(1);
  await expectProjectedAnchorDistance(page, 'cover-scene/character/head', 'bottom', 'cover-scene/character/neck', 'top', 2);
}

async function expectProjectedAnchorDistance(page: Page, aPath: string, aAnchor: string, bPath: string, bAnchor: string, maxDistance: number) {
  const distance = await page.evaluate(
    ({ aPath, aAnchor, bPath, bAnchor }) => {
      const a = point(aPath, aAnchor);
      const b = point(bPath, bAnchor);
      if (!a || !b) return Number.POSITIVE_INFINITY;
      return Math.hypot(a.x - b.x, a.y - b.y);

      function point(path: string, anchor: string) {
        const element = document.querySelector(`[data-cube3d-path="${path}"] > [data-cube3d-anchor="${anchor}"]`);
        if (!element) return undefined;
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }
    },
    { aPath, aAnchor, bPath, bAnchor },
  );
  expect(distance).toBeLessThan(maxDistance);
}

async function expectVisibleFaceArea(page: Page, path: string) {
  const area = await page.evaluate((path) => {
    const faces = Array.from(document.querySelectorAll(`[data-cube3d-path="${path}"] [data-cube3d-face]`));
    return faces.reduce((sum, face) => {
      const rect = face.getBoundingClientRect();
      return sum + Math.max(0, rect.width) * Math.max(0, rect.height);
    }, 0);
  }, path);
  expect(area).toBeGreaterThan(0);
}
