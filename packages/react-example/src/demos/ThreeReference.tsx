/*
    cube3d-react
    packages/react-example/src/demos/ThreeReference.tsx    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getPrimitiveBounds, getPrimitiveFaces, type FaceDescriptor, type Material, type Primitive, type SceneNode } from '@cube3d/core';
import { createSceneFromSpec, flattenDesignNodes } from './sceneFactory';
import { stageSize, type DemoSpec } from './registry';
import type { DesignNode, DesignPrimitiveNode, WebGLReferenceShape } from './spec';

type TextGeometryCtor = new (text: string, parameters: Record<string, unknown>) => THREE.BufferGeometry;
type TextReferenceRuntime = {
  TextGeometry: TextGeometryCtor;
  font: unknown;
};

let textReferenceRuntimePromise: Promise<TextReferenceRuntime> | undefined;

export function ThreeReference({ spec }: { spec: DemoSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;

    async function renderReference() {
      const textRuntime = hasLayeredText(spec.root) ? await loadTextReferenceRuntime() : undefined;
      if (disposed) return;

      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(stageSize.width, stageSize.height);
      renderer.setClearColor(0x20232f, 1);
      renderer.domElement.dataset.designSpec = spec.id;
      host.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, stageSize.width, 0, stageSize.height, -2000, 2000);
      camera.position.set(0, 0, 1000);
      camera.lookAt(0, 0, 0);

      const root = createSceneFromSpec(spec);
      const designNodes = new Map(flattenDesignNodes(spec.root).map(({ path, node }) => [path, node]));
      const rootPivot = new THREE.Group();
      rootPivot.matrixAutoUpdate = false;
      rootPivot.matrix.copy(cssMatrix(
        { position: { x: 178, y: 86, z: 0 }, rotation: { x: 58, y: 0, z: -34 }, scale: { x: 1, y: 1, z: 1 } },
        { x: 150, y: 115, z: 0 },
      ));
      scene.add(rootPivot);

      addSceneNode(rootPivot, root, designNodes, textRuntime);

      renderer.render(scene, camera);
      rootPivot.updateMatrixWorld(true);
      host.dataset.referenceBounds = JSON.stringify(collectReferenceBounds(rootPivot, camera, renderer.domElement));
      host.dataset.referenceTextModes = JSON.stringify(collectReferenceTextModes(rootPivot));
    }

    void renderReference();

    return () => {
      disposed = true;
      renderer?.dispose();
    };
  }, [spec]);

  return <div ref={hostRef} data-reference-canvas data-design-spec={spec.id} style={panelStyle} />;
}

function addSceneNode(parent: THREE.Object3D, node: SceneNode, designNodes: Map<string, DesignNode>, textRuntime?: TextReferenceRuntime, parentPath?: string) {
  const path = parentPath ? `${parentPath}/${node.id}` : node.id;
  const designNode = designNodes.get(path);
  const group = new THREE.Group();
  group.name = node.id;
  group.userData.cube3dPath = path;
  group.userData.cube3dPrimitive = node.primitive;
  group.userData.cube3dReferenceShape = designNode?.kind === 'model' ? designNode.referenceShape : undefined;
  group.matrixAutoUpdate = false;
  group.matrix.copy(cssMatrix(node.transform, primitiveOrigin(node)));
  parent.add(group);

  if (designNode?.kind === 'model' && designNode.referenceShape) {
    addReferenceShape(group, designNode.referenceShape);
    return;
  }

  if (node.primitive) {
    addPrimitive(group, node.primitive, designNode?.kind === 'model' ? undefined : designNode, textRuntime);
  }

  for (const child of node.children ?? []) {
    addSceneNode(group, child, designNodes, textRuntime, path);
  }

  addAnchorMarkers(group, node);
}

function collectReferenceBounds(root: THREE.Object3D, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const bounds: Record<string, { x: number; y: number; width: number; height: number; area: number; centerX: number; centerY: number }> = {};
  root.traverse((object) => {
    const path = object.userData.cube3dPath as string | undefined;
    const primitive = object.userData.cube3dPrimitive as Primitive | undefined;
    const referenceShape = object.userData.cube3dReferenceShape as WebGLReferenceShape | undefined;
    if (!path) return;

    const projected = referenceShape
      ? projectReferenceShapeBounds(object, referenceShape, camera, canvas)
      : primitive
        ? projectPrimitiveBounds(object, primitive, camera, canvas)
        : projectObjectBounds(object, camera, canvas);
    if (!projected) return;
    bounds[path] = projected;
  });
  return bounds;
}

function projectObjectBounds(object: THREE.Object3D, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return undefined;
  return projectWorldCorners([
    [box.min.x, box.min.y, box.min.z],
    [box.max.x, box.min.y, box.min.z],
    [box.min.x, box.max.y, box.min.z],
    [box.max.x, box.max.y, box.min.z],
    [box.min.x, box.min.y, box.max.z],
    [box.max.x, box.min.y, box.max.z],
    [box.min.x, box.max.y, box.max.z],
    [box.max.x, box.max.y, box.max.z],
  ], camera, canvas);
}

function projectReferenceShapeBounds(object: THREE.Object3D, shape: WebGLReferenceShape, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  if (shape.kind === 'cylinder') {
    const radius = shape.radius;
    const halfHeight = shape.height / 2;
    const [cx, cy, cz] = shape.position;
    return projectCorners([
      [cx - radius, cy - halfHeight, cz - radius],
      [cx + radius, cy - halfHeight, cz - radius],
      [cx - radius, cy + halfHeight, cz - radius],
      [cx + radius, cy + halfHeight, cz - radius],
      [cx - radius, cy - halfHeight, cz + radius],
      [cx + radius, cy - halfHeight, cz + radius],
      [cx - radius, cy + halfHeight, cz + radius],
      [cx + radius, cy + halfHeight, cz + radius],
    ], object, camera, canvas);
  }
  return undefined;
}

function projectPrimitiveBounds(object: THREE.Object3D, primitive: Primitive, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const bounds = getPrimitiveBounds(primitive);
  return projectCorners([
    [bounds.min.x, bounds.min.y, bounds.min.z],
    [bounds.max.x, bounds.min.y, bounds.min.z],
    [bounds.min.x, bounds.max.y, bounds.min.z],
    [bounds.max.x, bounds.max.y, bounds.min.z],
    [bounds.min.x, bounds.min.y, bounds.max.z],
    [bounds.max.x, bounds.min.y, bounds.max.z],
    [bounds.min.x, bounds.max.y, bounds.max.z],
    [bounds.max.x, bounds.max.y, bounds.max.z],
  ], object, camera, canvas);
}

function projectCorners(corners3D: number[][], object: THREE.Object3D, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const corners = corners3D.map(([x, y, z]) => {
    const point = new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld).project(camera);
    return {
      x: ((point.x + 1) / 2) * canvas.width,
      y: ((-point.y + 1) / 2) * canvas.height,
    };
  });
  const minX = Math.min(...corners.map((point) => point.x));
  const maxX = Math.max(...corners.map((point) => point.x));
  const minY = Math.min(...corners.map((point) => point.y));
  const maxY = Math.max(...corners.map((point) => point.y));
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  return {
    x: minX,
    y: minY,
    width,
    height,
    area: width * height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

function projectWorldCorners(corners3D: number[][], camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const corners = corners3D.map(([x, y, z]) => {
    const point = new THREE.Vector3(x, y, z).project(camera);
    return {
      x: ((point.x + 1) / 2) * canvas.width,
      y: ((-point.y + 1) / 2) * canvas.height,
    };
  });
  const minX = Math.min(...corners.map((point) => point.x));
  const maxX = Math.max(...corners.map((point) => point.x));
  const minY = Math.min(...corners.map((point) => point.y));
  const maxY = Math.max(...corners.map((point) => point.y));
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  return {
    x: minX,
    y: minY,
    width,
    height,
    area: width * height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

function addPrimitive(group: THREE.Group, primitive: Primitive, designNode?: DesignPrimitiveNode, textRuntime?: TextReferenceRuntime) {
  if (primitive.kind === 'box') {
    const geometry = new THREE.BoxGeometry(primitive.size.x, primitive.size.y, primitive.size.z);
    const material = materialFor(primitive.material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(primitive.size.x / 2, primitive.size.y / 2, primitive.size.z / 2);
    group.add(mesh);
    addEdges(mesh, geometry);
    return;
  }

  if (primitive.kind === 'extrude') {
    if (designNode?.renderMode === 'layered-text') {
      addLayeredTextReference(group, primitive, designNode, textRuntime);
      return;
    }

    const faces = getPrimitiveFaces(primitive);
    for (const face of faces) {
      addPlaneFace(group, primitive, face, designNode);
    }
    return;
  }

  addPlaneFace(group, primitive, getPrimitiveFaces(primitive)[0], designNode);
}

function addLayeredTextReference(group: THREE.Group, primitive: Primitive, designNode: DesignPrimitiveNode, textRuntime?: TextReferenceRuntime) {
  if (primitive.kind !== 'extrude' || !textRuntime) return;

  group.userData.cube3dReferenceText = true;
  const label = designNode.label ?? designNode.id;
  const geometry = new textRuntime.TextGeometry(label, {
    font: textRuntime.font,
    size: primitive.size.y * 0.82,
    depth: primitive.depth,
    curveSegments: 4,
    bevelEnabled: false,
  });
  fitGeometryToPrimitiveFace(geometry, primitive.size.x, primitive.size.y);

  const mesh = new THREE.Mesh(geometry, [
    materialFor({ kind: 'solid', rgba: [240, 122, 162, 1] }),
    materialFor({ kind: 'solid', rgba: [185, 87, 123, 1] }),
  ]);
  mesh.userData.primitiveKind = primitive.kind;
  mesh.userData.cube3dReferenceText = true;
  group.add(mesh);
  addEdges(mesh, geometry);
}

function fitGeometryToPrimitiveFace(geometry: THREE.BufferGeometry, maxWidth: number, maxHeight: number) {
  geometry.computeBoundingBox();
  const initialBounds = geometry.boundingBox;
  if (!initialBounds) return;

  const initialWidth = Math.max(1, initialBounds.max.x - initialBounds.min.x);
  const initialHeight = Math.max(1, initialBounds.max.y - initialBounds.min.y);
  const fitScale = Math.min(1, maxWidth / initialWidth, maxHeight / initialHeight);
  geometry.scale(fitScale, fitScale, 1);

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  geometry.translate((maxWidth - width) / 2 - bounds.min.x, (maxHeight - height) / 2 - bounds.min.y, 0);
}

function collectReferenceTextModes(root: THREE.Object3D) {
  const paths: string[] = [];
  root.traverse((object) => {
    const path = object.userData.cube3dPath as string | undefined;
    if (path && object.userData.cube3dReferenceText === true) {
      paths.push(path);
    }
  });
  return paths.sort();
}

function hasLayeredText(node: DesignNode): boolean {
  if (node.kind === 'extrude' && node.renderMode === 'layered-text') return true;
  if (node.kind === 'model') {
    return node.children.some((child) => hasLayeredText(child));
  }
  return false;
}

function loadTextReferenceRuntime() {
  textReferenceRuntimePromise ??= Promise.all([
    import('three/examples/jsm/geometries/TextGeometry.js'),
    import('three/examples/jsm/loaders/FontLoader.js'),
    import('../assets/fonts/helvetiker_bold.typeface.json'),
  ]).then(([geometryModule, loaderModule, fontModule]) => {
    const FontLoaderCtor = loaderModule.FontLoader as new () => { parse: (json: unknown) => unknown };
    return {
      TextGeometry: geometryModule.TextGeometry as TextGeometryCtor,
      font: new FontLoaderCtor().parse(fontModule.default),
    };
  });
  return textReferenceRuntimePromise;
}

function addReferenceShape(group: THREE.Group, shape: WebGLReferenceShape) {
  if (shape.kind === 'cylinder') {
    const geometry = new THREE.CylinderGeometry(shape.radius, shape.radius, shape.height, shape.segments ?? 48);
    const mesh = new THREE.Mesh(geometry, materialFor({ kind: 'solid', rgba: shape.color }));
    mesh.position.set(shape.position[0], shape.position[1], shape.position[2]);
    group.add(mesh);
    addEdges(mesh, geometry);
  }
}

function addPlaneFace(group: THREE.Group, primitive: Primitive, face: FaceDescriptor, designNode?: DesignPrimitiveNode) {
  const geometry = designNode?.shape === 'circle'
    ? new THREE.CircleGeometry(face.size.x / 2, 48)
    : new THREE.PlaneGeometry(face.size.x, face.size.y);
  const material = materialFor(face.material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(face.transform.position.x, face.transform.position.y, face.transform.position.z);
  mesh.rotation.set(degrees(face.transform.rotation.x), degrees(face.transform.rotation.y), degrees(face.transform.rotation.z));
  mesh.userData.primitiveKind = primitive.kind;
  group.add(mesh);
}

function cssMatrix(transform: SceneNode['transform'], origin: { x: number; y: number; z: number }) {
  const matrix = new THREE.Matrix4();
  const pivot = transform.pivot ?? origin;
  const toOrigin = new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
  const fromOrigin = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  const translate = new THREE.Matrix4().makeTranslation(transform.position.x, transform.position.y, transform.position.z);
  const rotateX = new THREE.Matrix4().makeRotationX(degrees(transform.rotation.x));
  const rotateY = new THREE.Matrix4().makeRotationY(degrees(transform.rotation.y));
  const rotateZ = new THREE.Matrix4().makeRotationZ(degrees(transform.rotation.z));
  const scale = new THREE.Matrix4().makeScale(transform.scale.x, transform.scale.y, transform.scale.z);
  return matrix.multiply(toOrigin).multiply(translate).multiply(rotateX).multiply(rotateY).multiply(rotateZ).multiply(scale).multiply(fromOrigin);
}

function primitiveOrigin(node: SceneNode) {
  if (!node.primitive) return { x: 0, y: 0, z: 0 };
  if (node.primitive.kind === 'box') {
    return { x: node.primitive.size.x / 2, y: node.primitive.size.y / 2, z: 0 };
  }
  return { x: node.primitive.size.x / 2, y: node.primitive.size.y / 2, z: 0 };
}

function addEdges(mesh: THREE.Mesh, geometry: THREE.BufferGeometry) {
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
  mesh.add(lines);
}

function addAnchorMarkers(group: THREE.Group, node: SceneNode) {
  const anchors = Object.values(node.anchors ?? {});
  if (anchors.length === 0) return;

  const material = new THREE.MeshBasicMaterial({ color: 0x6af08b });
  for (const anchor of anchors) {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), material);
    marker.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
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
