/*
    cube3d-react
    packages/react-example/src/demos/sceneFactory.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import {
  attach,
  boxPrimitive,
  defineModel,
  extrudePrimitive,
  modelNode,
  part,
  planePrimitive,
  primitiveNode,
  resolveModel,
  spritePrimitive,
  type AnchorMap,
  type FaceMaterials,
  type MaterialSolid,
  type PartialTransform3D,
  type Primitive,
  type SceneNode,
  type Size2,
  type Size3,
} from '@cube3d/core';
import type { DemoSpec, DesignAnchorMap, DesignModelNode, DesignNode, DesignPrimitiveNode, DesignTransform, Rgba, Vec2Tuple, Vec3Tuple } from './spec';

export function createSceneFromSpec(spec: DemoSpec): SceneNode {
  return createNode(spec.root);
}

export function flattenDesignNodes(node: DesignNode, parentPath?: string): Array<{ path: string; node: DesignNode }> {
  const path = parentPath ? `${parentPath}/${node.id}` : node.id;
  const own = [{ path, node }];
  if (node.kind !== 'model') return own;
  return own.concat(node.children.flatMap((child) => flattenDesignNodes(child, path)));
}

export function findDesignNodeById(root: DesignNode, id: string): DesignNode | undefined {
  if (root.id === id) return root;
  if (root.kind !== 'model') return undefined;
  for (const child of root.children) {
    const match = findDesignNodeById(child, id);
    if (match) return match;
  }
  return undefined;
}

function createNode(node: DesignNode): SceneNode {
  if (node.kind === 'model') return createModelNode(node);
  return primitiveNode({
    id: node.id,
    primitive: createPrimitive(node),
    transform: transform(node.transform),
    anchors: anchors(node.anchors),
  });
}

function createModelNode(node: DesignModelNode): SceneNode {
  const children = node.children.map(createNode);
  if (!node.attachments || node.attachments.length === 0) {
    return modelNode({
      id: node.id,
      modelName: node.modelName ?? node.id,
      transform: transform(node.transform),
      anchors: anchors(node.anchors),
      children,
    });
  }

  const model = defineModel(
    node.modelName ?? node.id,
    children.map((child) => part(child.id, child, { transform: child.transform, anchors: child.anchors })),
    {
      transform: transform(node.transform),
      anchors: anchors(node.anchors),
      attachments: node.attachments.map((item) => attach(item.childId, item.childAnchor, item.parentId, item.parentAnchor)),
    },
  );
  return resolveModel(model, node.id);
}

function createPrimitive(node: DesignPrimitiveNode): Primitive {
  const material = solid(node.color);
  if (node.kind === 'box') {
    return boxPrimitive({
      size: size3(node.size),
      material,
      materials: faceMaterials(node.faceColors),
      contrast: 9,
    });
  }
  if (node.kind === 'plane') {
    return planePrimitive({ size: size2(node.size), material });
  }
  if (node.kind === 'sprite') {
    return spritePrimitive({ size: size2(node.size), material });
  }
  return extrudePrimitive({
    size: size2(node.size),
    depth: node.depth ?? 16,
    layers: node.layers ?? 6,
    material,
  });
}

function transform(source?: DesignTransform): PartialTransform3D {
  return {
    position: source?.position ? { x: source.position[0], y: source.position[1], z: source.position[2] } : undefined,
    rotation: source?.rotation ? { x: source.rotation[0], y: source.rotation[1], z: source.rotation[2] } : undefined,
    scale: source?.scale ? { x: source.scale[0], y: source.scale[1], z: source.scale[2] } : undefined,
  };
}

function anchors(source?: DesignAnchorMap): AnchorMap | undefined {
  if (!source) return undefined;
  return Object.fromEntries(
    Object.entries(source).map(([id, position]) => [
      id,
      { id, position: { x: position[0], y: position[1], z: position[2] } },
    ]),
  );
}

function size2(size: Vec2Tuple | Vec3Tuple): Size2 {
  return { x: size[0], y: size[1] };
}

function size3(size: Vec2Tuple | Vec3Tuple): Size3 {
  return { x: size[0], y: size[1], z: size[2] ?? 0 };
}

function solid(color?: Rgba): MaterialSolid | undefined {
  return color ? { kind: 'solid', rgba: color } : undefined;
}

function faceMaterials(colors?: Partial<Record<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom', Rgba>>): FaceMaterials | undefined {
  if (!colors) return undefined;
  return Object.fromEntries(
    Object.entries(colors).map(([direction, color]) => [direction, solid(color)]),
  ) as FaceMaterials;
}
