/*
    Cube3D React
    packages/react-example/test/browser/demo-gallery.spec.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { angleBetweenVec3, findWorldNode, getWorldBoundsReport, resolveScene } from '@cube3d/core';
import { demoSpecs, getDemoCases, getDemoSpec, type DemoSpec } from '../../src/demos/registry';
import { createSceneFromSpec, flattenDesignNodes } from '../../src/demos/sceneFactory';
import { resolveLayeredTextDepth, resolveLayeredTextLayers } from '../../src/demos/layeredText';
import { solidTextDemoCharactersPerRow, solidTextDemoCharacterSet, solidTextDemoDepth, solidTextDemoFontSize, solidTextDemoRows } from '../../src/demos/solidText';
import { defaultTypefaceFontId, typefaceFontOptions } from '../../src/demos/typefaceFonts';

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
      if (demo.cases && demo.cases.length > 0) {
        await assertSpatialComparisonBoard(page, testInfo, demo);
        await assertDemoDetails(page, demo);
        return;
      }

      await expect(page.locator('[data-validation-panel="reference"]')).toBeVisible();
      await expect(page.locator('[data-validation-panel="candidate"]')).toBeVisible();
      const resolved = getDemoSpec(demo.id);
      await assertSharedSpecProvenance(page, resolved);

      await assertCandidateVisualRegressions(page, resolved);
      await comparePanels(page, testInfo, resolved);
      await assertDemoStructure(page, resolved);
      await assertProjectedGeometry(page, resolved, testInfo);
      await assertDemoDetails(page, resolved);
      await assertInteractiveWebSpaceBehavior(page, resolved);
    });
  }
});

async function assertSharedSpecProvenance(page: Page, demo: DemoSpec) {
  await expect(page.locator('[data-reference-canvas]')).toHaveAttribute('data-design-spec', demo.id);
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-source', 'shared-demo-spec');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-spec', demo.id);
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-case', demo.selectedCase ?? '');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-design-node-count', String(flattenDesignNodes(demo.root).length));
  if (demo.selectedCase) {
    await expect(page.locator('[data-reference-canvas]')).toHaveAttribute('data-design-case', demo.selectedCase);
    await expect(page.locator('[data-demo-case-select]')).toHaveValue(demo.selectedCase);
  }
}

async function comparePanels(page: Page, testInfo: TestInfo, demo: DemoSpec) {
  return comparePanelLocators(
    page.locator('[data-validation-panel="reference"]'),
    page.locator('[data-validation-panel="candidate"]'),
    testInfo,
    demo,
  );
}

async function comparePanelLocators(referenceLocator: Locator, candidateLocator: Locator, testInfo: TestInfo, demo: DemoSpec, label = '') {
  const reference = await panelScreenshot(referenceLocator);
  const candidate = await panelScreenshot(candidateLocator);
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
  const prefix = `${demo.id}${demo.selectedCase ? `-${demo.selectedCase}` : ''}${label ? `-${label}` : ''}-${Math.round(diffRatio * 10000)}`;
  const referencePath = testInfo.outputPath(`${prefix}-reference.png`);
  const candidatePath = testInfo.outputPath(`${prefix}-candidate.png`);
  const diffPath = testInfo.outputPath(`${prefix}-diff.png`);
  const reportPath = testInfo.outputPath(`${prefix}-geometry-report.json`);

  writeFileSync(referencePath, reference);
  writeFileSync(candidatePath, candidate);
  writeFileSync(diffPath, PNG.sync.write(diff));
  writeFileSync(reportPath, JSON.stringify({ demoId: demo.id, caseId: demo.selectedCase, diffRatio, diffPixels, width: referencePng.width, height: referencePng.height }, null, 2));
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

async function assertSpatialComparisonBoard(page: Page, testInfo: TestInfo, demo: DemoSpec) {
  const cases = getDemoCases(demo.id);
  const states = ['before', 'after', 'stress'] as const;
  await expect(page.locator(`[data-spatial-comparison="${demo.id}"]`)).toBeVisible();
  await expect(page.locator('[data-demo-case-select]')).toHaveCount(0);
  await expect(page.locator('[data-spatial-case-card]')).toHaveCount(cases.length);

  for (const option of cases) {
    const caseSpec = getDemoSpec(demo.id, option.id);
    const card = page.locator(`[data-spatial-case-card="${option.id}"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText(option.label);
    await expect(card).toContainText(option.expected);
    await expect(card.locator('[data-spatial-case-result="pass"]')).toHaveCount(1);
    await expect(card.locator(`[data-spatial-case-check="${option.id}"]`)).not.toBeEmpty();
    await expect(card.locator('[data-spatial-state-panel="reference"]')).toHaveCount(states.length);
    await expect(card.locator('[data-spatial-state-panel="candidate"]')).toHaveCount(states.length);
    await expect(card.locator('[data-reference-canvas]')).toHaveCount(states.length);
    await expect(card.locator('[data-candidate-stage]')).toHaveCount(states.length);

    for (const state of states) {
      const referencePanel = card.locator(`[data-spatial-state-panel="reference"][data-spatial-state="${state}"]`);
      const candidatePanel = card.locator(`[data-spatial-state-panel="candidate"][data-spatial-state="${state}"]`);
      await expect(card.locator(`[data-spatial-state-label="${state}"]`), `${demo.id}/${option.id} should label ${state}`).toHaveCount(1);
      await expect(referencePanel, `${demo.id}/${option.id} WebGL should render ${state}`).toHaveCount(1);
      await expect(candidatePanel, `${demo.id}/${option.id} Cube3D should render ${state}`).toHaveCount(1);
      await expect(referencePanel.locator('[data-reference-canvas]')).toHaveAttribute('data-design-case', option.id);
      await expect(candidatePanel.locator('[data-candidate-stage]')).toHaveAttribute('data-design-case', option.id);
      await expect(candidatePanel.locator('[data-candidate-stage]')).toHaveAttribute('data-design-node-count', String(flattenDesignNodes(caseSpec.root).length));

      await comparePanelLocators(referencePanel, candidatePanel, testInfo, caseSpec, state);
    }

    await assertOnlyCardCasePaths(card, demo, option.id);
    await assertCaseGuides(card, demo.id, option.id, states.length);
    assertSpatialCaseSemantics(caseSpec);
  }
}

async function assertOnlyCardCasePaths(card: Locator, demo: DemoSpec, selectedCase: string) {
  for (const option of getDemoCases(demo.id)) {
    const selector = `[data-cube3d-path="${demo.root.id}/${option.id}"], [data-cube3d-path^="${demo.root.id}/${option.id}/"]`;
    if (option.id === selectedCase) {
      await expect(card.locator(selector), `${demo.id}/${option.id} should be present in its card`).not.toHaveCount(0);
    } else {
      await expect(card.locator(selector), `${demo.id}/${option.id} should be absent from this card`).toHaveCount(0);
    }
  }
}

async function assertCaseGuides(card: Locator, demoId: string, caseId: string, expectedCount: number) {
  if (demoId === 'anchor-orientation') {
    await expect(card.locator(`[data-cube3d-path="anchor-orientation/${caseId}/guidePlane"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="anchor-orientation/${caseId}/socketDirectionGuide/normal"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="anchor-orientation/${caseId}/plugDirectionGuide/normal"]`)).toHaveCount(expectedCount);
  }
  if (demoId === 'pivot-origin') {
    await expect(card.locator(`[data-cube3d-path="pivot-origin/${caseId}/rotationAxis/axis"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="pivot-origin/${caseId}/pivotPlane"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="pivot-origin/${caseId}/pivotPin"]`)).toHaveCount(expectedCount);
  }
  if (demoId === 'world-bounds') {
    const stackPath = caseId === 'nestedScaledStack' ? 'world-bounds/nestedScaledStack/innerStack' : `world-bounds/${caseId}`;
    await expect(card.locator(`[data-cube3d-path="${stackPath}/rotationAxis/axis"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="${stackPath}/boundsFootprint"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="${stackPath}/localXAxis"]`)).toHaveCount(expectedCount);
    await expect(card.locator(`[data-cube3d-path="${stackPath}/localYAxis"]`)).toHaveCount(expectedCount);
  }
}

function assertSpatialCaseSemantics(caseSpec: DemoSpec) {
  if (caseSpec.id === 'anchor-orientation') {
    assertControlledAnchorComparison(caseSpec);
    assertAnchorOrientationSpec(caseSpec);
  }
  if (caseSpec.id === 'pivot-origin') {
    assertControlledPivotComparison(caseSpec);
    assertPivotSpec(caseSpec);
  }
  if (caseSpec.id === 'world-bounds') {
    assertControlledWorldBoundsComparison(caseSpec);
    assertWorldBoundsSpec(caseSpec);
  }
}

async function assertDemoDetails(page: Page, demo: DemoSpec) {
  await expect(page.locator(`[data-demo-details="${demo.id}"]`)).toBeVisible();
  const tree = page.locator(`[data-demo-tree="${demo.id}"]`);
  const code = page.locator(`[data-demo-code="${demo.id}"]`);
  await expect(tree).toContainText(`${demo.root.id} <model:${demo.root.modelName ?? demo.root.id}>`);
  await expect(tree).toContainText(demo.requiredPaths[0].split('/').at(-1) ?? demo.root.id);
  await expect(code).toContainText(`id: '${demo.id}'`);
  await expect(code).toContainText('createSceneFromSpec');
  await expect(code).toContainText(demo.requiredPaths[0]);
}

async function assertInteractiveWebSpaceBehavior(page: Page, demo: DemoSpec) {
  if (demo.id === 'camera-focus') {
    expect(demo.cameraFocus).toBeTruthy();
    const camera = page.locator('[data-cube3d-camera]');
    await expect(camera).toHaveCount(1);
    const cameraStateBefore = await camera.getAttribute('data-cube3d-camera-state');
    const target = page.locator(`[data-cube3d-path="${demo.cameraFocus!.interactivePath}"]`);
    const targetTransformBefore = await target.evaluate((element) => (element as HTMLElement).style.transform);

    await page.locator(`[data-cube3d-path="${demo.cameraFocus!.interactivePath}"] [data-cube3d-face="front"]`).click({ force: true });

    await expect(page.locator('[data-demo-debug]')).toContainText(`path: ${demo.cameraFocus!.interactivePath}`);
    await expect.poll(async () => camera.getAttribute('data-cube3d-camera-state')).not.toBe(cameraStateBefore);
    await expectCameraState(page, demo.cameraFocus!.target);
    const targetTransformAfter = await target.evaluate((element) => (element as HTMLElement).style.transform);
    expect(targetTransformAfter).toBe(targetTransformBefore);
  }

  if (demo.id === 'camera-scroll') {
    expect(demo.cameraScroll).toBeTruthy();
    const finalSection = demo.cameraScroll!.sections.at(-1)!;
    const baseTransformBefore = await page.locator('[data-cube3d-path="camera-scroll/base"]').evaluate((element) => (element as HTMLElement).style.transform);
    await page.locator('[data-camera-scroll-rail]').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect(page.locator('[data-camera-scroll-rail]')).toHaveAttribute('data-camera-scroll-active', finalSection.id);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-active-section', finalSection.id);
    await expectCameraState(page, finalSection.camera);
    const baseTransformAfter = await page.locator('[data-cube3d-path="camera-scroll/base"]').evaluate((element) => (element as HTMLElement).style.transform);
    expect(baseTransformAfter).toBe(baseTransformBefore);
  }

  if (demo.id === 'interactive-object') {
    const targetPath = 'interactive-object/switchBlock';
    await page.locator(`[data-cube3d-path="${targetPath}"] [data-cube3d-face="top"]`).click({ force: true });
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-selected-path', targetPath);
    await expect(page.locator('[data-content-panel]')).toHaveAttribute('data-content-path', targetPath);
    await expect(page.locator('[data-content-panel]')).toContainText('Switch block');
    await expectCameraState(page, demo.contentBindings!.find((binding) => binding.path === targetPath)!.camera!);
  }

  if (demo.id === 'character-reaction') {
    const triggerPath = demo.characterReaction!.triggerPath;
    await page.locator(`[data-cube3d-path="${triggerPath}"] [data-cube3d-face="front"]`).click({ force: true });
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-character-state', demo.characterReaction!.reactionState);
    await expect(page.locator('[data-content-panel]')).toHaveAttribute('data-content-character-state', demo.characterReaction!.reactionState);
    await expect(page.locator(`[data-cube3d-path="${demo.characterReaction!.characterPath}"]`)).toHaveCSS('transform', /matrix3d|matrix|translate3d/);
    for (const check of demo.anchorChecks ?? []) {
      await expectProjectedAnchorDistance(page, check.aPath, check.aAnchor, check.bPath, check.bAnchor, check.maxDistance);
    }
  }

  if (demo.id === 'content-callout') {
    await expect(page.locator('[data-callout]')).toHaveAttribute('data-callout-path', demo.callout!.initialPath);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-feedback-path', 'none');
    await expectLocalTranslateZ(page, demo.callout!.initialPath, expectedLocalZ(demo, demo.callout!.initialPath));
    const initialX = Number(await page.locator('[data-callout]').getAttribute('data-callout-x'));
    const targetPath = 'content-callout/featureB';
    await page.locator(`[data-cube3d-path="${targetPath}"] [data-cube3d-face="top"]`).click({ force: true });
    await expect(page.locator('[data-callout]')).toHaveAttribute('data-callout-path', targetPath);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-feedback-path', targetPath);
    await expect(page.locator('[data-content-panel]')).toHaveAttribute('data-content-path', targetPath);
    await expectCameraState(page, demo.contentBindings!.find((binding) => binding.path === targetPath)!.camera!);
    await expectLocalTranslateZ(page, targetPath, expectedLocalZ(demo, targetPath) + 12);
    const nextX = Number(await page.locator('[data-callout]').getAttribute('data-callout-x'));
    expect(Number.isFinite(nextX)).toBe(true);
    expect(nextX).not.toBe(initialX);
  }

  if (demo.id === 'interactive-cover-scene') {
    await expect(page.locator('[data-callout]')).toHaveAttribute('data-callout-path', demo.callout!.initialPath);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-feedback-path', 'none');
    await expectLocalTranslateZ(page, demo.callout!.initialPath, expectedLocalZ(demo, demo.callout!.initialPath));
    const targetPath = demo.characterReaction!.triggerPath;
    await page.locator(`[data-cube3d-path="${targetPath}"] [data-cube3d-face="top"]`).click({ force: true });
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-selected-path', targetPath);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-feedback-path', targetPath);
    await expect(page.locator('[data-demo-debug]')).toHaveAttribute('data-demo-character-state', demo.characterReaction!.reactionState);
    await expect(page.locator('[data-callout]')).toHaveAttribute('data-callout-path', targetPath);
    await expect(page.locator('[data-content-panel]')).toContainText('Interactive prop');
    await expectCameraState(page, demo.contentBindings!.find((binding) => binding.path === targetPath)!.camera!);
    await expectLocalTranslateZ(page, targetPath, expectedLocalZ(demo, targetPath) + 12);
  }
}

async function expectCameraState(page: Page, expected: NonNullable<DemoSpec['cameraFocus']>['target']) {
  const state = JSON.parse((await page.locator('[data-cube3d-camera]').getAttribute('data-cube3d-camera-state')) ?? '{}') as { position?: { x?: number; y?: number; z?: number }; zoom?: number };
  if (expected.position) {
    expect(state.position?.x).toBe(expected.position[0]);
    expect(state.position?.y).toBe(expected.position[1]);
    expect(state.position?.z).toBe(expected.position[2]);
  }
  if (expected.zoom != null) {
    expect(state.zoom).toBe(expected.zoom);
  }
}

async function expectLocalTranslateZ(page: Page, path: string, expectedZ: number) {
  const transform = await page.locator(`[data-cube3d-path="${path}"]`).evaluate((element) => (element as HTMLElement).style.transform);
  const match = /translate3d\([^,]+,\s*[^,]+,\s*(-?\d+(?:\.\d+)?)px\)/.exec(transform);
  expect(match, `${path} should expose translate3d z in ${transform}`).toBeTruthy();
  expect(Number(match?.[1])).toBeCloseTo(expectedZ, 3);
}

function expectedLocalZ(demo: DemoSpec, path: string) {
  const entry = flattenDesignNodes(demo.root).find((node) => node.path === path);
  expect(entry, `${path} should exist in demo spec`).toBeTruthy();
  return entry?.node.transform?.position?.[2] ?? 0;
}

async function assertCandidateVisualRegressions(page: Page, demo: DemoSpec) {
  if (demo.id === 'primitive-lab') {
    await expectFaceBackgroundNotTransparent(page, 'primitive-lab/sprite');
    await expectFaceBackgroundNotTransparent(page, 'primitive-lab/extrude');
    await expectReferenceTextModes(page, [], ['primitive-lab/extrude']);
  }
  if (demo.id === 'layered-text') {
    assertLayeredTextSpec(demo);
    await expectReferenceTextModes(page, ['layered-text/cubeText', 'layered-text/htmlText']);
    await expectLayeredText(page, 'layered-text/cubeText', 'CUBE3D', 24);
    await expectLayeredText(page, 'layered-text/htmlText', 'HTML', 8);
    await expect(page.locator('[data-cube3d-path="layered-text/caption"]')).toContainText('live text');
  }
  if (demo.id === 'solid-text') {
    assertSolidTextSpec(demo);
    await expect(page.locator('[data-solid-font-select]')).toHaveValue(defaultTypefaceFontId);
    await expect(page.locator('[data-solid-font-select] option')).toHaveText(typefaceFontOptions.map((font, index) => (index === 0 ? `${font.label} (implemented)` : font.label)));
    await expectReferenceTextModes(page, solidTextDemoRows.map((row) => `solid-text/${row.id}`));
    await expectSolidTextReferenceFonts(page, solidTextDemoRows.map((row) => ({ path: `solid-text/${row.id}`, fontId: defaultTypefaceFontId })));
    await expect(page.locator('[data-cube3d-model="solid-text"]')).toHaveCount(solidTextDemoRows.length);
    await expect(page.locator('[data-cube3d-model="solid-text-glyph"]')).toHaveCount(solidTextDemoCharacterSet.length);
    await expect(page.locator('[data-cube3d-path^="solid-text/solid"][data-cube3d-layer-index]')).toHaveCount(0);
    await expect(page.locator('[data-cube3d-path^="solid-text/solid"][data-cube3d-path*="/front-"]')).toHaveCount(0);
    await expect(page.locator('[data-cube3d-path^="solid-text/solid"][data-cube3d-path*="/back-"]')).toHaveCount(0);
    await expect(page.locator('[data-cube3d-path*="edge-left"]')).toHaveCount(0);
    await expect(page.locator('[data-cube3d-path*="/top-"] [data-cube3d-face="top"]')).toHaveCount(solidTextDemoCharacterSet.length);
    await expect(page.locator('[data-cube3d-path*="/bottom-"] [data-cube3d-face="bottom"]')).toHaveCount(solidTextDemoCharacterSet.length);
    expect(await page.locator('[data-cube3d-path*="/side-"] [data-cube3d-face="side"]').count()).toBeGreaterThan(12);
    await expect(page.locator('[data-cube3d-path="solid-text/solidRow1/glyph-0-A/top-g0-A"] [data-cube3d-glyph="A"]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-path*="/side-"] [data-cube3d-contour="outer"]')).not.toHaveCount(0);
    await expect(page.locator('[data-cube3d-path*="/side-"] [data-cube3d-contour="inner"]')).not.toHaveCount(0);
    await expect(page.locator('[data-cube3d-path*="/side-"] [data-cube3d-edge-role]')).not.toHaveCount(0);
    await expect(page.locator('[data-cube3d-path*="/side-"][data-cube3d-pivot="0,0,0"]')).not.toHaveCount(0);
  }
  if (demo.id === 'nested-model') {
    await expectFaceBackgroundNotTransparent(page, 'character/controller/cord');
  }
  if (demo.id === 'cover-scene') {
    await expectFaceBackgroundNotTransparent(page, 'cover-scene/character/controller/cord');
    await expectReferenceTextModes(page, ['cover-scene/visualWord', 'cover-scene/cubeWord']);
    await expectFaceBackgroundTransparent(page, 'cover-scene/visualWord');
    await expectFaceBackgroundTransparent(page, 'cover-scene/cubeWord');
  }
  if (demo.id === 'interaction-html') {
    await expect(page.locator('[data-demo-debug]')).toHaveCount(0);
    await expectFaceBackgroundNotTransparent(page, 'interaction-html/controller');
    await expectFaceBackgroundNotTransparent(page, 'interaction-html/html-sprite');
  }
  if (demo.id === 'cylinder-8') {
    const cylinderPaths = ['cylinder-8/cylinder', 'cylinder-8/standingCylinder'];
    for (const cylinderPath of cylinderPaths) {
      assertCylinderSpecGeometry(demo, cylinderPath);
      await expect(page.locator(`[data-cube3d-path^="${cylinderPath}/side"]`)).toHaveCount(8);
      await expectCircleFace(page, `${cylinderPath}/topCircle`);
      await expectCircleFace(page, `${cylinderPath}/bottomCircle`);
      await expectFaceBackgroundNotTransparent(page, `${cylinderPath}/side0`);
    }
    await expectTrueCylinderReference(page, cylinderPaths);
  }
  if (demo.id === 'anchor-orientation') {
    await expectOnlySelectedCase(page, demo);
    assertControlledAnchorComparison(demo);
    assertAnchorOrientationSpec(demo);
    const caseId = requireSelectedCase(demo);
    await expect(page.locator(`[data-cube3d-path="anchor-orientation/${caseId}/socket"] [data-cube3d-anchor="out"]`)).toHaveAttribute('data-cube3d-anchor-normal', '1,0,0');
    await expect(page.locator(`[data-cube3d-path="anchor-orientation/${caseId}/plug"] [data-cube3d-anchor="in"]`)).toHaveAttribute('data-cube3d-anchor-tangent', '0,1,0');
    await expectProjectedAnchorDistance(page, `anchor-orientation/${caseId}/socket`, 'out', `anchor-orientation/${caseId}/plug`, 'in', 2);
  }
  if (demo.id === 'pivot-origin') {
    await expectOnlySelectedCase(page, demo);
    assertControlledPivotComparison(demo);
    assertPivotSpec(demo);
    const caseId = requireSelectedCase(demo);
    const pivot = pivotCasePivots[caseId];
    const path = `pivot-origin/${caseId}/door`;
    await expect(page.locator(`[data-cube3d-path="${path}"]`)).toHaveAttribute('data-cube3d-pivot', pivot.join(','));
    await expect(page.locator(`[data-cube3d-path="${path}"] > [data-cube3d-pivot-marker]`)).toHaveCount(1);
    const transformOrigin = await page.locator(`[data-cube3d-path="${path}"]`).evaluate((element) => getComputedStyle(element).transformOrigin);
    expect(transformOrigin, `${path} CSS transform-origin`).toContain(`${pivot[0]}px ${pivot[1]}px`);
    await expectProjectedAnchorDistance(page, path, 'handle', `pivot-origin/${caseId}/handle`, 'mount', 2);
  }
  if (demo.id === 'world-bounds') {
    await expectOnlySelectedCase(page, demo);
    assertControlledWorldBoundsComparison(demo);
    assertWorldBoundsSpec(demo);
    await expect(page.locator('[data-cube3d-model="bounds-stack"]')).toHaveCount(1);
    await expect(page.locator('[data-cube3d-model="bounds-nested-case"]')).toHaveCount(demo.selectedCase === 'nestedScaledStack' ? 1 : 0);
  }
}

function assertLayeredTextSpec(demo: DemoSpec) {
  const nodes = flattenDesignNodes(demo.root);
  const cubeText = nodes.find(({ path }) => path === 'layered-text/cubeText')?.node;
  const htmlText = nodes.find(({ path }) => path === 'layered-text/htmlText')?.node;
  expect(cubeText?.kind).toBe('extrude');
  expect(htmlText?.kind).toBe('extrude');
  if (cubeText?.kind === 'model' || htmlText?.kind === 'model') return;
  expect(cubeText?.textHeight).toBe(24);
  expect(cubeText?.textSmooth).toBe('max');
  expect(resolveLayeredTextLayers(cubeText!)).toBe(24);
  expect(resolveLayeredTextDepth(cubeText!)).toBe(24);
  expect(cubeText?.label).toBe('CUBE3D');
  expect(cubeText?.renderMode).toBe('layered-text');
  expect(htmlText?.textHeight).toBe(16);
  expect(htmlText?.textSmooth).toBe('high');
  expect(resolveLayeredTextLayers(htmlText!)).toBe(8);
  expect(resolveLayeredTextDepth(htmlText!)).toBe(16);
  expect(htmlText?.label).toBe('HTML');
  expect(htmlText?.renderMode).toBe('layered-text');
}

function assertSolidTextSpec(demo: DemoSpec) {
  const nodes = flattenDesignNodes(demo.root);
  const solidTextRows = solidTextDemoRows.map((row) => [row.id, row.text] as const);
  const glyphs = nodes.filter(({ path, node }) => path.startsWith('solid-text/solid') && path.includes('/glyph-') && node.kind === 'model');
  const top = nodes.filter(({ path }) => path.includes('/top-'));
  const bottom = nodes.filter(({ path }) => path.includes('/bottom-'));
  const sides = nodes.filter(({ path }) => path.includes('/side-'));
  for (const [id, text] of solidTextRows) {
    const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
    expect(model?.kind).toBe('model');
    if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
    expect(model.solidText?.fontId).toBe(defaultTypefaceFontId);
    expect(model.solidText?.fontName).toBe('Press Start 2P');
    expect(model.solidText?.sourceIndex).toBe(9);
    expect(model.solidText?.text).toBe(text);
    expect(model.solidText?.fontSize).toBe(solidTextDemoFontSize);
    expect(model.solidText?.depth).toBe(solidTextDemoDepth);
  }
  expect(solidTextRows.slice(0, -1).every(([, text]) => text.length === solidTextDemoCharactersPerRow)).toBe(true);
  expect(solidTextRows.at(-1)?.[1].length).toBe(solidTextDemoCharacterSet.length % solidTextDemoCharactersPerRow);
  expect(glyphs).toHaveLength(solidTextDemoCharacterSet.length);
  expect(top).toHaveLength(sumSolidTextFaces(nodes, 'topFaces'));
  expect(bottom).toHaveLength(sumSolidTextFaces(nodes, 'bottomFaces'));
  expect(sides).toHaveLength(sumSolidTextFaces(nodes, 'sideFaces'));
  expect(sides.length).toBeGreaterThan(12);
  expect(solidTextRows.map(([id]) => {
    const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
    if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
    return model.solidText?.glyphs.map((glyph) => glyph.char).join('');
  }).join('')).toBe(solidTextDemoCharacterSet);
  expect(solidTextRows.every(([id]) => {
    const model = nodes.find(({ path }) => path === `solid-text/${id}`)?.node;
    if (model?.kind !== 'model') throw new Error(`Missing ${id}`);
    return model.solidText?.glyphs.every((glyph) => glyph.closed);
  })).toBe(true);
  expect(nodes.filter(({ node }) => node.kind === 'extrude')).toHaveLength(0);
  expect(sides.every(({ node }) => node.kind !== 'model' && node.kind === 'plane' && Boolean(node.solidTextEdge))).toBe(true);
}

function sumSolidTextFaces(nodes: ReturnType<typeof flattenDesignNodes>, key: 'topFaces' | 'bottomFaces' | 'sideFaces') {
  return nodes.reduce((sum, { node }) => {
    if (node.kind !== 'model' || node.modelName !== 'solid-text') return sum;
    return sum + (node.solidText?.[key] ?? 0);
  }, 0);
}

async function expectLayeredText(page: Page, path: string, text: string, layers: number) {
  const node = page.locator(`[data-cube3d-path="${path}"]`);
  await expect(node).toContainText(text);
  await expect(node.locator('[data-cube3d-layer-index]')).toHaveCount(layers);
  for (let index = 0; index < layers; index += 1) {
    await expect(node.locator(`[data-cube3d-layer-index="${index}"]`)).toHaveCount(1);
  }
  await expectFaceBackgroundTransparent(page, path);
  await expectLayeredTextLayerColors(page, path, layers);
}

async function expectLayeredTextLayerColors(page: Page, path: string, layers: number) {
  const dark = 'rgb(185, 87, 123)';
  const bright = 'rgb(240, 122, 162)';
  const node = page.locator(`[data-cube3d-path="${path}"]`);
  for (let index = 0; index < layers; index += 1) {
    const color = await node.locator(`[data-cube3d-layer-index="${index}"]`).evaluate((element) => getComputedStyle(element).color);
    const expected = index === layers - 1 ? bright : dark;
    expect(color, `${path} layer ${index} text color`).toBe(expected);
  }
}

async function expectReferenceTextModes(page: Page, expectedPaths: string[], forbiddenPaths: string[] = []) {
  const textModes = await page.locator('[data-reference-canvas]').evaluate((element) => JSON.parse((element as HTMLElement).dataset.referenceTextModes ?? '[]') as string[]);
  for (const expectedPath of expectedPaths) {
    expect(textModes, `${expectedPath} should use true WebGL text reference geometry`).toContain(expectedPath);
  }
  for (const forbiddenPath of forbiddenPaths) {
    expect(textModes, `${forbiddenPath} should remain primitive extrude reference geometry`).not.toContain(forbiddenPath);
  }
}

async function expectSolidTextReferenceFonts(page: Page, expectedRows: Array<{ path: string; fontId: string }>) {
  const rows = await page.locator('[data-reference-canvas]').evaluate((element) => JSON.parse((element as HTMLElement).dataset.referenceSolidTextModes ?? '[]') as Array<{ path: string; fontId: string }>);
  for (const row of expectedRows) {
    expect(rows, `${row.path} should use selected true text font`).toContainEqual(row);
  }
}

const anchorOrientationAlignedCaseIds = ['orientationAttach', 'orientationWithParentTransform'] as const;
const pivotCasePivots: Record<string, [number, number, number]> = {
  centerPivotCase: [46, 24, 0],
  leftHingeCase: [0, 24, 0],
  topHingeCase: [46, 0, 0],
};
async function expectOnlySelectedCase(page: Page, demo: DemoSpec) {
  const selectedCase = requireSelectedCase(demo);
  const cases = getDemoCases(demo.id);
  for (const item of cases) {
    const selector = `[data-cube3d-path="${demo.root.id}/${item.id}"], [data-cube3d-path^="${demo.root.id}/${item.id}/"]`;
    if (item.id === selectedCase) {
      await expect(page.locator(`[data-cube3d-path="${demo.root.id}/${item.id}"]`), `${demo.id}/${item.id} should be the only rendered case`).toHaveCount(1);
    } else {
      await expect(page.locator(selector), `${demo.id}/${item.id} should not be rendered in this image`).toHaveCount(0);
    }
  }
}

function requireSelectedCase(demo: DemoSpec) {
  if (!demo.selectedCase) throw new Error(`${demo.id} expected a selected case.`);
  return demo.selectedCase;
}

function rawDemoSpec(demo: DemoSpec) {
  const spec = demoSpecs.find((candidate) => candidate.id === demo.id);
  if (!spec) throw new Error(`Missing raw spec for ${demo.id}`);
  return spec;
}

function assertControlledAnchorComparison(demo: DemoSpec) {
  const caseId = requireSelectedCase(demo);
  const nodes = nodeMap(demo);
  const baseNodes = nodeMap(rawDemoSpec(demo));
  const templateSocket = primitiveAt(baseNodes, 'anchor-orientation/positionOnlyControl/socket');
  const templatePlug = primitiveAt(baseNodes, 'anchor-orientation/positionOnlyControl/plug');
  const caseNode = modelAt(nodes, `anchor-orientation/${caseId}`);
  const socket = primitiveAt(nodes, `anchor-orientation/${caseId}/socket`);
  const plug = primitiveAt(nodes, `anchor-orientation/${caseId}/plug`);

  expect(demo.root.children).toHaveLength(1);
  expect(demo.root.children[0].id).toBe(caseId);
  expect(socket.size, `${caseId} socket size should match template`).toEqual(templateSocket.size);
  expect(socket.color, `${caseId} socket color should match template`).toEqual(templateSocket.color);
  expect(socket.transform, `${caseId} socket transform should match template`).toEqual(templateSocket.transform);
  expect(socket.anchors, `${caseId} socket anchors should match template`).toEqual(templateSocket.anchors);
  expect(plug.size, `${caseId} plug size should match template`).toEqual(templatePlug.size);
  expect(plug.color, `${caseId} plug color should match template`).toEqual(templatePlug.color);
  expect(plug.transform, `${caseId} plug transform should match template`).toEqual(templatePlug.transform);
  expect(plug.anchors, `${caseId} plug anchors should match template`).toEqual(templatePlug.anchors);
  const plugAttachment = caseNode.attachments?.find((attachment) => attachment.childId === 'plug');
  expect(plugAttachment).toEqual({
    childId: 'plug',
    childAnchor: 'in',
    parentId: 'socket',
    parentAnchor: 'out',
    mode: caseId === 'positionOnlyControl' ? 'position' : 'position-orientation',
  });
  expect(caseNode.attachments).toEqual(expect.arrayContaining([
    { childId: 'socketDirectionGuide', childAnchor: 'origin', parentId: 'socket', parentAnchor: 'out', mode: 'position-orientation' },
    { childId: 'plugDirectionGuide', childAnchor: 'origin', parentId: 'plug', parentAnchor: 'in', mode: 'position-orientation' },
  ]));
  expect(stripLayoutPosition(caseNode.transform)).toEqual(caseId === 'orientationWithParentTransform' ? {
    rotation: [0, 0, 28],
    scale: [1.12, 1.12, 1.12],
  } : {});
}

function assertControlledPivotComparison(demo: DemoSpec) {
  const caseId = requireSelectedCase(demo);
  const nodes = nodeMap(demo);
  const baseNodes = nodeMap(rawDemoSpec(demo));
  const templateDoor = primitiveAt(baseNodes, 'pivot-origin/centerPivotCase/door');
  const templateBase = primitiveAt(baseNodes, 'pivot-origin/centerPivotCase/base');
  const templateHandle = primitiveAt(baseNodes, 'pivot-origin/centerPivotCase/handle');
  const caseNode = modelAt(nodes, `pivot-origin/${caseId}`);
  const door = primitiveAt(nodes, `pivot-origin/${caseId}/door`);
  const base = primitiveAt(nodes, `pivot-origin/${caseId}/base`);
  const handle = primitiveAt(nodes, `pivot-origin/${caseId}/handle`);

  expect(demo.root.children).toHaveLength(1);
  expect(demo.root.children[0].id).toBe(caseId);
  expect(base.size, `${caseId} base size should match template`).toEqual(templateBase.size);
  expect(base.color, `${caseId} base color should match template`).toEqual(templateBase.color);
  expect(handle.size, `${caseId} handle size should match template`).toEqual(templateHandle.size);
  expect(handle.anchors, `${caseId} handle anchors should match template`).toEqual(templateHandle.anchors);
  expect(door.size, `${caseId} door size should match template`).toEqual(templateDoor.size);
  expect(door.color, `${caseId} door color should match template`).toEqual(templateDoor.color);
  expect({ ...door.transform, pivot: undefined }, `${caseId} door transform except pivot`).toEqual({ ...templateDoor.transform, pivot: undefined });
  expect(door.transform?.pivot, `${caseId} only pivot should differ`).toEqual(pivotCasePivots[caseId]);
  expect(caseNode.attachments).toEqual([{ childId: 'handle', childAnchor: 'mount', parentId: 'door', parentAnchor: 'handle' }]);
}

function assertControlledWorldBoundsComparison(demo: DemoSpec) {
  const caseId = requireSelectedCase(demo);
  const nodes = nodeMap(demo);
  const baseNodes = nodeMap(rawDemoSpec(demo));
  const selectedStackPath = worldBoundsStackPath(caseId);
  const templateBase = primitiveAt(baseNodes, 'world-bounds/translatedStack/base');
  const templateTop = primitiveAt(baseNodes, 'world-bounds/translatedStack/top');
  const base = primitiveAt(nodes, `${selectedStackPath}/base`);
  const top = primitiveAt(nodes, `${selectedStackPath}/top`);

  expect(demo.root.children.map((child) => child.id)).toEqual(['floor', caseId]);
  expect(base.size, `${selectedStackPath} base size should match template`).toEqual(templateBase.size);
  expect(base.color, `${selectedStackPath} base color should match template`).toEqual(templateBase.color);
  expect(base.faceColors, `${selectedStackPath} base face colors should match template`).toEqual(templateBase.faceColors);
  expect(top.size, `${selectedStackPath} top size should match template`).toEqual(templateTop.size);
  expect(top.color, `${selectedStackPath} top color should match template`).toEqual(templateTop.color);
  expect(top.transform, `${selectedStackPath} top local transform should match template`).toEqual(templateTop.transform);

  if (caseId === 'translatedStack') expect(modelAt(nodes, 'world-bounds/translatedStack').transform).toEqual({ position: [44, 82, 12], rotation: [0, 0, 0], scale: [1, 1, 1] });
  if (caseId === 'rotatedStack') expect(modelAt(nodes, 'world-bounds/rotatedStack').transform).toEqual({ position: [146, 76, 12], rotation: [0, 0, -24], scale: [1, 1, 1] });
  if (caseId === 'nestedScaledStack') {
    expect(modelAt(nodes, 'world-bounds/nestedScaledStack').transform).toEqual({ position: [220, 154, 12], rotation: [0, 0, 0], scale: [1.18, 1.18, 1.18] });
    expect(modelAt(nodes, 'world-bounds/nestedScaledStack/innerStack').transform).toEqual({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
  }
}

function assertAnchorOrientationSpec(demo: DemoSpec) {
  const caseId = requireSelectedCase(demo);
  const world = resolveScene(createSceneFromSpec(demo));
  const socket = findWorldNode(world, `anchor-orientation/${caseId}/socket`)?.worldAnchors.out;
  const plug = findWorldNode(world, `anchor-orientation/${caseId}/plug`)?.worldAnchors.in;
  expect(socket, `${caseId} socket anchor should resolve`).toBeTruthy();
  expect(plug, `${caseId} plug anchor should resolve`).toBeTruthy();
  expect(plug!.position.x, `${caseId} x`).toBeCloseTo(socket!.position.x, 3);
  expect(plug!.position.y, `${caseId} y`).toBeCloseTo(socket!.position.y, 3);
  expect(plug!.position.z, `${caseId} z`).toBeCloseTo(socket!.position.z, 3);
  if (anchorOrientationAlignedCaseIds.includes(caseId as (typeof anchorOrientationAlignedCaseIds)[number])) {
    expect(angleBetweenVec3(socket!.normal!, plug!.normal!), `${caseId} normal alignment`).toBeLessThan(0.001);
    expect(angleBetweenVec3(socket!.tangent!, plug!.tangent!), `${caseId} tangent alignment`).toBeLessThan(0.001);
  } else {
    expect(angleBetweenVec3(socket!.normal!, plug!.normal!), 'position-only control should not align normal').toBeGreaterThan(0.1);
  }
}

function assertPivotSpec(demo: DemoSpec) {
  const caseId = requireSelectedCase(demo);
  const world = resolveScene(createSceneFromSpec(demo));
  const pivot = pivotCasePivots[caseId];
  const door = findWorldNode(world, `pivot-origin/${caseId}/door`);
  const handle = findWorldNode(world, `pivot-origin/${caseId}/handle`);
  const doorHandle = door?.worldAnchors.handle;
  const handleMount = handle?.worldAnchors.mount;
  expect(door?.node.transform.pivot, `${caseId} pivot`).toEqual({ x: pivot[0], y: pivot[1], z: pivot[2] });
  expect(door?.worldBounds?.max.x, `${caseId} bounds x`).toBeGreaterThan(door?.worldBounds?.min.x ?? 0);
  expect(door?.worldBounds?.max.y, `${caseId} bounds y`).toBeGreaterThan(door?.worldBounds?.min.y ?? 0);
  expect(handleMount?.position.x, `${caseId} handle x`).toBeCloseTo(doorHandle!.position.x, 3);
  expect(handleMount?.position.y, `${caseId} handle y`).toBeCloseTo(doorHandle!.position.y, 3);
  expect(handleMount?.position.z, `${caseId} handle z`).toBeCloseTo(doorHandle!.position.z, 3);
}

function assertWorldBoundsSpec(demo: DemoSpec) {
  const report = getWorldBoundsReport(resolveScene(createSceneFromSpec(demo)));
  const byPath = new Map(report.map((item) => [item.path, item]));
  for (const path of demo.requiredPaths) {
    const row = byPath.get(path);
    expect(row?.bounds, `${path} should have resolved world bounds`).toBeTruthy();
    expectFiniteBounds(path, row!.bounds!);
  }
  const root = byPath.get('world-bounds');
  for (const path of demo.requiredPaths.filter((candidate) => candidate !== 'world-bounds/floor')) {
    const item = byPath.get(path);
    if (!item?.bounds) continue;
    expect(root?.size?.x, `root should cover ${path} width`).toBeGreaterThanOrEqual(item?.size?.x ?? Number.POSITIVE_INFINITY);
    expect(root?.size?.y, `root should cover ${path} height`).toBeGreaterThanOrEqual(item?.size?.y ?? Number.POSITIVE_INFINITY);
    expect(root?.size?.z, `root should cover ${path} depth`).toBeGreaterThanOrEqual(item?.size?.z ?? Number.POSITIVE_INFINITY);
    expect(rootContains(root?.bounds, item?.bounds), `root bounds should contain ${path}`).toBe(true);
  }
}

function nodeMap(demo: DemoSpec) {
  return new Map(flattenDesignNodes(demo.root).map((entry) => [entry.path, entry.node]));
}

function worldBoundsStackPath(caseId: string) {
  return caseId === 'nestedScaledStack' ? 'world-bounds/nestedScaledStack/innerStack' : `world-bounds/${caseId}`;
}

function primitiveAt(nodes: Map<string, ReturnType<typeof flattenDesignNodes>[number]['node']>, path: string) {
  const node = nodes.get(path);
  expect(node?.kind, `${path} should be primitive`).not.toBe('model');
  if (!node || node.kind === 'model') throw new Error(`${path} missing primitive`);
  return node;
}

function modelAt(nodes: Map<string, ReturnType<typeof flattenDesignNodes>[number]['node']>, path: string) {
  const node = nodes.get(path);
  expect(node?.kind, `${path} should be model`).toBe('model');
  if (!node || node.kind !== 'model') throw new Error(`${path} missing model`);
  return node;
}

function stripLayoutPosition<T extends { position?: unknown } | undefined>(transform: T) {
  if (!transform) return {};
  const { position: _position, ...rest } = transform;
  return rest;
}

function rootContains(
  root?: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  child?: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
) {
  if (!root || !child) return false;
  return root.min.x <= child.min.x
    && root.min.y <= child.min.y
    && root.min.z <= child.min.z
    && root.max.x >= child.max.x
    && root.max.y >= child.max.y
    && root.max.z >= child.max.z;
}

function expectFiniteBounds(path: string, bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }) {
  for (const value of [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z]) {
    expect(Number.isFinite(value), `${path} bounds should be finite`).toBe(true);
  }
  expect(bounds.max.x, `${path} bounds x`).toBeGreaterThanOrEqual(bounds.min.x);
  expect(bounds.max.y, `${path} bounds y`).toBeGreaterThanOrEqual(bounds.min.y);
  expect(bounds.max.z, `${path} bounds z`).toBeGreaterThanOrEqual(bounds.min.z);
}

function assertCylinderSpecGeometry(demo: DemoSpec, cylinderPath: string) {
  const nodes = flattenDesignNodes(demo.root);
  const cylinder = nodes.find(({ path }) => path === cylinderPath)?.node;
  const topCircle = nodes.find(({ path }) => path === `${cylinderPath}/topCircle`)?.node;
  const bottomCircle = nodes.find(({ path }) => path === `${cylinderPath}/bottomCircle`)?.node;
  const sides = nodes.filter(({ path }) => path.startsWith(`${cylinderPath}/side`) && /^side\d+$/.test(path.split('/').at(-1) ?? ''));
  const side0 = sides.find(({ path }) => path.endsWith('/side0'))?.node;

  expect(cylinder?.kind).toBe('model');
  if (cylinder?.kind !== 'model' || topCircle?.kind === 'model' || bottomCircle?.kind === 'model' || side0?.kind === 'model') return;

  const reference = cylinder.referenceShape;
  expect(reference?.kind).toBe('cylinder');
  if (!reference || reference.kind !== 'cylinder') return;

  const radius = reference.radius;
  const topY = reference.position[1] - reference.height / 2;
  const bottomY = reference.position[1] + reference.height / 2;
  const segmentCount = 8;
  const expectedSideWidth = regularPolygonSideForEqualCircleArea(radius, segmentCount);
  const expectedApothem = regularPolygonApothem(expectedSideWidth, segmentCount);
  const expectedOctagonArea = (segmentCount * expectedSideWidth * expectedApothem) / 2;
  const expectedCircleArea = Math.PI * radius * radius;

  expect(sides).toHaveLength(segmentCount);
  expect(topCircle.transform?.position).toEqual([reference.position[0] - radius, topY - radius, reference.position[2]]);
  expect(bottomCircle.transform?.position).toEqual([reference.position[0] - radius, bottomY - radius, reference.position[2]]);
  expect(side0.transform?.position?.[1]).toBeCloseTo(topY, 3);
  expect(side0.size[0]).toBeCloseTo(expectedSideWidth, 3);
  expect(side0.size[1]).toBeCloseTo(reference.height, 3);
  expect(expectedApothem).toBeLessThan(radius);
  expect(expectedOctagonArea / expectedCircleArea).toBeCloseTo(1, 3);
  expectRegularOctagonPanelChain(sides, reference.position, expectedSideWidth, expectedApothem);
}

function expectRegularOctagonPanelChain(
  sides: ReturnType<typeof flattenDesignNodes>,
  axis: [number, number, number],
  sideLength: number,
  apothem: number,
) {
  const segmentCount = sides.length;
  const endpoints = sides.map(({ node }, index) => {
    if (node.kind === 'model') throw new Error('Cylinder side must be a primitive plane.');
    const position = node.transform?.position;
    if (!position) throw new Error(`Cylinder side${index} is missing a transform position.`);
    const angle = ((node.transform?.rotation?.[1] ?? 0) / 180) * Math.PI;
    const center = {
      x: position[0] + sideLength / 2,
      z: position[2],
    };
    const tangent = { x: Math.cos(angle), z: -Math.sin(angle) };
    const radialDistance = Math.hypot(center.x - axis[0], center.z - axis[2]);
    expect(radialDistance, `side${index} center should sit on the equal-area octagon apothem`).toBeCloseTo(apothem, 2);
    return {
      start: { x: center.x - tangent.x * sideLength / 2, z: center.z - tangent.z * sideLength / 2 },
      end: { x: center.x + tangent.x * sideLength / 2, z: center.z + tangent.z * sideLength / 2 },
    };
  });

  for (let index = 0; index < segmentCount; index += 1) {
    const current = endpoints[index];
    const next = endpoints[(index + 1) % segmentCount];
    const gap = Math.hypot(current.end.x - next.start.x, current.end.z - next.start.z);
    expect(gap, `side${index} should meet side${(index + 1) % segmentCount}`).toBeLessThan(0.03);
  }
}

function regularPolygonSideForEqualCircleArea(radius: number, segments: number) {
  const circleArea = Math.PI * radius * radius;
  return Math.sqrt((4 * circleArea * Math.tan(Math.PI / segments)) / segments);
}

function regularPolygonApothem(sideLength: number, segments: number) {
  return sideLength / (2 * Math.tan(Math.PI / segments));
}

async function expectFaceBackgroundNotTransparent(page: Page, path: string) {
  const background = await page.locator(`[data-cube3d-path="${path}"] [data-cube3d-face]`).first().evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background, `${path} face background should keep its material color`).not.toBe('rgba(0, 0, 0, 0)');
}

async function expectFaceBackgroundTransparent(page: Page, path: string) {
  const background = await page.locator(`[data-cube3d-path="${path}"] [data-cube3d-face]`).first().evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background, `${path} text mode face background should be transparent`).toBe('rgba(0, 0, 0, 0)');
}

async function expectCircleFace(page: Page, path: string) {
  const borderRadius = await page.locator(`[data-cube3d-path="${path}"] [data-cube3d-face]`).first().evaluate((element) => getComputedStyle(element).borderRadius);
  expect(borderRadius, `${path} should render as a circular face`).toContain('50%');
}

async function expectTrueCylinderReference(page: Page, cylinderPaths: string[]) {
  const referencePaths = await page.locator('[data-reference-canvas]').evaluate((element) => Object.keys(JSON.parse((element as HTMLElement).dataset.referenceBounds ?? '{}')));
  for (const cylinderPath of cylinderPaths) {
    expect(referencePaths).toContain(cylinderPath);
    expect(referencePaths).not.toContain(`${cylinderPath}/side0`);
    expect(referencePaths).not.toContain(`${cylinderPath}/topCircle`);
  }
}

async function assertProjectedGeometry(page: Page, demo: DemoSpec, testInfo: TestInfo) {
  const expectedPaths = demo.projectionPaths ?? flattenDesignNodes(demo.root)
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
      await expect(page.locator(`[data-cube3d-path="${path}"] > [data-cube3d-face]`)).toHaveCount(6);
    }
    if (node.kind === 'plane' || node.kind === 'sprite') {
      await expect(page.locator(`[data-cube3d-path="${path}"] > [data-cube3d-face]`)).toHaveCount(1);
    }
    if (node.kind === 'extrude') {
      const expectedLayers = node.renderMode === 'layered-text' ? resolveLayeredTextLayers(node) : node.layers ?? 6;
      await expect(page.locator(`[data-cube3d-path="${path}"] [data-cube3d-layer-index]`)).toHaveCount(expectedLayers);
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
