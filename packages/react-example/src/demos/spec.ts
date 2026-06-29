/*
    cube3d-react
    packages/react-example/src/demos/spec.ts    2026-06-29

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

export type Vec3Tuple = [number, number, number];
export type Vec2Tuple = [number, number];
export type Rgba = [number, number, number, number];

export type DesignTransform = {
  position?: Vec3Tuple;
  rotation?: Vec3Tuple;
  scale?: Vec3Tuple;
};

export type DesignAnchorMap = Record<string, Vec3Tuple>;

export type DesignMaterialMap = Partial<Record<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom', Rgba>>;

export type DesignPrimitiveKind = 'box' | 'plane' | 'sprite' | 'extrude';

export type DesignPrimitiveNode = {
  id: string;
  kind: DesignPrimitiveKind;
  size: Vec3Tuple | Vec2Tuple;
  color?: Rgba;
  faceColors?: DesignMaterialMap;
  transform?: DesignTransform;
  anchors?: DesignAnchorMap;
  layers?: number;
  depth?: number;
  label?: string;
  interactive?: 'cube-face' | 'controller-button' | 'sprite-button';
};

export type DesignModelNode = {
  id: string;
  kind: 'model';
  modelName?: string;
  transform?: DesignTransform;
  anchors?: DesignAnchorMap;
  children: DesignNode[];
  attachments?: DesignAttachment[];
};

export type DesignNode = DesignPrimitiveNode | DesignModelNode;

export type DesignAttachment = {
  childId: string;
  childAnchor: string;
  parentId: string;
  parentAnchor: string;
};

export type AnchorCheckSpec = {
  aPath: string;
  aAnchor: string;
  bPath: string;
  bAnchor: string;
  maxDistance: number;
};

export type DemoSpec = {
  id: DemoId;
  title: string;
  capability: string;
  maxDiffRatio: number;
  root: DesignModelNode;
  requiredPaths: string[];
  anchorChecks?: AnchorCheckSpec[];
  modelCounts?: Record<string, number>;
  interactionChecks?: Array<'cube-face' | 'controller-button' | 'sprite-button'>;
};

export const stageSize = { width: 520, height: 360 };

const blue: Rgba = [76, 102, 232, 1];
const blueTop: Rgba = [96, 107, 255, 1];
const blueFront: Rgba = [63, 70, 205, 1];
const skin: Rgba = [226, 190, 148, 1];
const controller: Rgba = [101, 102, 154, 1];
const darkController: Rgba = [62, 64, 108, 1];
const cream: Rgba = [238, 222, 198, 1];
const hat: Rgba = [244, 234, 216, 1];

const controllerNode: DesignModelNode = {
  id: 'controller',
  kind: 'model',
  modelName: 'controller',
  anchors: {
    bodyMount: [66, 0, 26],
    leftGrip: [18, 20, 30],
    rightGrip: [112, 22, 30],
  },
  children: [
    box('shell', [132, 78, 26], controller, {
      anchors: {
        bodyMount: [66, 0, 26],
        leftGrip: [18, 20, 30],
        rightGrip: [112, 22, 30],
      },
      faceColors: { top: controller, front: darkController },
    }),
    box('greenButton', [20, 20, 8], [42, 183, 99, 1], { transform: { position: [22, 23, 28] } }),
    box('orangeButton', [20, 20, 8], [221, 139, 55, 1], { transform: { position: [54, 31, 28] } }),
    box('blueButton', [20, 20, 8], [57, 154, 210, 1], { transform: { position: [32, 52, 28] } }),
    box('stick', [16, 16, 42], [42, 45, 62, 1], { transform: { position: [88, 40, 24] } }),
    sprite('cord', [84, 154], [7, 9, 18, 0.78], { transform: { position: [111, 76, 18] } }),
  ],
};

const characterNode: DesignModelNode = {
  id: 'character',
  kind: 'model',
  modelName: 'character',
  children: [
    box('body', [84, 76, 76], blue, {
      transform: { position: [32, 30, 70] },
      anchors: {
        neck: [42, 0, 76],
        leftShoulder: [4, 32, 58],
        rightShoulder: [80, 32, 58],
        controllerMount: [62, 86, 0],
      },
      faceColors: { top: blueTop, front: blueFront },
    }),
    box('neck', [36, 28, 24], skin, {
      anchors: { bottom: [18, 28, 0], top: [18, 0, 24] },
    }),
    box('head', [68, 60, 54], cream, {
      anchors: { bottom: [34, 60, 0], top: [34, 0, 54] },
      faceColors: { top: [250, 238, 220, 1], right: [218, 195, 168, 1] },
    }),
    box('hatBrim', [88, 68, 14], hat, {
      anchors: { bottom: [44, 68, 0], top: [44, 0, 14] },
    }),
    box('hatTop', [64, 48, 20], [238, 226, 210, 1], {
      anchors: { bottom: [32, 48, 0] },
    }),
    box('leftArm', [30, 68, 28], skin, {
      transform: { rotation: [0, 0, -10] },
      anchors: { shoulder: [30, 0, 28] },
    }),
    box('rightArm', [30, 68, 28], skin, {
      transform: { rotation: [0, 0, 12] },
      anchors: { shoulder: [0, 0, 28] },
    }),
    box('leftHand', [36, 32, 30], skin, {
      anchors: { grip: [18, 16, 15] },
    }),
    box('rightHand', [38, 34, 32], skin, {
      anchors: { grip: [19, 17, 16] },
    }),
    controllerNode,
  ],
  attachments: [
    { childId: 'neck', childAnchor: 'bottom', parentId: 'body', parentAnchor: 'neck' },
    { childId: 'head', childAnchor: 'bottom', parentId: 'neck', parentAnchor: 'top' },
    { childId: 'hatBrim', childAnchor: 'bottom', parentId: 'head', parentAnchor: 'top' },
    { childId: 'hatTop', childAnchor: 'bottom', parentId: 'hatBrim', parentAnchor: 'top' },
    { childId: 'leftArm', childAnchor: 'shoulder', parentId: 'body', parentAnchor: 'leftShoulder' },
    { childId: 'rightArm', childAnchor: 'shoulder', parentId: 'body', parentAnchor: 'rightShoulder' },
    { childId: 'controller', childAnchor: 'bodyMount', parentId: 'body', parentAnchor: 'controllerMount' },
    { childId: 'leftHand', childAnchor: 'grip', parentId: 'controller', parentAnchor: 'leftGrip' },
    { childId: 'rightHand', childAnchor: 'grip', parentId: 'controller', parentAnchor: 'rightGrip' },
  ],
};

const cameraNode: DesignModelNode = {
  id: 'camera',
  kind: 'model',
  modelName: 'camera',
  children: [
    box('body', [72, 50, 52], [78, 144, 188, 1]),
    box('topButton', [28, 16, 20], [217, 70, 93, 1], { transform: { position: [22, -11, 44] } }),
    box('leftLeg', [28, 56, 22], [124, 169, 202, 1], { transform: { position: [-15, 46, -16] } }),
    box('rightLeg', [20, 56, 22], [101, 133, 164, 1], { transform: { position: [52, 46, -16] } }),
    box('beam', [180, 82], [255, 66, 92, 0.28], { transform: { position: [-36, 18, 44] } }),
  ],
};

const islandNode: DesignModelNode = {
  id: 'island',
  kind: 'model',
  modelName: 'island',
  children: [
    box('base', [300, 196, 36], [58, 73, 213, 1], {
      faceColors: { top: [67, 80, 230, 1], front: [37, 47, 170, 1] },
    }),
    plane('grid', [128, 84], [76, 87, 206, 0.36], { transform: { position: [158, 96, 38] } }),
  ],
};

export const demoSpecs: DemoSpec[] = [
  {
    id: 'primitive-lab',
    title: 'Primitive Lab',
    capability: 'primitive descriptors, faces and layers',
    maxDiffRatio: 0.12,
    root: {
      id: 'primitive-lab',
      kind: 'model',
      modelName: 'primitive-lab',
      children: [
        box('box', [68, 68, 60], blue, { transform: { position: [22, 42, 20] } }),
        plane('plane', [120, 70], [106, 122, 223, 1], { transform: { position: [106, 116, 6] } }),
        sprite('sprite', [62, 42], [240, 169, 80, 1], { transform: { position: [232, 58, 28] }, label: 'HTML' }),
        extrude('extrude', [88, 40], [233, 120, 163, 1], { transform: { position: [206, 136, 20] }, layers: 6, depth: 14, label: 'ART' }),
      ],
    },
    requiredPaths: ['primitive-lab/box', 'primitive-lab/plane', 'primitive-lab/sprite', 'primitive-lab/extrude'],
  },
  {
    id: 'transform-room',
    title: 'Transform Room',
    capability: 'nested transform, rotation and scale',
    maxDiffRatio: 0.12,
    root: {
      id: 'transform-room',
      kind: 'model',
      modelName: 'transform-room',
      children: [
        {
          id: 'parentGroup',
          kind: 'model',
          modelName: 'parent-group',
          transform: { position: [68, 44, 18], rotation: [0, 0, 16], scale: [1.08, 1.08, 1.08] },
          children: [
            box('childA', [36, 36, 36], blue),
            box('childB', [26, 26, 26], [240, 169, 80, 1], { transform: { position: [50, -22, 14], rotation: [0, 0, 30] } }),
            box('childC', [34, 34, 34], [63, 196, 118, 1], { transform: { position: [98, 24, 30], rotation: [0, 0, -18], scale: [1.2, 1.2, 1.2] } }),
          ],
        },
        box('freeBox', [50, 28, 38], [222, 95, 120, 1], { transform: { position: [214, 114, 26] } }),
      ],
    },
    requiredPaths: [
      'transform-room/parentGroup',
      'transform-room/parentGroup/childA',
      'transform-room/parentGroup/childB',
      'transform-room/parentGroup/childC',
      'transform-room/freeBox',
    ],
  },
  {
    id: 'anchor-assembly',
    title: 'Anchor Assembly',
    capability: 'anchor based model assembly',
    maxDiffRatio: 0.15,
    root: {
      id: 'head-assembly',
      kind: 'model',
      modelName: 'head-assembly',
      transform: { scale: [1.05, 1.05, 1.05] },
      children: [
        box('body', [72, 58, 56], blue, {
          transform: { position: [84, 102, 28] },
          anchors: { neck: [36, 0, 56] },
        }),
        box('neck', [26, 22, 20], skin, {
          anchors: { bottom: [13, 22, 0], top: [13, 0, 20] },
        }),
        box('head', [52, 46, 46], cream, {
          anchors: { bottom: [26, 46, 0], top: [26, 0, 46] },
        }),
        box('hatBrim', [74, 42, 12], hat, {
          anchors: { bottom: [37, 42, 0], top: [37, 0, 12] },
        }),
        box('hatTop', [50, 32, 20], [238, 226, 210, 1], {
          anchors: { bottom: [25, 32, 0] },
        }),
      ],
      attachments: [
        { childId: 'neck', childAnchor: 'bottom', parentId: 'body', parentAnchor: 'neck' },
        { childId: 'head', childAnchor: 'bottom', parentId: 'neck', parentAnchor: 'top' },
        { childId: 'hatBrim', childAnchor: 'bottom', parentId: 'head', parentAnchor: 'top' },
        { childId: 'hatTop', childAnchor: 'bottom', parentId: 'hatBrim', parentAnchor: 'top' },
      ],
    },
    requiredPaths: ['head-assembly/body', 'head-assembly/neck', 'head-assembly/head', 'head-assembly/hatBrim', 'head-assembly/hatTop'],
    modelCounts: { 'head-assembly': 1 },
    anchorChecks: [
      { aPath: 'head-assembly/head', aAnchor: 'bottom', bPath: 'head-assembly/neck', bAnchor: 'top', maxDistance: 2 },
      { aPath: 'head-assembly/hatBrim', aAnchor: 'bottom', bPath: 'head-assembly/head', bAnchor: 'top', maxDistance: 2 },
    ],
  },
  {
    id: 'nested-model',
    title: 'Nested Model Object',
    capability: 'nested model path and grip anchors',
    maxDiffRatio: 0.15,
    root: characterNode,
    requiredPaths: ['character/body', 'character/controller/shell', 'character/controller/stick', 'character/leftHand', 'character/rightHand'],
    modelCounts: { character: 1, controller: 1 },
    anchorChecks: [
      { aPath: 'character/leftHand', aAnchor: 'grip', bPath: 'character/controller', bAnchor: 'leftGrip', maxDistance: 2 },
      { aPath: 'character/rightHand', aAnchor: 'grip', bPath: 'character/controller', bAnchor: 'rightGrip', maxDistance: 2 },
    ],
  },
  {
    id: 'object-field',
    title: 'Object Field',
    capability: 'multi object spatial layout and bounds',
    maxDiffRatio: 0.12,
    root: {
      id: 'object-field',
      kind: 'model',
      modelName: 'object-field',
      children: [
        box('base', [220, 150, 8], [67, 80, 230, 1], { transform: { position: [42, 54, 2] } }),
        box('cubeA', [48, 48, 58], [222, 112, 92, 1], { transform: { position: [76, 82, 12] } }),
        box('cubeB', [70, 48, 78], [240, 213, 98, 1], { transform: { position: [154, 72, 12] } }),
        box('camera', [48, 36, 42], [78, 144, 188, 1], { transform: { position: [236, 36, 18] } }),
        box('prop', [42, 34, 24], [70, 178, 104, 1], { transform: { position: [8, 38, 14] } }),
      ],
    },
    requiredPaths: ['object-field/base', 'object-field/cubeA', 'object-field/cubeB', 'object-field/camera', 'object-field/prop'],
  },
  {
    id: 'interaction-html',
    title: 'Interaction HTML Identity',
    capability: 'HTML interaction inside pseudo 3D faces',
    maxDiffRatio: 0.25,
    root: {
      id: 'interaction-html',
      kind: 'model',
      modelName: 'interaction-html',
      children: [
        box('button-box', [62, 62, 54], blue, { transform: { position: [36, 74, 28] }, interactive: 'cube-face' }),
        box('controller', [110, 46, 20], controller, { transform: { position: [148, 92, 24] } }),
        sprite('controller-hit', [88, 28], [255, 255, 255, 0], { transform: { position: [158, 100, 52] }, interactive: 'controller-button' }),
        sprite('html-sprite', [118, 40], [88, 200, 121, 0.78], { transform: { position: [136, 36, 44] }, interactive: 'sprite-button' }),
      ],
    },
    requiredPaths: ['interaction-html/button-box', 'interaction-html/controller', 'interaction-html/controller-hit', 'interaction-html/html-sprite'],
    interactionChecks: ['cube-face', 'controller-button', 'sprite-button'],
  },
  {
    id: 'cover-scene',
    title: 'Cover Scene Construction',
    capability: 'composed acceptance scene',
    maxDiffRatio: 0.25,
    root: {
      id: 'cover-scene',
      kind: 'model',
      modelName: 'cover-scene',
      children: [
        islandNode,
        { ...cameraNode, transform: { position: [76, 48, 58] } },
        { ...characterNode, transform: { position: [190, -6, 64], scale: [0.78, 0.78, 0.78] } },
        extrude('visualWord', [126, 34], [239, 130, 168, 1], { transform: { position: [64, 170, 44] }, layers: 7, depth: 18, label: 'VISUAL' }),
        extrude('cubeWord', [112, 34], [246, 213, 98, 1], { transform: { position: [206, 164, 48] }, layers: 7, depth: 18, label: 'CUBE' }),
        box('prop', [44, 34, 24], [70, 178, 104, 1], { transform: { position: [256, 42, 42] } }),
      ],
    },
    requiredPaths: [
      'cover-scene/island/base',
      'cover-scene/camera/body',
      'cover-scene/character/body',
      'cover-scene/character/controller/shell',
      'cover-scene/visualWord',
      'cover-scene/cubeWord',
    ],
    modelCounts: { 'cover-scene': 1, island: 1, camera: 1, character: 1, controller: 1 },
    anchorChecks: [
      { aPath: 'cover-scene/character/head', aAnchor: 'bottom', bPath: 'cover-scene/character/neck', bAnchor: 'top', maxDistance: 2 },
      { aPath: 'cover-scene/character/leftHand', aAnchor: 'grip', bPath: 'cover-scene/character/controller', bAnchor: 'leftGrip', maxDistance: 2 },
    ],
  },
];

export function getDemoSpec(id: string | null): DemoSpec {
  return demoSpecs.find((demo) => demo.id === id) ?? demoSpecs[0];
}

function box(
  id: string,
  size: Vec3Tuple,
  color: Rgba,
  options: Omit<Partial<DesignPrimitiveNode>, 'id' | 'kind' | 'size' | 'color'> = {},
): DesignPrimitiveNode {
  return { id, kind: 'box', size, color, ...options };
}

function plane(
  id: string,
  size: Vec2Tuple,
  color: Rgba,
  options: Omit<Partial<DesignPrimitiveNode>, 'id' | 'kind' | 'size' | 'color'> = {},
): DesignPrimitiveNode {
  return { id, kind: 'plane', size, color, ...options };
}

function sprite(
  id: string,
  size: Vec2Tuple,
  color: Rgba,
  options: Omit<Partial<DesignPrimitiveNode>, 'id' | 'kind' | 'size' | 'color'> = {},
): DesignPrimitiveNode {
  return { id, kind: 'sprite', size, color, ...options };
}

function extrude(
  id: string,
  size: Vec2Tuple,
  color: Rgba,
  options: Omit<Partial<DesignPrimitiveNode>, 'id' | 'kind' | 'size' | 'color'> = {},
): DesignPrimitiveNode {
  return { id, kind: 'extrude', size, color, ...options };
}
