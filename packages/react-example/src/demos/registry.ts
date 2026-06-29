/*
    cube3d-react
    packages/react-example/src/demos/registry.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

export type DemoId =
  | 'primitive-lab'
  | 'transform-room'
  | 'anchor-assembly'
  | 'nested-model'
  | 'object-field'
  | 'interaction-html'
  | 'cover-scene';

export type DemoDefinition = {
  id: DemoId;
  title: string;
  capability: string;
  maxDiffRatio: number;
};

export const demoDefinitions: DemoDefinition[] = [
  { id: 'primitive-lab', title: 'Primitive Lab', capability: 'primitive descriptors, faces and layers', maxDiffRatio: 0.12 },
  { id: 'transform-room', title: 'Transform Room', capability: 'nested transform, rotation and scale', maxDiffRatio: 0.12 },
  { id: 'anchor-assembly', title: 'Anchor Assembly', capability: 'anchor based model assembly', maxDiffRatio: 0.15 },
  { id: 'nested-model', title: 'Nested Model Object', capability: 'nested model path and grip anchors', maxDiffRatio: 0.15 },
  { id: 'object-field', title: 'Object Field', capability: 'multi object spatial layout and bounds', maxDiffRatio: 0.12 },
  { id: 'interaction-html', title: 'Interaction HTML Identity', capability: 'HTML interaction inside pseudo 3D faces', maxDiffRatio: 0.25 },
  { id: 'cover-scene', title: 'Cover Scene Construction', capability: 'composed acceptance scene', maxDiffRatio: 0.25 },
];

export function getDemoDefinition(id: string | null): DemoDefinition {
  return demoDefinitions.find((demo) => demo.id === id) ?? demoDefinitions[0];
}

export const stageSize = { width: 520, height: 360 };
