/*
    Cube3D React
    packages/react-example/src/demos/registry.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { demoSpecs, getDemoCases, getDemoSpec, stageSize, type DemoCaseOption, type DemoId, type DemoSpec } from './spec';

export type { DemoCaseOption, DemoId, DemoSpec };

export type DemoDefinition = Pick<DemoSpec, 'id' | 'title' | 'capability' | 'maxDiffRatio'>;

export const demoDefinitions: DemoDefinition[] = demoSpecs.map(({ id, title, capability, maxDiffRatio }) => ({
  id,
  title,
  capability,
  maxDiffRatio,
}));

export { demoSpecs, getDemoCases, getDemoSpec, stageSize };
