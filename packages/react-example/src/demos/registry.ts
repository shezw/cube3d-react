/*
    Cube3D React
    packages/react-example/src/demos/registry.ts
    Repository: https://github.com/shezw/cube3d-react
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
