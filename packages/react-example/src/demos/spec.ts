/*
    Cube3D React
    packages/react-example/src/demos/spec.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { createSolidTextDemoNodes, solidTextDemoCharacterSet, solidTextDemoRows, type SolidTextEdgeMetadata, type SolidTextFaceMetadata, type SolidTextGlyphMetadata } from './solidText';
import { defaultTypefaceFontId } from './typefaceFonts';

export type DemoId =
  | 'primitive-lab'
  | 'layered-text'
  | 'solid-text'
  | 'cylinder-8'
  | 'anchor-orientation'
  | 'pivot-origin'
  | 'transform-room'
  | 'world-bounds'
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
  pivot?: Vec3Tuple;
};

export type DesignAnchor = Vec3Tuple | {
  position: Vec3Tuple;
  rotation?: Vec3Tuple;
  normal?: Vec3Tuple;
  tangent?: Vec3Tuple;
};

export type DesignAnchorMap = Record<string, DesignAnchor>;

export type DesignMaterialMap = Partial<Record<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom', Rgba>>;

export type DesignPrimitiveKind = 'box' | 'plane' | 'sprite' | 'extrude';

export type LayeredTextSmooth = 'min' | 'mid' | 'high' | 'max';

export type WebGLReferenceShape = {
  kind: 'cylinder';
  radius: number;
  height: number;
  color: Rgba;
  position: Vec3Tuple;
  segments?: number;
};

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
  textHeight?: number;
  textSmooth?: LayeredTextSmooth;
  label?: string;
  shape?: 'circle';
  renderMode?: 'layered-text';
  interactive?: 'cube-face' | 'controller-button' | 'sprite-button';
  solidTextFace?: SolidTextFaceMetadata;
  solidTextEdge?: SolidTextEdgeMetadata;
};

export type SolidTextMetadata = {
  fontId: string;
  fontName: string;
  sourceIndex: number;
  text: string;
  fontSize: number;
  depth: number;
  topFaces: number;
  bottomFaces: number;
  sideFaces: number;
  glyphs: SolidTextGlyphMetadata[];
};

export type DesignModelNode = {
  id: string;
  kind: 'model';
  modelName?: string;
  transform?: DesignTransform;
  anchors?: DesignAnchorMap;
  children: DesignNode[];
  attachments?: DesignAttachment[];
  referenceShape?: WebGLReferenceShape;
  solidText?: SolidTextMetadata;
  solidTextGlyph?: {
    char: string;
    glyphIndex: number;
  };
};

export type DesignNode = DesignPrimitiveNode | DesignModelNode;

export type DesignAttachment = {
  childId: string;
  childAnchor: string;
  parentId: string;
  parentAnchor: string;
  mode?: 'position' | 'position-orientation';
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
  projectionPaths?: string[];
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
const cylinderBlue: Rgba = [80, 178, 216, 1];
const cylinderTop: Rgba = [114, 212, 236, 1];
const cylinderBottom: Rgba = [47, 128, 176, 1];

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

const cylinderNode = createCylinder8PanelNode('cylinder', {
  radius: 48,
  height: 104,
  position: [120, 88, 72],
});

const standingCylinderNode = createCylinder8PanelNode('standingCylinder', {
  radius: 34,
  height: 92,
  position: [58, 84, 42],
  transform: { position: [12, 152, 8], rotation: [90, 0, 0] },
  color: [86, 202, 145, 1],
  topColor: [121, 226, 173, 1],
  bottomColor: [47, 143, 96, 1],
});

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
    id: 'layered-text',
    title: 'Layered Text',
    capability: 'HTML text rendered as a multi-layer text asset',
    maxDiffRatio: 0.18,
    root: {
      id: 'layered-text',
      kind: 'model',
      modelName: 'layered-text',
      children: [
        box('plinth', [270, 118, 16], [58, 73, 213, 1], {
          transform: { position: [34, 118, 0] },
          faceColors: { top: [67, 80, 230, 1], front: [37, 47, 170, 1] },
        }),
        extrude('cubeText', [156, 42], [246, 213, 98, 1], {
          transform: { position: [62, 116, 28], rotation: [0, 0, -8] },
          textHeight: 24,
          textSmooth: 'max',
          label: 'CUBE3D',
          renderMode: 'layered-text',
        }),
        extrude('htmlText', [132, 34], [239, 130, 168, 1], {
          transform: { position: [134, 68, 46], rotation: [0, 0, 10] },
          textHeight: 16,
          textSmooth: 'high',
          label: 'HTML',
          renderMode: 'layered-text',
        }),
        sprite('caption', [112, 26], [88, 200, 121, 0.82], {
          transform: { position: [182, 172, 38] },
          label: 'live text',
        }),
      ],
    },
    requiredPaths: ['layered-text/plinth', 'layered-text/cubeText', 'layered-text/htmlText', 'layered-text/caption'],
    projectionPaths: ['layered-text/plinth', 'layered-text/cubeText', 'layered-text/htmlText'],
    modelCounts: { 'layered-text': 1 },
  },
  {
    id: 'solid-text',
    title: 'Solid Text',
    capability: 'true font solid text parsed into top, bottom and side faces',
    maxDiffRatio: 0.2,
    root: {
      id: 'solid-text',
      kind: 'model',
      modelName: 'solid-text-demo',
      children: [
        box('base', [360, 184, 16], [58, 73, 213, 1], {
          transform: { position: [0, 158, 0] },
          faceColors: { top: [67, 80, 230, 1], front: [37, 47, 170, 1] },
        }),
        ...createSolidTextDemoNodes(defaultTypefaceFontId),
        box('comparisonBlock', [28, 28, 22], [239, 130, 168, 1], { transform: { position: [318, 32, 26] } }),
      ],
    },
    requiredPaths: [
      'solid-text/base',
      'solid-text/solidRow1',
      'solid-text/solidRow1/glyph-0-A',
      'solid-text/solidRow1/glyph-0-A/top-g0-A',
      'solid-text/solidRow1/glyph-0-A/bottom-g0-A',
      'solid-text/solidRow1/glyph-0-A/side-g0-c0-e0',
      'solid-text/solidRow2',
      'solid-text/solidRow8',
    ],
    projectionPaths: ['solid-text/base', ...solidTextDemoRows.map((row) => `solid-text/${row.id}`), 'solid-text/comparisonBlock'],
    modelCounts: { 'solid-text-demo': 1, 'solid-text': solidTextDemoRows.length, 'solid-text-glyph': solidTextDemoCharacterSet.length },
  },
  {
    id: 'cylinder-8',
    title: 'Cylinder 8 Panels',
    capability: 'cylinder assembled from two circles and eight rectangular panels',
    maxDiffRatio: 0.18,
    root: {
      id: 'cylinder-8',
      kind: 'model',
      modelName: 'cylinder-8',
      children: [
        cylinderNode,
        standingCylinderNode,
        box('scaleBlock', [34, 34, 40], [233, 120, 163, 1], { transform: { position: [226, 116, 28] } }),
      ],
    },
    requiredPaths: [
      'cylinder-8/cylinder/topCircle',
      'cylinder-8/cylinder/bottomCircle',
      'cylinder-8/cylinder/side0',
      'cylinder-8/cylinder/side1',
      'cylinder-8/cylinder/side2',
      'cylinder-8/cylinder/side3',
      'cylinder-8/cylinder/side4',
      'cylinder-8/cylinder/side5',
      'cylinder-8/cylinder/side6',
      'cylinder-8/cylinder/side7',
      'cylinder-8/standingCylinder/topCircle',
      'cylinder-8/standingCylinder/bottomCircle',
      'cylinder-8/standingCylinder/side0',
      'cylinder-8/standingCylinder/side1',
      'cylinder-8/standingCylinder/side2',
      'cylinder-8/standingCylinder/side3',
      'cylinder-8/standingCylinder/side4',
      'cylinder-8/standingCylinder/side5',
      'cylinder-8/standingCylinder/side6',
      'cylinder-8/standingCylinder/side7',
      'cylinder-8/scaleBlock',
    ],
    projectionPaths: ['cylinder-8/cylinder', 'cylinder-8/standingCylinder', 'cylinder-8/scaleBlock'],
    modelCounts: { 'cylinder-8': 1, 'cylinder-8-panel': 2 },
  },
  {
    id: 'anchor-orientation',
    title: 'Anchor Orientation',
    capability: 'anchor position, normal and tangent alignment',
    maxDiffRatio: 0.14,
    root: {
      id: 'anchor-orientation',
      kind: 'model',
      modelName: 'anchor-orientation',
      children: [
        box('socket', [72, 36, 24], [91, 140, 232, 1], {
          transform: { position: [78, 118, 18], rotation: [0, 0, -18], pivot: [36, 18, 0] },
          anchors: {
            out: {
              position: [72, 18, 24],
              rotation: [0, 0, 22],
              normal: [1, 0, 0],
              tangent: [0, 1, 0],
            },
          },
          faceColors: { top: [122, 160, 248, 1], front: [62, 93, 184, 1] },
        }),
        box('plug', [54, 28, 22], [240, 169, 80, 1], {
          transform: { pivot: [27, 14, 0] },
          anchors: {
            in: {
              position: [0, 14, 22],
              rotation: [0, 0, -8],
              normal: [1, 0, 0],
              tangent: [0, 1, 0],
            },
          },
          faceColors: { top: [255, 193, 101, 1], front: [204, 125, 52, 1] },
        }),
        plane('socketNormal', [46, 6], [93, 232, 170, 1], { transform: { position: [140, 107, 48], rotation: [0, 0, 4] } }),
        plane('plugNormal', [46, 6], [93, 232, 170, 0.72], { transform: { position: [166, 120, 50], rotation: [0, 0, 4] } }),
      ],
      attachments: [
        { childId: 'plug', childAnchor: 'in', parentId: 'socket', parentAnchor: 'out', mode: 'position-orientation' },
      ],
    },
    requiredPaths: [
      'anchor-orientation/socket',
      'anchor-orientation/plug',
      'anchor-orientation/socketNormal',
      'anchor-orientation/plugNormal',
    ],
    projectionPaths: ['anchor-orientation/socket', 'anchor-orientation/plug'],
    anchorChecks: [
      { aPath: 'anchor-orientation/socket', aAnchor: 'out', bPath: 'anchor-orientation/plug', bAnchor: 'in', maxDistance: 2 },
    ],
    modelCounts: { 'anchor-orientation': 1 },
  },
  {
    id: 'pivot-origin',
    title: 'Pivot Origin',
    capability: 'explicit pivot/origin for local model rotation',
    maxDiffRatio: 0.14,
    root: {
      id: 'pivot-origin',
      kind: 'model',
      modelName: 'pivot-origin',
      children: [
        box('base', [172, 36, 12], [75, 91, 150, 1], { transform: { position: [70, 146, 4] } }),
        box('hinge', [18, 54, 38], [226, 190, 148, 1], { transform: { position: [132, 112, 16] } }),
        box('door', [92, 48, 16], [226, 105, 135, 1], {
          transform: { position: [132, 115, 20], rotation: [0, 0, -58], pivot: [0, 24, 0] },
          anchors: {
            hinge: { position: [0, 24, 8], normal: [-1, 0, 0], tangent: [0, 1, 0] },
            handle: { position: [82, 24, 16], normal: [1, 0, 0], tangent: [0, 1, 0] },
          },
          faceColors: { top: [247, 133, 161, 1], front: [189, 70, 104, 1] },
        }),
        box('handle', [12, 12, 12], [244, 213, 98, 1], { transform: { position: [192, 68, 42] } }),
      ],
    },
    requiredPaths: ['pivot-origin/base', 'pivot-origin/hinge', 'pivot-origin/door', 'pivot-origin/handle'],
    projectionPaths: ['pivot-origin/base', 'pivot-origin/hinge', 'pivot-origin/door'],
    modelCounts: { 'pivot-origin': 1 },
  },
  {
    id: 'world-bounds',
    title: 'World Bounds',
    capability: 'resolved world bounds and spatial object query',
    maxDiffRatio: 0.14,
    root: {
      id: 'world-bounds',
      kind: 'model',
      modelName: 'world-bounds',
      children: [
        box('floor', [244, 154, 10], [67, 80, 230, 1], { transform: { position: [42, 92, 0] } }),
        {
          id: 'leftStack',
          kind: 'model',
          modelName: 'bounds-stack',
          transform: { position: [72, 82, 12], rotation: [0, 0, -8] },
          children: [
            box('base', [54, 42, 32], [70, 178, 104, 1]),
            box('top', [34, 34, 46], [121, 226, 173, 1], { transform: { position: [12, -28, 32] } }),
          ],
        },
        {
          id: 'rightStack',
          kind: 'model',
          modelName: 'bounds-stack',
          transform: { position: [178, 82, 12], rotation: [0, 0, 12], scale: [1.12, 1.12, 1.12] },
          children: [
            box('base', [62, 46, 36], [240, 169, 80, 1]),
            box('top', [44, 32, 52], [246, 213, 98, 1], { transform: { position: [10, -30, 36] } }),
          ],
        },
        box('marker', [24, 24, 24], [233, 120, 163, 1], { transform: { position: [254, 58, 18] } }),
      ],
    },
    requiredPaths: [
      'world-bounds/floor',
      'world-bounds/leftStack',
      'world-bounds/leftStack/base',
      'world-bounds/leftStack/top',
      'world-bounds/rightStack',
      'world-bounds/rightStack/base',
      'world-bounds/rightStack/top',
      'world-bounds/marker',
    ],
    projectionPaths: ['world-bounds/floor', 'world-bounds/leftStack', 'world-bounds/rightStack', 'world-bounds/marker'],
    modelCounts: { 'world-bounds': 1, 'bounds-stack': 2 },
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
        extrude('visualWord', [126, 34], [239, 130, 168, 1], { transform: { position: [64, 170, 44] }, textHeight: 18, textSmooth: 'mid', label: 'VISUAL', renderMode: 'layered-text' }),
        extrude('cubeWord', [112, 34], [246, 213, 98, 1], { transform: { position: [206, 164, 48] }, textHeight: 18, textSmooth: 'mid', label: 'CUBE', renderMode: 'layered-text' }),
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

function createCylinder8PanelNode(
  id: string,
  init: {
    radius: number;
    height: number;
    position: Vec3Tuple;
    transform?: DesignTransform;
    color?: Rgba;
    topColor?: Rgba;
    bottomColor?: Rgba;
  },
): DesignModelNode {
  const [axisX, axisY, axisZ] = init.position;
  const diameter = init.radius * 2;
  const color = init.color ?? cylinderBlue;
  return {
    id,
    kind: 'model',
    modelName: 'cylinder-8-panel',
    transform: init.transform,
    referenceShape: {
      kind: 'cylinder',
      radius: init.radius,
      height: init.height,
      color,
      position: init.position,
      segments: 48,
    },
    children: [
      plane('topCircle', [diameter, diameter], init.topColor ?? cylinderTop, {
        transform: { position: [axisX - init.radius, axisY - init.height / 2 - init.radius, axisZ], rotation: [90, 0, 0] },
        shape: 'circle',
      }),
      plane('bottomCircle', [diameter, diameter], init.bottomColor ?? cylinderBottom, {
        transform: { position: [axisX - init.radius, axisY + init.height / 2 - init.radius, axisZ], rotation: [90, 0, 0] },
        shape: 'circle',
      }),
      ...cylinderSidePanels(axisX, axisY, axisZ, init.radius, init.height, 8, color),
    ],
  };
}

function cylinderSidePanels(
  axisX: number,
  axisY: number,
  axisZ: number,
  radius: number,
  height: number,
  segments: number,
  color: Rgba,
): DesignPrimitiveNode[] {
  const panelWidth = regularPolygonSideForEqualCircleArea(radius, segments);
  const apothem = regularPolygonApothem(panelWidth, segments);
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * 360;
    const radians = (angle / 180) * Math.PI;
    const centerX = axisX + Math.sin(radians) * apothem;
    const centerZ = axisZ + Math.cos(radians) * apothem;
    const shade = index % 2 === 0 ? 0 : -18;
    return plane(`side${index}`, [panelWidth, height], [color[0] + shade, color[1] + shade, color[2] + shade, 1], {
      transform: {
        position: [roundGeometry(centerX - panelWidth / 2), roundGeometry(axisY - height / 2), roundGeometry(centerZ)],
        rotation: [0, angle, 0],
      },
    });
  });
}

function regularPolygonSideForEqualCircleArea(radius: number, segments: number) {
  const circleArea = Math.PI * radius * radius;
  return roundGeometry(Math.sqrt((4 * circleArea * Math.tan(Math.PI / segments)) / segments));
}

function regularPolygonApothem(sideLength: number, segments: number) {
  return roundGeometry(sideLength / (2 * Math.tan(Math.PI / segments)));
}

function roundGeometry(value: number) {
  return Number(value.toFixed(3));
}
