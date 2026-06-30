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
  | 'camera-focus'
  | 'camera-scroll'
  | 'interactive-object'
  | 'character-reaction'
  | 'content-callout'
  | 'interaction-html'
  | 'interactive-cover-scene'
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

export type DemoCaseOption = {
  id: string;
  label: string;
  expected: string;
};

export type DemoCameraState = {
  position?: Vec3Tuple;
  rotation?: Vec3Tuple;
  zoom?: number;
  origin?: string;
};

export type DemoCameraFocus = {
  initial: DemoCameraState;
  target: DemoCameraState;
  interactivePath: string;
};

export type DemoCameraSection = {
  id: string;
  label: string;
  path: string;
  camera: DemoCameraState;
};

export type DemoContentBinding = {
  path: string;
  title: string;
  body: string;
  camera?: DemoCameraState;
  characterState?: string;
};

export type DemoSpec = {
  id: DemoId;
  title: string;
  capability: string;
  maxDiffRatio: number;
  selectedCase?: string;
  cases?: DemoCaseOption[];
  root: DesignModelNode;
  requiredPaths: string[];
  projectionPaths?: string[];
  anchorChecks?: AnchorCheckSpec[];
  modelCounts?: Record<string, number>;
  interactionChecks?: Array<'cube-face' | 'controller-button' | 'sprite-button'>;
  interactionTargets?: string[];
  feedbackTargets?: string[];
  cameraFocus?: DemoCameraFocus;
  cameraScroll?: {
    initial: DemoCameraState;
    sections: DemoCameraSection[];
  };
  contentBindings?: DemoContentBinding[];
  characterReaction?: {
    triggerPath: string;
    characterPath: string;
    reactionState: string;
  };
  callout?: {
    initialPath: string;
  };
  interactiveCover?: boolean;
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

const anchorOrientationCases: DesignModelNode[] = [
  createAnchorOrientationCase('positionOnlyControl', {
    position: [34, 48, 8],
    attachmentMode: 'position',
  }),
  createAnchorOrientationCase('orientationAttach', {
    position: [178, 56, 12],
    attachmentMode: 'position-orientation',
  }),
  createAnchorOrientationCase('orientationWithParentTransform', {
    position: [86, 188, 18],
    rotation: [0, 0, 28],
    scale: [1.12, 1.12, 1.12],
    attachmentMode: 'position-orientation',
  }),
];

const anchorOrientationCaseOptions: DemoCaseOption[] = [
  { id: 'positionOnlyControl', label: 'Position-only control', expected: 'Plug origin touches socket anchor, but the green direction guides do not line up.' },
  { id: 'orientationAttach', label: 'Position + orientation', expected: 'Plug origin touches socket anchor and both green direction guides line up.' },
  { id: 'orientationWithParentTransform', label: 'Parent transform', expected: 'The same aligned pair remains attached after the parent group rotates and scales.' },
];

const pivotOriginCases: DesignModelNode[] = [
  createPivotOriginCase('centerPivotCase', {
    position: [26, 56, 4],
    pivot: [46, 24, 0],
  }),
  createPivotOriginCase('leftHingeCase', {
    position: [170, 60, 4],
    pivot: [0, 24, 0],
  }),
  createPivotOriginCase('topHingeCase', {
    position: [96, 178, 8],
    pivot: [46, 0, 0],
  }),
];

const pivotOriginCaseOptions: DemoCaseOption[] = [
  { id: 'centerPivotCase', label: 'Center pivot', expected: 'Door rotates around the yellow center pin; handle stays attached to the door.' },
  { id: 'leftHingeCase', label: 'Left hinge pivot', expected: 'Same door rotates around the left yellow pin; handle stays attached to the door.' },
  { id: 'topHingeCase', label: 'Top hinge pivot', expected: 'Same door rotates around the top yellow pin; handle stays attached to the door.' },
];

const worldBoundsCases: DesignModelNode[] = [
  createBoundsStackCase('translatedStack', {
    position: [44, 82, 12],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  }),
  createBoundsStackCase('rotatedStack', {
    position: [146, 76, 12],
    rotation: [0, 0, -24],
    scale: [1, 1, 1],
  }),
  {
    id: 'nestedScaledStack',
    kind: 'model',
    modelName: 'bounds-nested-case',
    transform: { position: [220, 154, 12], rotation: [0, 0, 0], scale: [1.18, 1.18, 1.18] },
    children: [
      createBoundsStackCase('innerStack', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }),
    ],
  },
];

const worldBoundsCaseOptions: DemoCaseOption[] = [
  { id: 'translatedStack', label: 'Translated stack', expected: 'Root bounds contains the unrotated stack and its cyan footprint plane.' },
  { id: 'rotatedStack', label: 'Rotated stack', expected: 'Root bounds expands to contain the same stack after rotation.' },
  { id: 'nestedScaledStack', label: 'Nested scaled stack', expected: 'Root bounds contains the same inner stack after parent scale.' },
];

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
        box('base', [380, 286, 16], [58, 73, 213, 1], {
          transform: { position: [-8, 246, 0] },
          faceColors: { top: [67, 80, 230, 1], front: [37, 47, 170, 1] },
        }),
        ...createSolidTextDemoNodes(defaultTypefaceFontId),
        box('comparisonBlock', [28, 28, 22], [239, 130, 168, 1], { transform: { position: [330, 14, 26] } }),
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
    capability: 'anchor position, normal and tangent alignment across rotated subcases',
    maxDiffRatio: 0.14,
    cases: anchorOrientationCaseOptions,
    root: {
      id: 'anchor-orientation',
      kind: 'model',
      modelName: 'anchor-orientation',
      children: anchorOrientationCases,
    },
    requiredPaths: [
      'anchor-orientation/positionOnlyControl/socket',
      'anchor-orientation/positionOnlyControl/plug',
      'anchor-orientation/positionOnlyControl/socketDirectionGuide/normal',
      'anchor-orientation/positionOnlyControl/plugDirectionGuide/normal',
      'anchor-orientation/orientationAttach/socket',
      'anchor-orientation/orientationAttach/plug',
      'anchor-orientation/orientationAttach/socketDirectionGuide/normal',
      'anchor-orientation/orientationAttach/plugDirectionGuide/normal',
      'anchor-orientation/orientationWithParentTransform/socket',
      'anchor-orientation/orientationWithParentTransform/plug',
      'anchor-orientation/orientationWithParentTransform/socketDirectionGuide/normal',
      'anchor-orientation/orientationWithParentTransform/plugDirectionGuide/normal',
    ],
    projectionPaths: [
      'anchor-orientation/positionOnlyControl/socket',
      'anchor-orientation/positionOnlyControl/plug',
      'anchor-orientation/orientationAttach/socket',
      'anchor-orientation/orientationAttach/plug',
      'anchor-orientation/orientationWithParentTransform/socket',
      'anchor-orientation/orientationWithParentTransform/plug',
    ],
    anchorChecks: [
      { aPath: 'anchor-orientation/positionOnlyControl/socket', aAnchor: 'out', bPath: 'anchor-orientation/positionOnlyControl/plug', bAnchor: 'in', maxDistance: 2 },
      { aPath: 'anchor-orientation/orientationAttach/socket', aAnchor: 'out', bPath: 'anchor-orientation/orientationAttach/plug', bAnchor: 'in', maxDistance: 2 },
      { aPath: 'anchor-orientation/orientationWithParentTransform/socket', aAnchor: 'out', bPath: 'anchor-orientation/orientationWithParentTransform/plug', bAnchor: 'in', maxDistance: 2 },
    ],
    modelCounts: { 'anchor-orientation': 1, 'anchor-orientation-case': 3 },
  },
  {
    id: 'pivot-origin',
    title: 'Pivot Origin',
    capability: 'explicit pivot/origin comparison across rotation axes',
    maxDiffRatio: 0.14,
    cases: pivotOriginCaseOptions,
    root: {
      id: 'pivot-origin',
      kind: 'model',
      modelName: 'pivot-origin',
      children: pivotOriginCases,
    },
    requiredPaths: [
      'pivot-origin/centerPivotCase/base',
      'pivot-origin/centerPivotCase/pivotPin',
      'pivot-origin/centerPivotCase/door',
      'pivot-origin/centerPivotCase/handle',
      'pivot-origin/leftHingeCase/base',
      'pivot-origin/leftHingeCase/pivotPin',
      'pivot-origin/leftHingeCase/door',
      'pivot-origin/leftHingeCase/handle',
      'pivot-origin/topHingeCase/base',
      'pivot-origin/topHingeCase/pivotPin',
      'pivot-origin/topHingeCase/door',
      'pivot-origin/topHingeCase/handle',
    ],
    projectionPaths: [
      'pivot-origin/centerPivotCase/door',
      'pivot-origin/leftHingeCase/door',
      'pivot-origin/topHingeCase/door',
    ],
    modelCounts: { 'pivot-origin': 1, 'pivot-origin-case': 3 },
  },
  {
    id: 'world-bounds',
    title: 'World Bounds',
    capability: 'resolved world bounds and spatial object query across nested transforms',
    maxDiffRatio: 0.14,
    cases: worldBoundsCaseOptions,
    root: {
      id: 'world-bounds',
      kind: 'model',
      modelName: 'world-bounds',
      children: [
        box('floor', [286, 184, 10], [67, 80, 230, 1], { transform: { position: [24, 86, 0] } }),
        ...worldBoundsCases,
      ],
    },
    requiredPaths: [
      'world-bounds/floor',
      'world-bounds/translatedStack',
      'world-bounds/translatedStack/base',
      'world-bounds/translatedStack/top',
      'world-bounds/rotatedStack',
      'world-bounds/rotatedStack/base',
      'world-bounds/rotatedStack/top',
      'world-bounds/nestedScaledStack',
      'world-bounds/nestedScaledStack/innerStack',
      'world-bounds/nestedScaledStack/innerStack/base',
      'world-bounds/nestedScaledStack/innerStack/top',
    ],
    projectionPaths: [
      'world-bounds/floor',
      'world-bounds/translatedStack',
      'world-bounds/rotatedStack',
      'world-bounds/nestedScaledStack',
    ],
    modelCounts: { 'world-bounds': 1, 'bounds-stack': 3, 'bounds-nested-case': 1 },
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
    id: 'camera-focus',
    title: 'Camera Focus',
    capability: 'view motion changes camera wrapper without mutating object transforms',
    maxDiffRatio: 0.12,
    root: {
      id: 'camera-focus',
      kind: 'model',
      modelName: 'camera-focus',
      children: [
        box('base', [260, 166, 8], [67, 80, 230, 1], {
          transform: { position: [34, 66, 0] },
          faceColors: { top: [76, 88, 232, 1], front: [38, 48, 176, 1] },
        }),
        box('cubeA', [44, 44, 48], [70, 178, 104, 1], { transform: { position: [58, 88, 14] } }),
        box('cubeB', [60, 54, 72], [240, 169, 80, 1], { transform: { position: [142, 78, 14] } }),
        box('cubeC', [38, 48, 58], [233, 120, 163, 1], { transform: { position: [234, 46, 14] } }),
        sprite('label', [96, 28], [255, 255, 255, 0.72], { transform: { position: [118, 156, 28] }, label: 'click cubeB' }),
      ],
    },
    requiredPaths: ['camera-focus/base', 'camera-focus/cubeA', 'camera-focus/cubeB', 'camera-focus/cubeC', 'camera-focus/label'],
    projectionPaths: ['camera-focus/base', 'camera-focus/cubeA', 'camera-focus/cubeB', 'camera-focus/cubeC'],
    modelCounts: { 'camera-focus': 1 },
    cameraFocus: {
      initial: { position: [0, 0, 0], zoom: 1, origin: '50% 50%' },
      target: { position: [-96, 44, 0], rotation: [0, 0, 0], zoom: 1.42, origin: '50% 50%' },
      interactivePath: 'camera-focus/cubeB',
    },
  },
  {
    id: 'camera-scroll',
    title: 'Camera Scroll',
    capability: 'scroll-driven view states without moving scene objects',
    maxDiffRatio: 0.12,
    root: {
      id: 'camera-scroll',
      kind: 'model',
      modelName: 'camera-scroll',
      children: [
        box('base', [286, 172, 8], [67, 80, 230, 1], { transform: { position: [28, 64, 0] } }),
        box('introCube', [42, 42, 46], [70, 178, 104, 1], { transform: { position: [52, 88, 14] } }),
        box('middleCube', [60, 48, 70], [240, 169, 80, 1], { transform: { position: [142, 76, 14] } }),
        box('finalCube', [42, 58, 56], [233, 120, 163, 1], { transform: { position: [236, 48, 14] } }),
      ],
    },
    requiredPaths: ['camera-scroll/base', 'camera-scroll/introCube', 'camera-scroll/middleCube', 'camera-scroll/finalCube'],
    projectionPaths: ['camera-scroll/base', 'camera-scroll/introCube', 'camera-scroll/middleCube', 'camera-scroll/finalCube'],
    modelCounts: { 'camera-scroll': 1 },
    cameraScroll: {
      initial: { position: [0, 0, 0], zoom: 1, origin: '50% 50%' },
      sections: [
        { id: 'intro', label: 'Intro', path: 'camera-scroll/introCube', camera: { position: [0, 0, 0], zoom: 1, origin: '50% 50%' } },
        { id: 'middle', label: 'Middle', path: 'camera-scroll/middleCube', camera: { position: [-52, 24, 0], zoom: 1.28, origin: '50% 50%' } },
        { id: 'final', label: 'Final', path: 'camera-scroll/finalCube', camera: { position: [-112, 46, 0], zoom: 1.44, origin: '50% 50%' } },
      ],
    },
  },
  {
    id: 'interactive-object',
    title: 'Interactive Object',
    capability: 'semantic path payload drives selected content and object feedback',
    maxDiffRatio: 0.16,
    root: {
      id: 'interactive-object',
      kind: 'model',
      modelName: 'interactive-object',
      children: [
        box('base', [250, 150, 8], [67, 80, 230, 1], { transform: { position: [42, 70, 0] } }),
        box('infoCube', [52, 52, 54], blue, { transform: { position: [70, 86, 14] } }),
        box('switchBlock', [76, 34, 26], [70, 178, 104, 1], { transform: { position: [154, 94, 18] } }),
        sprite('htmlPanel', [96, 42], [255, 255, 255, 0.76], { transform: { position: [132, 36, 46] }, label: 'panel' }),
      ],
    },
    requiredPaths: ['interactive-object/base', 'interactive-object/infoCube', 'interactive-object/switchBlock', 'interactive-object/htmlPanel'],
    projectionPaths: ['interactive-object/base', 'interactive-object/infoCube', 'interactive-object/switchBlock', 'interactive-object/htmlPanel'],
    modelCounts: { 'interactive-object': 1 },
    interactionTargets: ['interactive-object/switchBlock'],
    feedbackTargets: ['interactive-object/switchBlock'],
    contentBindings: [
      { path: 'interactive-object/infoCube', title: 'Info cube', body: 'Selected from semantic cube path.', camera: { position: [-20, 12, 0], zoom: 1.18, origin: '50% 50%' } },
      { path: 'interactive-object/switchBlock', title: 'Switch block', body: 'Selected from semantic switch path.', camera: { position: [-70, 20, 0], zoom: 1.24, origin: '50% 50%' } },
      { path: 'interactive-object/htmlPanel', title: 'HTML panel', body: 'Selected from semantic sprite path.', camera: { position: [-48, 48, 0], zoom: 1.18, origin: '50% 50%' } },
    ],
  },
  {
    id: 'character-reaction',
    title: 'Character Reaction',
    capability: 'selected state drives whole-model reaction without breaking anchors',
    maxDiffRatio: 0.18,
    root: {
      id: 'character-reaction',
      kind: 'model',
      modelName: 'character-reaction',
      children: [
        box('stage', [260, 154, 10], [67, 80, 230, 1], { transform: { position: [42, 86, 0] } }),
        { ...characterNode, transform: { position: [126, 20, 40], scale: [0.58, 0.58, 0.58] } },
        box('reactionProp', [46, 38, 34], [233, 120, 163, 1], { transform: { position: [70, 82, 30] } }),
      ],
    },
    requiredPaths: ['character-reaction/stage', 'character-reaction/character/body', 'character-reaction/character/head', 'character-reaction/character/controller/shell', 'character-reaction/reactionProp'],
    projectionPaths: ['character-reaction/stage', 'character-reaction/character', 'character-reaction/reactionProp'],
    modelCounts: { 'character-reaction': 1, character: 1, controller: 1 },
    anchorChecks: [
      { aPath: 'character-reaction/character/head', aAnchor: 'bottom', bPath: 'character-reaction/character/neck', bAnchor: 'top', maxDistance: 2 },
      { aPath: 'character-reaction/character/leftHand', aAnchor: 'grip', bPath: 'character-reaction/character/controller', bAnchor: 'leftGrip', maxDistance: 2 },
      { aPath: 'character-reaction/character/rightHand', aAnchor: 'grip', bPath: 'character-reaction/character/controller', bAnchor: 'rightGrip', maxDistance: 2 },
    ],
    characterReaction: {
      triggerPath: 'character-reaction/reactionProp',
      characterPath: 'character-reaction/character',
      reactionState: 'excited',
    },
    feedbackTargets: ['character-reaction/reactionProp'],
    contentBindings: [
      { path: 'character-reaction/reactionProp', title: 'Reaction prop', body: 'Clicking the prop changes scene state and character feedback.', characterState: 'excited' },
    ],
  },
  {
    id: 'content-callout',
    title: 'Content Callout',
    capability: '2D content panel binds to selected 3D object projected bounds',
    maxDiffRatio: 0.16,
    root: {
      id: 'content-callout',
      kind: 'model',
      modelName: 'content-callout',
      children: [
        box('base', [270, 158, 8], [67, 80, 230, 1], { transform: { position: [32, 72, 0] } }),
        box('featureA', [48, 48, 54], [70, 178, 104, 1], { transform: { position: [66, 92, 14] } }),
        box('featureB', [58, 42, 66], [240, 169, 80, 1], { transform: { position: [154, 82, 14] } }),
        box('featureC', [42, 54, 48], [233, 120, 163, 1], { transform: { position: [232, 54, 14] } }),
      ],
    },
    requiredPaths: ['content-callout/base', 'content-callout/featureA', 'content-callout/featureB', 'content-callout/featureC'],
    projectionPaths: ['content-callout/base', 'content-callout/featureA', 'content-callout/featureB', 'content-callout/featureC'],
    modelCounts: { 'content-callout': 1 },
    interactionTargets: ['content-callout/featureB'],
    feedbackTargets: ['content-callout/featureB'],
    contentBindings: [
      { path: 'content-callout/featureA', title: 'Feature A', body: 'Callout target is computed from object faces.' },
      { path: 'content-callout/featureB', title: 'Feature B', body: 'Camera and panel can respond to the same selected path.', camera: { position: [-58, 20, 0], zoom: 1.28, origin: '50% 50%' } },
      { path: 'content-callout/featureC', title: 'Feature C', body: 'Resize or camera changes recompute the callout target.', camera: { position: [-112, 42, 0], zoom: 1.36, origin: '50% 50%' } },
    ],
    callout: { initialPath: 'content-callout/featureA' },
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
    id: 'interactive-cover-scene',
    title: 'Interactive Cover Scene',
    capability: 'integrated camera, content, callout and character reaction scene',
    maxDiffRatio: 0.25,
    root: {
      id: 'interactive-cover-scene',
      kind: 'model',
      modelName: 'interactive-cover-scene',
      children: [
        islandNode,
        { ...cameraNode, transform: { position: [76, 48, 58] } },
        { ...characterNode, transform: { position: [190, -6, 64], scale: [0.78, 0.78, 0.78] } },
        box('interactiveProp', [44, 34, 24], [70, 178, 104, 1], { transform: { position: [42, 142, 90] } }),
        extrude('visualWord', [126, 34], [239, 130, 168, 1], { transform: { position: [64, 170, 44] }, textHeight: 18, textSmooth: 'mid', label: 'VISUAL', renderMode: 'layered-text' }),
      ],
    },
    requiredPaths: [
      'interactive-cover-scene/island/base',
      'interactive-cover-scene/camera/body',
      'interactive-cover-scene/character/body',
      'interactive-cover-scene/character/controller/shell',
      'interactive-cover-scene/interactiveProp',
      'interactive-cover-scene/visualWord',
    ],
    projectionPaths: ['interactive-cover-scene/island', 'interactive-cover-scene/camera', 'interactive-cover-scene/character', 'interactive-cover-scene/interactiveProp', 'interactive-cover-scene/visualWord'],
    modelCounts: { 'interactive-cover-scene': 1, island: 1, camera: 1, character: 1, controller: 1 },
    anchorChecks: [
      { aPath: 'interactive-cover-scene/character/head', aAnchor: 'bottom', bPath: 'interactive-cover-scene/character/neck', bAnchor: 'top', maxDistance: 2 },
      { aPath: 'interactive-cover-scene/character/leftHand', aAnchor: 'grip', bPath: 'interactive-cover-scene/character/controller', bAnchor: 'leftGrip', maxDistance: 2 },
    ],
    contentBindings: [
      { path: 'interactive-cover-scene/camera/body', title: 'Camera object', body: 'Camera object stays model-driven while the page view moves.', camera: { position: [-16, 24, 0], zoom: 1.16, origin: '50% 50%' } },
      { path: 'interactive-cover-scene/interactiveProp', title: 'Interactive prop', body: 'This prop drives camera, callout and character reaction.', camera: { position: [-98, 38, 0], zoom: 1.34, origin: '50% 50%' }, characterState: 'excited' },
      { path: 'interactive-cover-scene/visualWord', title: 'Layered word', body: 'Cover scene can mix previous verified visual assets.', camera: { position: [-48, -6, 0], zoom: 1.18, origin: '50% 50%' } },
    ],
    interactionTargets: ['interactive-cover-scene/interactiveProp'],
    feedbackTargets: ['interactive-cover-scene/interactiveProp'],
    characterReaction: {
      triggerPath: 'interactive-cover-scene/interactiveProp',
      characterPath: 'interactive-cover-scene/character',
      reactionState: 'excited',
    },
    callout: { initialPath: 'interactive-cover-scene/camera/body' },
    interactiveCover: true,
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

export function getDemoSpec(id: string | null, caseId?: string | null): DemoSpec {
  const spec = demoSpecs.find((demo) => demo.id === id) ?? demoSpecs[0];
  return resolveDemoCase(spec, caseId);
}

export function getDemoBaseSpec(id: string | null): DemoSpec {
  return demoSpecs.find((demo) => demo.id === id) ?? demoSpecs[0];
}

export function getDemoCases(id: string | null): DemoCaseOption[] {
  return (demoSpecs.find((demo) => demo.id === id) ?? demoSpecs[0]).cases ?? [];
}

function resolveDemoCase(spec: DemoSpec, caseId?: string | null): DemoSpec {
  if (!spec.cases || spec.cases.length === 0) return spec;
  const selectedCase = spec.cases.some((item) => item.id === caseId) ? caseId! : spec.cases[0].id;
  if (spec.id === 'anchor-orientation') return singleModelCaseSpec(spec, selectedCase);
  if (spec.id === 'pivot-origin') return singleModelCaseSpec(spec, selectedCase);
  if (spec.id === 'world-bounds') return worldBoundsCaseSpec(spec, selectedCase);
  return { ...spec, selectedCase };
}

function singleModelCaseSpec(spec: DemoSpec, selectedCase: string): DemoSpec {
  const selected = spec.root.children.find((child) => child.kind === 'model' && child.id === selectedCase);
  if (!selected) return { ...spec, selectedCase };
  return {
    ...spec,
    selectedCase,
    root: {
      ...spec.root,
      children: [selected],
    },
    requiredPaths: spec.requiredPaths.filter((path) => path.startsWith(`${spec.root.id}/${selectedCase}/`)),
    projectionPaths: spec.projectionPaths?.filter((path) => path.startsWith(`${spec.root.id}/${selectedCase}/`)),
    anchorChecks: spec.anchorChecks?.filter((check) => check.aPath.startsWith(`${spec.root.id}/${selectedCase}/`) || check.bPath.startsWith(`${spec.root.id}/${selectedCase}/`)),
    modelCounts: caseModelCounts(spec, selectedCase),
  };
}

function worldBoundsCaseSpec(spec: DemoSpec, selectedCase: string): DemoSpec {
  const floor = spec.root.children.find((child) => child.id === 'floor');
  const selected = spec.root.children.find((child) => child.kind === 'model' && child.id === selectedCase);
  if (!floor || !selected) return { ...spec, selectedCase };
  return {
    ...spec,
    selectedCase,
    root: {
      ...spec.root,
      children: [floor, selected],
    },
    requiredPaths: spec.requiredPaths.filter((path) => path === 'world-bounds/floor' || path.startsWith(`world-bounds/${selectedCase}/`) || path === `world-bounds/${selectedCase}`),
    projectionPaths: spec.projectionPaths?.filter((path) => path === 'world-bounds/floor' || path === `world-bounds/${selectedCase}`),
    modelCounts: caseModelCounts(spec, selectedCase),
  };
}

function caseModelCounts(spec: DemoSpec, selectedCase: string): Record<string, number> {
  if (spec.id === 'anchor-orientation') return { 'anchor-orientation': 1, 'anchor-orientation-case': 1 };
  if (spec.id === 'pivot-origin') return { 'pivot-origin': 1, 'pivot-origin-case': 1 };
  if (spec.id === 'world-bounds') {
    return selectedCase === 'nestedScaledStack'
      ? { 'world-bounds': 1, 'bounds-stack': 1, 'bounds-nested-case': 1 }
      : { 'world-bounds': 1, 'bounds-stack': 1 };
  }
  return spec.modelCounts ?? {};
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

function createAnchorOrientationCase(
  id: string,
  init: {
    position: Vec3Tuple;
    rotation?: Vec3Tuple;
    scale?: Vec3Tuple;
    attachmentMode: 'position' | 'position-orientation';
  },
): DesignModelNode {
  const socketRotation = -28;
  const socketAnchorRotation = 34;
  const plugAnchorRotation = -18;
  const socketColor: Rgba = [91, 140, 232, 1];
  const plugColor: Rgba = [240, 169, 80, 1];
  return {
    id,
    kind: 'model',
    modelName: 'anchor-orientation-case',
    transform: {
      position: init.position,
      rotation: init.rotation,
      scale: init.scale,
    },
    children: [
      plane('guidePlane', [164, 92], [118, 150, 255, 0.26], {
        transform: { position: [-24, -30, 6] },
      }),
      box('socket', [64, 30, 24], socketColor, {
        transform: { position: [0, 0, 14], rotation: [0, 0, socketRotation], pivot: [32, 15, 0] },
        anchors: {
          out: {
            position: [64, 15, 24],
            rotation: [0, 0, socketAnchorRotation],
            normal: [1, 0, 0],
            tangent: [0, 1, 0],
          },
        },
        faceColors: { top: lighten(socketColor, 24), front: darken(socketColor, 28) },
      }),
      box('plug', [44, 22, 22], plugColor, {
        transform: { pivot: [22, 11, 0] },
        anchors: {
          in: {
            position: [0, 11, 22],
            rotation: [0, 0, plugAnchorRotation],
            normal: [1, 0, 0],
            tangent: [0, 1, 0],
          },
        },
        faceColors: { top: [255, 193, 101, 1], front: [204, 125, 52, 1] },
      }),
      createAnchorDirectionGuide('socketDirectionGuide', [88, 236, 164, 1]),
      createAnchorDirectionGuide('plugDirectionGuide', [147, 255, 189, 0.92]),
    ],
    attachments: [
      { childId: 'plug', childAnchor: 'in', parentId: 'socket', parentAnchor: 'out', mode: init.attachmentMode },
      { childId: 'socketDirectionGuide', childAnchor: 'origin', parentId: 'socket', parentAnchor: 'out', mode: 'position-orientation' },
      { childId: 'plugDirectionGuide', childAnchor: 'origin', parentId: 'plug', parentAnchor: 'in', mode: 'position-orientation' },
    ],
  };
}

function createAnchorDirectionGuide(id: string, color: Rgba): DesignModelNode {
  return {
    id,
    kind: 'model',
    modelName: 'anchor-direction-guide',
    anchors: { origin: [0, 0, 0] },
    children: [
      box('point', [5, 5, 5], [255, 255, 255, 0.95], {
        transform: { position: [-2.5, -2.5, -2.5] },
      }),
      box('normal', [62, 2, 2], color, {
        transform: { position: [0, -1, -1] },
      }),
      box('tip', [6, 6, 6], color, {
        transform: { position: [59, -3, -3] },
      }),
    ],
  };
}

function createRotationAxis(id: string, origin: Vec3Tuple, height: number): DesignModelNode {
  return {
    id,
    kind: 'model',
    modelName: 'rotation-axis',
    transform: { position: origin },
    children: [
      box('origin', [6, 6, 6], [255, 255, 255, 0.95], {
        transform: { position: [-3, -3, -3] },
      }),
      box('axis', [2, 2, height], [255, 230, 96, 1], {
        transform: { position: [-1, -1, 0] },
      }),
      box('tip', [6, 6, 6], [255, 230, 96, 1], {
        transform: { position: [-3, -3, height - 2] },
      }),
    ],
  };
}

function createPivotOriginCase(
  id: string,
  init: {
    position: Vec3Tuple;
    pivot: Vec3Tuple;
  },
): DesignModelNode {
  const doorColor: Rgba = [91, 140, 232, 1];
  const doorRotation = -46;
  const doorPosition: Vec3Tuple = [44, 28, 20];
  const pivotPinPosition: Vec3Tuple = [
    doorPosition[0] + init.pivot[0] - 5,
    doorPosition[1] + init.pivot[1] - 5,
    doorPosition[2] + 18,
  ];
  return {
    id,
    kind: 'model',
    modelName: 'pivot-origin-case',
    transform: { position: init.position },
    children: [
      box('base', [124, 34, 10], [75, 91, 150, 1], { transform: { position: [16, 66, 2] } }),
      plane('pivotPlane', [132, 84], [118, 150, 255, 0.26], { transform: { position: [22, 10, 14] } }),
      box('pivotGuideX', [132, 3, 3], [235, 90, 105, 1], { transform: { position: [doorPosition[0] + init.pivot[0] - 66, doorPosition[1] + init.pivot[1] - 1.5, doorPosition[2] + 24] } }),
      box('pivotGuideY', [3, 104, 3], [92, 222, 140, 1], { transform: { position: [doorPosition[0] + init.pivot[0] - 1.5, doorPosition[1] + init.pivot[1] - 52, doorPosition[2] + 25] } }),
      createRotationAxis('rotationAxis', [doorPosition[0] + init.pivot[0], doorPosition[1] + init.pivot[1], doorPosition[2] - 18], 92),
      box('pivotPin', [7, 7, 7], [244, 213, 98, 1], { transform: { position: [pivotPinPosition[0] + 1.5, pivotPinPosition[1] + 1.5, pivotPinPosition[2] + 18] } }),
      box('door', [92, 48, 16], doorColor, {
        transform: { position: doorPosition, rotation: [0, 0, doorRotation], pivot: init.pivot },
        anchors: {
          pivot: { position: [init.pivot[0], init.pivot[1], 8], normal: [0, 0, 1], tangent: [1, 0, 0] },
          handle: { position: [82, 24, 16], normal: [1, 0, 0], tangent: [0, 1, 0] },
        },
        faceColors: { top: lighten(doorColor, 24), front: darken(doorColor, 32) },
      }),
      box('handle', [12, 12, 12], [238, 222, 198, 1], {
        anchors: { mount: [6, 6, 6] },
      }),
    ],
    attachments: [
      { childId: 'handle', childAnchor: 'mount', parentId: 'door', parentAnchor: 'handle' },
    ],
  };
}

function createBoundsStackCase(
  id: string,
  init: {
    position: Vec3Tuple;
    rotation: Vec3Tuple;
    scale: Vec3Tuple;
  },
): DesignModelNode {
  const baseColor: Rgba = [70, 178, 104, 1];
  const topColor: Rgba = [121, 226, 173, 1];
  return {
    id,
    kind: 'model',
    modelName: 'bounds-stack',
    transform: { position: init.position, rotation: init.rotation, scale: init.scale },
    children: [
      createRotationAxis('rotationAxis', [0, 0, 0], 68),
      plane('boundsFootprint', [104, 100], [80, 200, 216, 0.28], { transform: { position: [-24, -50, 1] } }),
      box('localXAxis', [118, 3, 3], [235, 90, 105, 1], { transform: { position: [-24, 7, 5] } }),
      box('localYAxis', [3, 112, 3], [92, 222, 140, 1], { transform: { position: [27, -50, 6] } }),
      box('base', [56, 42, 32], baseColor, {
        faceColors: { top: lighten(baseColor, 18), front: darken(baseColor, 28) },
      }),
      box('top', [34, 34, 46], topColor, {
        transform: { position: [12, -28, 32] },
        faceColors: { top: lighten(topColor, 16), front: darken(topColor, 24) },
      }),
    ],
  };
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

function lighten(color: Rgba, amount: number): Rgba {
  return [clampColor(color[0] + amount), clampColor(color[1] + amount), clampColor(color[2] + amount), color[3]];
}

function darken(color: Rgba, amount: number): Rgba {
  return [clampColor(color[0] - amount), clampColor(color[1] - amount), clampColor(color[2] - amount), color[3]];
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, value));
}
