/*
    cube3d-react
    packages/react-example/src/demos/ThreeReference.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { DemoId } from './registry';
import { stageSize } from './registry';

type BoxSpec = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: number;
  rotation?: [number, number, number];
};

export function ThreeReference({ demoId }: { demoId: DemoId }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setClearColor(0x20232f, 1);
    host.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-210, 210, 145, -145, 1, 1000);
    camera.position.set(260, 230, 340);
    camera.lookAt(0, 0, 0);

    addGrid(scene);
    for (const box of referenceBoxes(demoId)) {
      addBox(scene, box);
    }
    if (demoId === 'anchor-assembly' || demoId === 'nested-model' || demoId === 'cover-scene') {
      addAnchorMarkers(scene, referenceBoxes(demoId));
    }

    renderer.render(scene, camera);
    return () => renderer.dispose();
  }, [demoId]);

  return <div ref={hostRef} data-reference-canvas style={panelStyle} />;
}

function referenceBoxes(demoId: DemoId): BoxSpec[] {
  if (demoId === 'primitive-lab') {
    return [
      { id: 'box', position: [-92, 22, 30], size: [68, 68, 60], color: 0x4c66e8 },
      { id: 'plane', position: [0, -38, 3], size: [120, 70, 6], color: 0x6a7adf },
      { id: 'sprite', position: [96, 18, 16], size: [62, 42, 8], color: 0xf0a950 },
      ...Array.from({ length: 6 }, (_, index) => ({ id: `layer-${index}`, position: [84 + index * 3, -72 + index * 2, 18 + index * 2] as [number, number, number], size: [42, 20, 4] as [number, number, number], color: 0xe978a3 })),
    ];
  }
  if (demoId === 'transform-room') {
    return [
      { id: 'parent', position: [-70, 10, 20], size: [36, 36, 36], color: 0x4c66e8, rotation: [0, 0, Math.PI / 8] },
      { id: 'child-a', position: [-20, 38, 30], size: [26, 26, 26], color: 0xf0a950, rotation: [0, 0, Math.PI / 6] },
      { id: 'child-b', position: [28, 0, 44], size: [34, 34, 34], color: 0x3fc476, rotation: [0, 0, -Math.PI / 9] },
      { id: 'child-c', position: [84, -36, 25], size: [50, 28, 38], color: 0xde5f78 },
    ];
  }
  if (demoId === 'anchor-assembly') {
    return [
      { id: 'body', position: [-20, -35, 28], size: [72, 58, 56], color: 0x4c66e8 },
      { id: 'neck', position: [-20, 10, 68], size: [26, 22, 20], color: 0xe2be94 },
      { id: 'head', position: [-20, 46, 96], size: [52, 46, 46], color: 0xeedec6 },
      { id: 'hatBrim', position: [-20, 82, 128], size: [74, 42, 12], color: 0xf4ead8 },
      { id: 'hatTop', position: [-20, 112, 146], size: [50, 32, 20], color: 0xeee2d2 },
    ];
  }
  if (demoId === 'nested-model') {
    return [
      { id: 'body', position: [-20, -20, 58], size: [70, 58, 60], color: 0x4c66e8 },
      { id: 'leftHand', position: [-80, -72, 36], size: [30, 28, 28], color: 0xe2be94 },
      { id: 'rightHand', position: [64, -72, 36], size: [30, 28, 28], color: 0xe2be94 },
      { id: 'controller', position: [-8, -80, 28], size: [118, 54, 20], color: 0x65669a },
      { id: 'stick', position: [42, -72, 54], size: [14, 14, 30], color: 0x2a2d3e },
    ];
  }
  if (demoId === 'object-field') {
    return [
      { id: 'base', position: [0, -20, 4], size: [220, 150, 8], color: 0x4350e6 },
      { id: 'cubeA', position: [-72, -20, 36], size: [48, 48, 58], color: 0xde705c },
      { id: 'cubeB', position: [24, -12, 46], size: [70, 48, 78], color: 0xf0d562 },
      { id: 'camera', position: [94, 34, 38], size: [48, 36, 42], color: 0x4e90bc },
      { id: 'prop', position: [-112, 42, 20], size: [42, 34, 24], color: 0x46b268 },
    ];
  }
  if (demoId === 'interaction-html') {
    return [
      { id: 'button-box', position: [-62, -18, 38], size: [62, 62, 54], color: 0x4c66e8 },
      { id: 'controller', position: [52, -36, 28], size: [110, 46, 20], color: 0x65669a },
      { id: 'sprite', position: [56, 38, 28], size: [86, 32, 8], color: 0x58c879 },
    ];
  }
  return [
    { id: 'island', position: [0, -42, 12], size: [238, 152, 24], color: 0x4350e6 },
    { id: 'visual', position: [-8, 10, 46], size: [96, 26, 20], color: 0xef82a8 },
    { id: 'art', position: [84, -10, 58], size: [68, 30, 30], color: 0xf6d562 },
    { id: 'camera', position: [-96, 28, 48], size: [42, 32, 42], color: 0x4e90bc },
    { id: 'character', position: [64, 42, 74], size: [66, 50, 90], color: 0x4c66e8 },
    { id: 'controller', position: [58, 2, 46], size: [92, 34, 18], color: 0x65669a },
  ];
}

function addBox(scene: THREE.Scene, spec: BoxSpec) {
  const geometry = new THREE.BoxGeometry(spec.size[0], spec.size[1], spec.size[2]);
  const material = new THREE.MeshBasicMaterial({ color: spec.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(spec.position[0], spec.position[1], spec.position[2]);
  if (spec.rotation) mesh.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
  scene.add(mesh);
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24 }));
  mesh.add(lines);
}

function addGrid(scene: THREE.Scene) {
  const grid = new THREE.GridHelper(280, 14, 0x5360b8, 0x33394f);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -2;
  scene.add(grid);
}

function addAnchorMarkers(scene: THREE.Scene, boxes: BoxSpec[]) {
  const material = new THREE.MeshBasicMaterial({ color: 0x6af08b });
  for (const box of boxes.slice(0, 5)) {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), material);
    marker.position.set(box.position[0], box.position[1] + box.size[1] / 2, box.position[2] + box.size[2] / 2);
    scene.add(marker);
  }
}

const panelStyle: React.CSSProperties = {
  width: stageSize.width,
  height: stageSize.height,
  overflow: 'hidden',
  background: '#20232f',
};
