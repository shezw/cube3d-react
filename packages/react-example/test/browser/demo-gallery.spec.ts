/*
    cube3d-react
    packages/react-example/test/browser/demo-gallery.spec.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { demoSpecs, type DemoId, type DemoSpec } from '../../src/demos/registry';
import { flattenDesignNodes } from '../../src/demos/sceneFactory';

test.describe('WebGL reference demo gallery', () => {
  test('reference and candidate renderers are guarded against per-demo hardcoded scenes', async () => {
    const files = [
      resolve(process.cwd(), 'src/demos/ThreeReference.tsx'),
      resolve(process.cwd(), 'src/demos/CubeCandidate.tsx'),
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('referenceBoxes');
      expect(source).not.toMatch(/demoId\s*===/);
      expect(source).toContain('createSceneFromSpec');
    }
  });

  for (const demo of demoSpecs) {
    test(`${demo.id} matches shared-spec reference and structural contract`, async ({ page }, testInfo) => {
      await page.goto(`/?demo=${demo.id}`);
      await expect(page.locator('[data-validation-panel="reference"]')).toBeVisible();
      await expect(page.locator('[data-validation-panel="candidate"]')).toBeVisible();
      await assertSharedSpecProvenance(page, demo);

      await comparePanels(page, testInfo, demo.id);
      await assertDemoStructure(page, demo);
      await assertProjectedGeometry(page, demo, testInfo);
    });
  }
});

async function assertSharedSpecProvenance(page: Page, demo: DemoSpec) {
  await expect(page.locator('[data-reference-canvas]')).toHaveAttribute('data-design-spec', demo.id);
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-source', 'shared-demo-spec');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-spec', demo.id);
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-node-count', String(flattenDesignNodes(demo.root).length));
}

async function comparePanels(page: Page, testInfo: TestInfo, demoId: DemoId) {
  const reference = await panelScreenshot(page.locator('[data-validation-panel="reference"]'));
  const candidate = await panelScreenshot(page.locator('[data-validation-panel="candidate"]'));
  const referencePng = PNG.sync.read(reference);
  const candidatePng = PNG.sync.read(candidate);
  expect(candidatePng.width).toBe(referencePng.width);
  expect(candidatePng.height).toBe(referencePng.height);

  const diff = new PNG({ width: referencePng.width, height: referencePng.height });
  const diffPixels = pixelmatch(referencePng.data, candidatePng.data, diff.data, referencePng.width, referencePng.height, {
    threshold: 0.55,
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

async function assertDemoStructure(page: Page, demo: DemoSpec) {
  for (const path of demo.requiredPaths) {
    await expect(page.locator(`[data-cube3d-path="${path}"]`)).toHaveCount(1);
    await expectVisibleNodeArea(page, path);
  }

  for (const [model, count] of Object.entries(demo.modelCounts ?? {})) {
    await expect(page.locator(`[data-cube3d-model="${model}"]`)).toHaveCount(count);
  }

  for (const check of demo.anchorChecks ?? []) {
    await expectProjectedAnchorDistance(page, check.aPath, check.aAnchor, check.bPath, check.bAnchor, check.maxDistance);
  }

  await assertPrimitiveContracts(page, demo);
  await assertInteraction(page, demo);
}

async function assertProjectedGeometry(page: Page, demo: DemoSpec, testInfo: TestInfo) {
  const expectedPaths = flattenDesignNodes(demo.root)
    .filter(({ node }) => node.kind !== 'model')
    .map(({ path }) => path);
  const report = await page.evaluate((paths) => {
    const referenceHost = document.querySelector<HTMLElement>('[data-reference-canvas]');
    const candidatePanel = document.querySelector<HTMLElement>('[data-validation-panel="candidate"]');
    const referenceBounds = JSON.parse(referenceHost?.dataset.referenceBounds ?? '{}') as Record<string, RectReport>;
    const candidatePanelRect = candidatePanel?.getBoundingClientRect();
    const rows = paths.map((path) => {
      const reference = referenceBounds[path];
      const candidate = candidatePanelRect ? candidateBounds(path, candidatePanelRect) : undefined;
      const centerDistance = reference && candidate ? Math.hypot(reference.centerX - candidate.centerX, reference.centerY - candidate.centerY) : Number.POSITIVE_INFINITY;
      const areaRatio = ratio(candidate?.area, reference?.area);
      const widthRatio = ratio(candidate?.width, reference?.width);
      const heightRatio = ratio(candidate?.height, reference?.height);
      return { path, reference, candidate, centerDistance, areaRatio, widthRatio, heightRatio };
    });
    return rows;

    function candidateBounds(path: string, panelRect: DOMRect): RectReport | undefined {
      const faces = Array.from(document.querySelectorAll(`[data-cube3d-path="${path}"] [data-cube3d-face]`));
      if (faces.length === 0) return undefined;
      const rects = faces.map((face) => face.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
      if (rects.length === 0) return undefined;
      const minX = Math.min(...rects.map((rect) => rect.left - panelRect.left));
      const maxX = Math.max(...rects.map((rect) => rect.right - panelRect.left));
      const minY = Math.min(...rects.map((rect) => rect.top - panelRect.top));
      const maxY = Math.max(...rects.map((rect) => rect.bottom - panelRect.top));
      const width = Math.max(0, maxX - minX);
      const height = Math.max(0, maxY - minY);
      return { x: minX, y: minY, width, height, area: width * height, centerX: minX + width / 2, centerY: minY + height / 2 };
    }

    function ratio(a?: number, b?: number) {
      if (!a || !b) return Number.POSITIVE_INFINITY;
      return a / b;
    }
  }, expectedPaths);

  const reportPath = testInfo.outputPath(`${demo.id}-projection-report.json`);
  writeFileSync(reportPath, JSON.stringify({ demoId: demo.id, rows: report }, null, 2));
  await testInfo.attach('projection-report', { path: reportPath, contentType: 'application/json' });

  for (const row of report) {
    expect(row.reference, `${row.path} missing WebGL reference projection`).toBeTruthy();
    expect(row.candidate, `${row.path} missing Cube3D candidate projection`).toBeTruthy();
    expect(row.centerDistance, `${row.path} projected center distance`).toBeLessThan(72);
    expect(row.areaRatio, `${row.path} projected area ratio`).toBeGreaterThan(0.35);
    expect(row.areaRatio, `${row.path} projected area ratio`).toBeLessThan(2.85);
    expect(row.widthRatio, `${row.path} projected width ratio`).toBeGreaterThan(0.35);
    expect(row.widthRatio, `${row.path} projected width ratio`).toBeLessThan(2.85);
    expect(row.heightRatio, `${row.path} projected height ratio`).toBeGreaterThan(0.35);
    expect(row.heightRatio, `${row.path} projected height ratio`).toBeLessThan(2.85);
  }
}

async function assertPrimitiveContracts(page: Page, demo: DemoSpec) {
  const nodes = flattenDesignNodes(demo.root);
  for (const { path, node } of nodes) {
    if (node.kind === 'model') continue;
    if (node.kind === 'box') {
      await expect(page.locator(`[data-cube3d-path="${path}"] [data-cube3d-face]`)).toHaveCount(6);
    }
    if (node.kind === 'plane' || node.kind === 'sprite') {
      await expect(page.locator(`[data-cube3d-path="${path}"] [data-cube3d-face]`)).toHaveCount(1);
    }
    if (node.kind === 'extrude') {
      await expect(page.locator(`[data-cube3d-path="${path}"] [data-cube3d-layer-index]`)).toHaveCount(node.layers ?? 6);
    }
  }
}

async function assertInteraction(page: Page, demo: DemoSpec) {
  if (!demo.interactionChecks) return;

  if (demo.interactionChecks.includes('cube-face')) {
    await page.locator('[data-demo-action="cube-face"]').click();
    await expect(page.locator('[data-demo-debug]')).toContainText('button-box/front');
  }
  if (demo.interactionChecks.includes('controller-button')) {
    await page.locator('[data-demo-action="controller-button"]').hover();
    await page.locator('[data-demo-action="controller-button"]').click();
    await expect(page.locator('[data-demo-debug]')).toContainText('controller/front');
  }
  if (demo.interactionChecks.includes('sprite-button')) {
    await page.locator('[data-demo-action="sprite-button"]').focus();
    await expect(page.locator('[data-demo-action="sprite-button"]')).toBeFocused();
  }
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

async function expectVisibleNodeArea(page: Page, path: string) {
  const area = await page.evaluate((path) => {
    const element = document.querySelector(`[data-cube3d-path="${path}"]`);
    if (!element) return 0;
    const ownRect = element.getBoundingClientRect();
    const ownArea = Math.max(0, ownRect.width) * Math.max(0, ownRect.height);
    if (ownArea > 0) return ownArea;
    return Array.from(element.querySelectorAll('[data-cube3d-face]')).reduce((sum, face) => {
      const rect = face.getBoundingClientRect();
      return sum + Math.max(0, rect.width) * Math.max(0, rect.height);
    }, 0);
  }, path);
  expect(area).toBeGreaterThan(0);
}

type RectReport = {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  centerX: number;
  centerY: number;
};
