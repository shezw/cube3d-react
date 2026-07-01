/*
    Cube3D React
    packages/react-example/src/demos/sceneFactory.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import {
  attach,
  attachWithOrientation,
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
} from '@shezw/cube3d/core';
import type { DemoSpec, DesignAnchor, DesignAnchorMap, DesignModelNode, DesignNode, DesignPrimitiveNode, DesignTransform, Rgba, Vec2Tuple, Vec3Tuple } from './spec';
import { resolveLayeredTextDepth, resolveLayeredTextLayers } from './layeredText';

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
      attachments: node.attachments.map((item) => (
        item.mode === 'position-orientation'
          ? attachWithOrientation(item.childId, item.childAnchor, item.parentId, item.parentAnchor)
          : attach(item.childId, item.childAnchor, item.parentId, item.parentAnchor)
      )),
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
    depth: resolveLayeredTextDepth(node),
    layers: resolveLayeredTextLayers(node),
    material,
  });
}

function transform(source?: DesignTransform): PartialTransform3D {
  return {
    position: source?.position ? { x: source.position[0], y: source.position[1], z: source.position[2] } : undefined,
    rotation: source?.rotation ? { x: source.rotation[0], y: source.rotation[1], z: source.rotation[2] } : undefined,
    scale: source?.scale ? { x: source.scale[0], y: source.scale[1], z: source.scale[2] } : undefined,
    pivot: source?.pivot ? { x: source.pivot[0], y: source.pivot[1], z: source.pivot[2] } : undefined,
  };
}

function anchors(source?: DesignAnchorMap): AnchorMap | undefined {
  if (!source) return undefined;
  return Object.fromEntries(
    Object.entries(source).map(([id, value]) => [
      id,
      anchor(id, value),
    ]),
  );
}

function anchor(id: string, value: DesignAnchor) {
  if (Array.isArray(value)) return { id, position: { x: value[0], y: value[1], z: value[2] } };
  return {
    id,
    position: { x: value.position[0], y: value.position[1], z: value.position[2] },
    rotation: value.rotation ? { x: value.rotation[0], y: value.rotation[1], z: value.rotation[2] } : undefined,
    normal: value.normal ? { x: value.normal[0], y: value.normal[1], z: value.normal[2] } : undefined,
    tangent: value.tangent ? { x: value.tangent[0], y: value.tangent[1], z: value.tangent[2] } : undefined,
  };
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
