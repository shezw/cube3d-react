/*
    cube3d-react
    packages/react-example/src/demos/registry.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { demoSpecs, getDemoSpec, stageSize, type DemoId, type DemoSpec } from './spec';

export type { DemoId, DemoSpec };

export type DemoDefinition = Pick<DemoSpec, 'id' | 'title' | 'capability' | 'maxDiffRatio'>;

export const demoDefinitions: DemoDefinition[] = demoSpecs.map(({ id, title, capability, maxDiffRatio }) => ({
  id,
  title,
  capability,
  maxDiffRatio,
}));

export { demoSpecs, getDemoSpec, stageSize };
