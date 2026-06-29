/*
    cube3d-react
    packages/react-example/src/demos/ThreeReference.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getPrimitiveFaces, type FaceDescriptor, type Material, type Primitive, type SceneNode } from '@cube3d/core';
import { createSceneFromSpec } from './sceneFactory';
import { stageSize, type DemoSpec } from './registry';

export function ThreeReference({ spec }: { spec: DemoSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setClearColor(0x20232f, 1);
    renderer.domElement.dataset.designSpec = spec.id;
    host.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-210, 210, 145, -145, 1, 1000);
    camera.position.set(260, 230, 340);
    camera.lookAt(0, 0, 0);

    addGrid(scene);

    const root = createSceneFromSpec(spec);
    const rootGroup = new THREE.Group();
    rootGroup.position.set(-150, 0, -100);
    scene.add(rootGroup);
    addSceneNode(rootGroup, root);

    renderer.render(scene, camera);
    return () => renderer.dispose();
  }, [spec]);

  return <div ref={hostRef} data-reference-canvas data-design-spec={spec.id} style={panelStyle} />;
}

function addSceneNode(parent: THREE.Object3D, node: SceneNode) {
  const group = new THREE.Group();
  group.name = node.id;
  group.position.set(node.transform.position.x, node.transform.position.z, node.transform.position.y);
  group.rotation.set(degrees(node.transform.rotation.x), degrees(node.transform.rotation.z), degrees(node.transform.rotation.y));
  group.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z);
  parent.add(group);

  if (node.primitive) {
    addPrimitive(group, node.primitive);
  }

  for (const child of node.children ?? []) {
    addSceneNode(group, child);
  }

  addAnchorMarkers(group, node);
}

function addPrimitive(group: THREE.Group, primitive: Primitive) {
  if (primitive.kind === 'box') {
    const geometry = new THREE.BoxGeometry(primitive.size.x, primitive.size.z, primitive.size.y);
    const material = materialFor(primitive.material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(primitive.size.x / 2, primitive.size.z / 2, primitive.size.y / 2);
    group.add(mesh);
    addEdges(mesh, geometry);
    return;
  }

  if (primitive.kind === 'extrude') {
    const faces = getPrimitiveFaces(primitive);
    for (const face of faces) {
      addPlaneFace(group, primitive, face);
    }
    return;
  }

  addPlaneFace(group, primitive, getPrimitiveFaces(primitive)[0]);
}

function addPlaneFace(group: THREE.Group, primitive: Primitive, face: FaceDescriptor) {
  const geometry = new THREE.PlaneGeometry(face.size.x, face.size.y);
  const material = materialFor(face.material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(face.size.x / 2 + face.transform.position.x, face.transform.position.z, face.size.y / 2 + face.transform.position.y);
  mesh.rotation.set(-Math.PI / 2 + degrees(face.transform.rotation.x), degrees(face.transform.rotation.z), degrees(face.transform.rotation.y));
  if (primitive.kind === 'extrude') {
    mesh.position.set(face.size.x / 2, face.transform.position.z, face.size.y / 2);
  }
  group.add(mesh);
}

function addEdges(mesh: THREE.Mesh, geometry: THREE.BufferGeometry) {
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
  mesh.add(lines);
}

function addGrid(scene: THREE.Scene) {
  const grid = new THREE.GridHelper(280, 14, 0x5360b8, 0x33394f);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -2;
  scene.add(grid);
}

function addAnchorMarkers(group: THREE.Group, node: SceneNode) {
  const anchors = Object.values(node.anchors ?? {});
  if (anchors.length === 0) return;

  const material = new THREE.MeshBasicMaterial({ color: 0x6af08b });
  for (const anchor of anchors) {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), material);
    marker.position.set(anchor.position.x, anchor.position.z, anchor.position.y);
    group.add(marker);
  }
}

function materialFor(material?: Material) {
  const color = material?.kind === 'solid' ? material.rgba : [255, 255, 255, 1];
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
    transparent: color[3] < 1,
    opacity: color[3],
    side: THREE.DoubleSide,
  });
}

function degrees(value: number) {
  return (value * Math.PI) / 180;
}

const panelStyle: React.CSSProperties = {
  width: stageSize.width,
  height: stageSize.height,
  overflow: 'hidden',
  background: '#20232f',
};
