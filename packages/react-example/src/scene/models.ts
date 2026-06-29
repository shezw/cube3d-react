/*
    Cube3D React
    packages/react-example/src/scene/models.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import {
  attach,
  boxPrimitive,
  defineModel,
  part,
  planePrimitive,
  resolveModel,
  spritePrimitive,
  type AnchorMap,
  type MaterialSolid,
  type ModelDefinition,
  type SceneNode,
  type Size2,
  type Size3,
} from '@cube3d/core';

type Rgba = [number, number, number, number];

export const skin = solid([226, 190, 148, 1]);
export const blue = solid([73, 84, 235, 1]);
export const darkBlue = solid([47, 54, 185, 1]);
export const controllerBody = solid([82, 83, 132, 1]);

export const controllerModel = defineModel(
  'controller',
  [
    part('shell', box({ x: 132, y: 78, z: 26 }, controllerBody, {
      top: solid([101, 102, 154, 1]),
      front: solid([62, 64, 108, 1]),
    }), {
      anchors: anchors({
        bodyMount: { x: 66, y: 0, z: 26 },
        leftGrip: { x: 18, y: 20, z: 30 },
        rightGrip: { x: 112, y: 22, z: 30 },
        cordOut: { x: 126, y: 76, z: 20 },
      }),
    }),
    part('greenButton', box({ x: 20, y: 20, z: 8 }, solid([42, 183, 99, 1])), { transform: { position: { x: 22, y: 23, z: 28 } } }),
    part('orangeButton', box({ x: 20, y: 20, z: 8 }, solid([221, 139, 55, 1])), { transform: { position: { x: 54, y: 31, z: 28 } } }),
    part('blueButton', box({ x: 20, y: 20, z: 8 }, solid([57, 154, 210, 1])), { transform: { position: { x: 32, y: 52, z: 28 } } }),
    part('stick', box({ x: 16, y: 16, z: 42 }, solid([42, 45, 62, 1])), { transform: { position: { x: 88, y: 40, z: 24 } } }),
    part('cord', sprite({ x: 84, y: 154 }, solid([7, 9, 18, 0.78])), { transform: { position: { x: 111, y: 76, z: 18 } } }),
  ],
  {
    anchors: anchors({
      bodyMount: { x: 66, y: 0, z: 26 },
      leftGrip: { x: 18, y: 20, z: 30 },
      rightGrip: { x: 112, y: 22, z: 30 },
    }),
  },
);

export const characterModel = defineModel(
  'character',
  [
    part('body', box({ x: 84, y: 76, z: 76 }, blue, {
      top: solid([96, 107, 255, 1]),
      front: solid([63, 70, 205, 1]),
      right: solid([52, 58, 184, 1]),
    }), {
      transform: { position: { x: 32, y: 30, z: 70 } },
      anchors: anchors({
        neck: { x: 42, y: 0, z: 76 },
        leftShoulder: { x: 4, y: 32, z: 58 },
        rightShoulder: { x: 80, y: 32, z: 58 },
        controllerMount: { x: 62, y: 86, z: 0 },
      }),
    }),
    part('neck', box({ x: 36, y: 28, z: 24 }, skin), {
      anchors: anchors({
        bottom: { x: 18, y: 28, z: 0 },
        top: { x: 18, y: 0, z: 24 },
      }),
    }),
    part('head', box({ x: 68, y: 60, z: 54 }, solid([238, 222, 198, 1]), {
      front: solid([242, 226, 204, 1]),
      top: solid([250, 238, 220, 1]),
      right: solid([218, 195, 168, 1]),
    }), {
      anchors: anchors({
        bottom: { x: 34, y: 60, z: 0 },
        top: { x: 34, y: 0, z: 54 },
        faceMount: { x: 34, y: 38, z: 29 },
      }),
    }),
    part('face', sprite({ x: 50, y: 24 }, solid([255, 255, 255, 0])), {
      anchors: anchors({
        headMount: { x: 25, y: 0, z: 0 },
      }),
    }),
    part('hatBrim', box({ x: 88, y: 68, z: 14 }, solid([244, 234, 218, 1])), {
      anchors: anchors({
        bottom: { x: 44, y: 68, z: 0 },
        top: { x: 44, y: 0, z: 14 },
      }),
    }),
    part('hatTop', box({ x: 64, y: 48, z: 20 }, solid([238, 226, 210, 1])), {
      anchors: anchors({
        bottom: { x: 32, y: 48, z: 0 },
      }),
    }),
    part('leftArm', box({ x: 30, y: 68, z: 28 }, skin), {
      transform: { rotation: { z: -10 } },
      anchors: anchors({
        shoulder: { x: 30, y: 0, z: 28 },
      }),
    }),
    part('rightArm', box({ x: 30, y: 68, z: 28 }, skin), {
      transform: { rotation: { z: 12 } },
      anchors: anchors({
        shoulder: { x: 0, y: 0, z: 28 },
      }),
    }),
    part('leftSleeve', box({ x: 32, y: 34, z: 30 }, solid([74, 84, 220, 1])), {
      transform: { rotation: { z: -10 } },
      anchors: anchors({
        top: { x: 32, y: 0, z: 20 },
      }),
    }),
    part('rightSleeve', box({ x: 32, y: 34, z: 30 }, solid([68, 78, 213, 1])), {
      transform: { rotation: { z: 12 } },
      anchors: anchors({
        top: { x: 0, y: 0, z: 20 },
      }),
    }),
    part('belt', box({ x: 104, y: 28, z: 24 }, darkBlue), {
      anchors: anchors({
        top: { x: 52, y: 0, z: 24 },
        leftLegTop: { x: 22, y: 28, z: 0 },
        rightLegTop: { x: 72, y: 28, z: 0 },
      }),
    }),
    part('leftLeg', box({ x: 20, y: 60, z: 26 }, solid([38, 42, 96, 1])), {
      anchors: anchors({
        top: { x: 10, y: 0, z: 26 },
      }),
    }),
    part('rightLeg', box({ x: 20, y: 60, z: 26 }, solid([38, 42, 96, 1])), {
      anchors: anchors({
        top: { x: 10, y: 0, z: 26 },
      }),
    }),
    part('controller', createControllerNode(), {
      anchors: resolveModel(controllerModel).anchors,
    }),
    part('leftHand', box({ x: 36, y: 32, z: 30 }, skin), {
      anchors: anchors({
        grip: { x: 18, y: 16, z: 15 },
      }),
    }),
    part('rightHand', box({ x: 38, y: 34, z: 32 }, skin), {
      anchors: anchors({
        grip: { x: 19, y: 17, z: 16 },
      }),
    }),
    part('shadow', plane({ x: 146, y: 118 }, solid([15, 17, 28, 0.22])), {
      transform: { position: { x: -15, y: 118, z: -12 } },
    }),
  ],
  {
    attachments: [
      attach('neck', 'bottom', 'body', 'neck'),
      attach('head', 'bottom', 'neck', 'top'),
      attach('face', 'headMount', 'head', 'faceMount'),
      attach('hatBrim', 'bottom', 'head', 'top'),
      attach('hatTop', 'bottom', 'hatBrim', 'top'),
      attach('leftArm', 'shoulder', 'body', 'leftShoulder'),
      attach('rightArm', 'shoulder', 'body', 'rightShoulder'),
      attach('leftSleeve', 'top', 'body', 'leftShoulder'),
      attach('rightSleeve', 'top', 'body', 'rightShoulder'),
      attach('belt', 'top', 'body', 'controllerMount'),
      attach('leftLeg', 'top', 'belt', 'leftLegTop'),
      attach('rightLeg', 'top', 'belt', 'rightLegTop'),
      attach('controller', 'bodyMount', 'body', 'controllerMount'),
      attach('leftHand', 'grip', 'controller', 'leftGrip'),
      attach('rightHand', 'grip', 'controller', 'rightGrip'),
    ],
  },
);

export const cameraModel = defineModel('camera', [
  part('body', box({ x: 72, y: 50, z: 52 }, solid([78, 144, 188, 1]))),
  part('topButton', box({ x: 28, y: 16, z: 20 }, solid([217, 70, 93, 1])), { transform: { position: { x: 22, y: -11, z: 44 } } }),
  part('leftLeg', box({ x: 28, y: 56, z: 22 }, solid([124, 169, 202, 1])), { transform: { position: { x: -15, y: 46, z: -16 } } }),
  part('rightLeg', box({ x: 20, y: 56, z: 22 }, solid([101, 133, 164, 1])), { transform: { position: { x: 52, y: 46, z: -16 } } }),
  part('foot', box({ x: 46, y: 18, z: 24 }, solid([62, 166, 232, 1])), { transform: { position: { x: 12, y: 88, z: -22 } } }),
  part('beam', sprite({ x: 220, y: 120 }, solid([255, 66, 92, 0.28])), { transform: { position: { x: -40, y: 18, z: 44 } } }),
]);

export const islandModel = defineModel('island', [
  part('base', box({ x: 560, y: 380, z: 64 }, solid([58, 73, 213, 1]), {
    top: solid([67, 80, 230, 1]),
    front: solid([37, 47, 170, 1]),
    right: solid([32, 41, 150, 1]),
  })),
  part('parkGrid', plane({ x: 190, y: 118 }, solid([76, 87, 206, 0.36])), {
    transform: { position: { x: 318, y: 228, z: 67 } },
  }),
]);

export const coverSceneModel = defineModel('cover-scene', [
  part('island', createIslandNode()),
  part('camera', createCameraNode(), { transform: { position: { x: 155, y: 48, z: 78 } } }),
  part('character', createCharacterNode(), { transform: { position: { x: 408, y: -2, z: 88 }, scale: { x: 1.22, y: 1.22, z: 1.22 } } }),
]);

export function createControllerNode(): SceneNode {
  return resolveModel(controllerModel, 'controller');
}

export function createCharacterNode(): SceneNode {
  return resolveModel(characterModel, 'character');
}

export function createCameraNode(): SceneNode {
  return resolveModel(cameraModel, 'camera');
}

export function createIslandNode(): SceneNode {
  return resolveModel(islandModel, 'island');
}

export function createCoverSceneNode(): SceneNode {
  return resolveModel(coverSceneModel, 'cover-scene');
}

function box(size: Size3, material: MaterialSolid, materials?: Partial<Record<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom', MaterialSolid>>) {
  return boxPrimitive({ size, material, materials, contrast: 9 });
}

function plane(size: Size2, material: MaterialSolid) {
  return planePrimitive({ size, material });
}

function sprite(size: Size2, material: MaterialSolid) {
  return spritePrimitive({ size, material });
}

function solid(rgba: Rgba): MaterialSolid {
  return { kind: 'solid', rgba };
}

function anchors(points: Record<string, { x: number; y: number; z: number }>): AnchorMap {
  return Object.fromEntries(Object.entries(points).map(([id, position]) => [id, { id, position }]));
}
