export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Size2 = {
  x: number;
  y: number;
};

export type Size3 = {
  x: number;
  y: number;
  z: number;
};

export type Euler = Vec3;
export type Quat = { x: number; y: number; z: number; w: number };
export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export type Transform3D = {
  position: Vec3;
  rotation: Euler;
  scale: Vec3;
  pivot?: Vec3;
};

export type PartialTransform3D = Partial<{
  position: Partial<Vec3>;
  rotation: Partial<Euler>;
  scale: Partial<Vec3>;
  pivot: Partial<Vec3>;
}>;

export type KeyframeTransform = Partial<{
  translateX: number | string;
  translateY: number | string;
  translateZ: number | string;
  rotateX: number | string;
  rotateY: number | string;
  rotateZ: number | string;
  scaleX: number | string;
  scaleY: number | string;
  scaleZ: number | string;
}>;

export type Keyframes = Record<number, { transform?: KeyframeTransform } & Record<string, unknown>>;

export type Easing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | { cubicBezier: [number, number, number, number] };

export type AnimationOptions = {
  duration?: number;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  easing?: Easing;
};

export type TimelineDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

export type TimelineKeyframe = {
  at: number;
  transform: PartialTransform3D;
  easing?: Easing;
};

export type TimelineTrack = {
  targetPath: string;
  keyframes: TimelineKeyframe[];
  easing?: Easing;
};

export type TimelineClip = {
  id: string;
  duration: number;
  tracks: TimelineTrack[];
  delay?: number;
  loop?: boolean;
  direction?: TimelineDirection;
  easing?: Easing;
};

export type TimelinePlaybackState = {
  time: number;
  localTime: number;
  duration: number;
  progress: number;
  iteration: number;
  direction: 'normal' | 'reverse';
  done: boolean;
};

export type TimelineEvaluation = {
  state: TimelinePlaybackState;
  transforms: Record<string, PartialTransform3D>;
};

export type MaterialSolid = {
  kind: 'solid';
  rgba: [number, number, number, number];
};

export type MaterialImage = {
  kind: 'image';
  src: string;
};

export type Material = MaterialSolid | MaterialImage;

export type FaceDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
export type FaceMaterials = Partial<Record<FaceDirection, Material>>;

export type Bounds3 = {
  min: Vec3;
  max: Vec3;
};

export type ViewState = {
  position: Vec3;
  rotation: Euler;
  zoom: number;
  origin?: Vec3;
};

export type ProjectedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type FitViewOptions = {
  viewport: Size2;
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  rotation?: Partial<Euler>;
  origin?: Partial<Vec3>;
};

export type Anchor = {
  id: string;
  position: Vec3;
  rotation?: Partial<Euler>;
  normal?: Vec3;
  tangent?: Vec3;
};

export type AnchorMap = Record<string, Anchor>;

export type FaceDescriptor = {
  direction: FaceDirection;
  size: Size2;
  transform: Transform3D;
  material?: Material;
  shade: number;
};

export type BoxPrimitive = {
  kind: 'box';
  size: Size3;
  material?: MaterialSolid;
  materials?: FaceMaterials;
  contrast?: number;
};

export type PlanePrimitive = {
  kind: 'plane';
  size: Size2;
  material?: Material;
};

export type SpritePrimitive = {
  kind: 'sprite';
  size: Size2;
  material?: Material;
};

export type ExtrudePrimitive = {
  kind: 'extrude';
  size: Size2;
  depth: number;
  layers: number;
  material?: Material;
};

export type Primitive = BoxPrimitive | PlanePrimitive | SpritePrimitive | ExtrudePrimitive;

export type SceneNodeKind = 'group' | 'primitive' | 'model';

export type SceneNode = {
  id: string;
  kind: SceneNodeKind;
  transform: Transform3D;
  anchors?: AnchorMap;
  primitive?: Primitive;
  modelName?: string;
  children?: SceneNode[];
};

export type PrimitiveNode = SceneNode & { kind: 'primitive'; primitive: Primitive };
export type GroupNode = SceneNode & { kind: 'group'; children: SceneNode[] };
export type ModelNode = SceneNode & { kind: 'model'; modelName: string; children: SceneNode[] };

export type WorldNode = {
  node: SceneNode;
  path: string;
  worldMatrix: Mat4;
  worldBounds?: Bounds3;
  worldAnchors: AnchorMap;
  children: WorldNode[];
};

export type ModelPart = {
  id: string;
  node: SceneNode;
  anchors?: AnchorMap;
};

export type ModelAttachment = {
  childId: string;
  childAnchor: string;
  parentId: string;
  parentAnchor: string;
  mode?: 'position' | 'position-orientation';
};

export type ModelDefinition = {
  name: string;
  parts: ModelPart[];
  attachments?: ModelAttachment[];
  transform?: PartialTransform3D;
  anchors?: AnchorMap;
};

export type ValidationIssue = {
  path: string;
  code: 'invalid-size' | 'invalid-transform' | 'empty-id' | 'missing-anchor' | 'duplicate-id' | 'empty-model' | 'missing-part';
  message: string;
};

export const FACE_DIRECTIONS: FaceDirection[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
export const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };
export const UNIT_VEC3: Vec3 = { x: 1, y: 1, z: 1 };
export const IDENTITY_TRANSFORM: Transform3D = {
  position: ZERO_VEC3,
  rotation: ZERO_VEC3,
  scale: UNIT_VEC3,
};
export const DEFAULT_VIEW_STATE: ViewState = {
  position: ZERO_VEC3,
  rotation: ZERO_VEC3,
  zoom: 1,
};

export function vec3(value?: Partial<Vec3>, fallback: Vec3 = ZERO_VEC3): Vec3 {
  return {
    x: value?.x ?? fallback.x,
    y: value?.y ?? fallback.y,
    z: value?.z ?? fallback.z,
  };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scaleVec3(value: Vec3, scale: Vec3): Vec3 {
  return { x: value.x * scale.x, y: value.y * scale.y, z: value.z * scale.z };
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

export function normalizeTransform(transform?: PartialTransform3D): Transform3D {
  return {
    position: vec3(transform?.position),
    rotation: vec3(transform?.rotation),
    scale: vec3(transform?.scale, UNIT_VEC3),
    pivot: transform?.pivot ? vec3(transform.pivot) : undefined,
  };
}

export function identityMat4(): Mat4 {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

export function multiplyMat4(a: Mat4, b: Mat4): Mat4 {
  const out = Array(16).fill(0) as Mat4;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[row * 4 + col] =
        a[row * 4 + 0] * b[0 * 4 + col] +
        a[row * 4 + 1] * b[1 * 4 + col] +
        a[row * 4 + 2] * b[2 * 4 + col] +
        a[row * 4 + 3] * b[3 * 4 + col];
    }
  }
  return out;
}

export function transformToMat4(transform?: PartialTransform3D): Mat4 {
  const { position, rotation, scale } = normalizeTransform(transform);
  const pivot = transform?.pivot ? vec3(transform.pivot) : ZERO_VEC3;
  const rx = degToRad(rotation.x);
  const ry = degToRad(rotation.y);
  const rz = degToRad(rotation.z);
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);

  const t: Mat4 = [
    1, 0, 0, position.x,
    0, 1, 0, position.y,
    0, 0, 1, position.z,
    0, 0, 0, 1,
  ];
  const sxm: Mat4 = [
    scale.x, 0, 0, 0,
    0, scale.y, 0, 0,
    0, 0, scale.z, 0,
    0, 0, 0, 1,
  ];
  const rxm: Mat4 = [
    1, 0, 0, 0,
    0, cx, -sx, 0,
    0, sx, cx, 0,
    0, 0, 0, 1,
  ];
  const rym: Mat4 = [
    cy, 0, sy, 0,
    0, 1, 0, 0,
    -sy, 0, cy, 0,
    0, 0, 0, 1,
  ];
  const rzm: Mat4 = [
    cz, -sz, 0, 0,
    sz, cz, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
  const toPivot: Mat4 = [
    1, 0, 0, pivot.x,
    0, 1, 0, pivot.y,
    0, 0, 1, pivot.z,
    0, 0, 0, 1,
  ];
  const fromPivot: Mat4 = [
    1, 0, 0, -pivot.x,
    0, 1, 0, -pivot.y,
    0, 0, 1, -pivot.z,
    0, 0, 0, 1,
  ];

  return multiplyMat4(t, multiplyMat4(toPivot, multiplyMat4(rzm, multiplyMat4(rym, multiplyMat4(rxm, multiplyMat4(sxm, fromPivot))))));
}

export function transformPoint(matrix: Mat4, point: Vec3): Vec3 {
  return {
    x: matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z + matrix[3],
    y: matrix[4] * point.x + matrix[5] * point.y + matrix[6] * point.z + matrix[7],
    z: matrix[8] * point.x + matrix[9] * point.y + matrix[10] * point.z + matrix[11],
  };
}

export function transformDirection(matrix: Mat4, direction: Vec3): Vec3 {
  return normalizeVec3({
    x: matrix[0] * direction.x + matrix[1] * direction.y + matrix[2] * direction.z,
    y: matrix[4] * direction.x + matrix[5] * direction.y + matrix[6] * direction.z,
    z: matrix[8] * direction.x + matrix[9] * direction.y + matrix[10] * direction.z,
  });
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function lengthVec3(value: Vec3): number {
  return Math.hypot(value.x, value.y, value.z);
}

export function normalizeVec3(value: Vec3): Vec3 {
  const length = lengthVec3(value);
  if (length === 0) return { ...ZERO_VEC3 };
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

export function angleBetweenVec3(a: Vec3, b: Vec3): number {
  const dot = dotVec3(normalizeVec3(a), normalizeVec3(b));
  return radToDeg(Math.acos(Math.max(-1, Math.min(1, dot))));
}

export function createBounds(min: Vec3, max: Vec3): Bounds3 {
  return { min, max };
}

export function unionBounds(a?: Bounds3, b?: Bounds3): Bounds3 | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}

export function transformBounds(bounds: Bounds3, matrix: Mat4): Bounds3 {
  const corners = [
    { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
    { x: bounds.max.x, y: bounds.min.y, z: bounds.min.z },
    { x: bounds.min.x, y: bounds.max.y, z: bounds.min.z },
    { x: bounds.max.x, y: bounds.max.y, z: bounds.min.z },
    { x: bounds.min.x, y: bounds.min.y, z: bounds.max.z },
    { x: bounds.max.x, y: bounds.min.y, z: bounds.max.z },
    { x: bounds.min.x, y: bounds.max.y, z: bounds.max.z },
    { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
  ].map((point) => transformPoint(matrix, point));

  return corners.reduce(
    (acc, point) => ({
      min: {
        x: Math.min(acc.min.x, point.x),
        y: Math.min(acc.min.y, point.y),
        z: Math.min(acc.min.z, point.z),
      },
      max: {
        x: Math.max(acc.max.x, point.x),
        y: Math.max(acc.max.y, point.y),
        z: Math.max(acc.max.z, point.z),
      },
    }),
    createBounds({ x: Infinity, y: Infinity, z: Infinity }, { x: -Infinity, y: -Infinity, z: -Infinity }),
  );
}

export function materialToCss(material?: Material): string | undefined {
  if (!material) return undefined;
  if (material.kind === 'image') return `url("${material.src}") center / cover no-repeat`;
  const [r, g, b, a] = material.rgba;
  return `rgba(${clampColor(r)}, ${clampColor(g)}, ${clampColor(b)}, ${a})`;
}

export function shadeMaterial(material?: MaterialSolid, shade = 0): MaterialSolid | undefined {
  if (!material) return undefined;
  const [r, g, b, a] = material.rgba;
  return {
    kind: 'solid',
    rgba: [clampColor(r - shade), clampColor(g - shade), clampColor(b - shade), a],
  };
}

export function boxPrimitive(init: Omit<BoxPrimitive, 'kind'>): BoxPrimitive {
  return { kind: 'box', ...init };
}

export function planePrimitive(init: Omit<PlanePrimitive, 'kind'>): PlanePrimitive {
  return { kind: 'plane', ...init };
}

export function spritePrimitive(init: Omit<SpritePrimitive, 'kind'>): SpritePrimitive {
  return { kind: 'sprite', ...init };
}

export function extrudePrimitive(init: Omit<ExtrudePrimitive, 'kind'>): ExtrudePrimitive {
  return { kind: 'extrude', ...init };
}

export function groupNode(init: { id: string; transform?: PartialTransform3D; anchors?: AnchorMap; children?: SceneNode[] }): GroupNode {
  return {
    id: init.id,
    kind: 'group',
    transform: normalizeTransform(init.transform),
    anchors: init.anchors,
    children: init.children ?? [],
  };
}

export function primitiveNode(init: { id: string; primitive: Primitive; transform?: PartialTransform3D; anchors?: AnchorMap }): PrimitiveNode {
  return {
    id: init.id,
    kind: 'primitive',
    transform: normalizeTransform(init.transform),
    anchors: init.anchors,
    primitive: init.primitive,
  };
}

export function modelNode(init: { id: string; modelName: string; transform?: PartialTransform3D; anchors?: AnchorMap; children?: SceneNode[] }): ModelNode {
  return {
    id: init.id,
    kind: 'model',
    modelName: init.modelName,
    transform: normalizeTransform(init.transform),
    anchors: init.anchors,
    children: init.children ?? [],
  };
}

export function part(id: string, primitiveOrNode: Primitive | SceneNode, options: { transform?: PartialTransform3D; anchors?: AnchorMap } = {}): ModelPart {
  const node = isSceneNode(primitiveOrNode)
    ? { ...primitiveOrNode, id, transform: normalizeTransform(options.transform ?? primitiveOrNode.transform), anchors: options.anchors ?? primitiveOrNode.anchors }
    : primitiveNode({ id, primitive: primitiveOrNode, transform: options.transform, anchors: options.anchors });
  return { id, node, anchors: node.anchors };
}

export function attach(childId: string, childAnchor: string, parentId: string, parentAnchor: string): ModelAttachment {
  return { childId, childAnchor, parentId, parentAnchor };
}

export function attachWithOrientation(childId: string, childAnchor: string, parentId: string, parentAnchor: string): ModelAttachment {
  return { childId, childAnchor, parentId, parentAnchor, mode: 'position-orientation' };
}

export function defineModel(name: string, parts: ModelPart[], options: { attachments?: ModelAttachment[]; transform?: PartialTransform3D; anchors?: AnchorMap } = {}): ModelDefinition {
  return { name, parts, attachments: options.attachments, transform: options.transform, anchors: options.anchors };
}

export function resolveModel(model: ModelDefinition, id = model.name): ModelNode {
  const transforms = new Map<string, Transform3D>();
  for (const modelPart of model.parts) {
    transforms.set(modelPart.id, normalizeTransform(modelPart.node.transform));
  }

  for (let iteration = 0; iteration < model.parts.length; iteration += 1) {
    let changed = false;
    for (const modelAttachment of model.attachments ?? []) {
      const child = model.parts.find((candidate) => candidate.id === modelAttachment.childId);
      const parent = model.parts.find((candidate) => candidate.id === modelAttachment.parentId);
      if (!child || !parent) continue;
      const childTransform = transforms.get(child.id) ?? normalizeTransform(child.node.transform);
      const parentTransform = transforms.get(parent.id) ?? normalizeTransform(parent.node.transform);
      const childAnchor = child.node.anchors?.[modelAttachment.childAnchor];
      const parentAnchor = parent.node.anchors?.[modelAttachment.parentAnchor];
      if (!childAnchor || !parentAnchor) continue;

      const nextRotation = modelAttachment.mode === 'position-orientation'
        ? addVec3(parentTransform.rotation, subVec3(vec3(parentAnchor.rotation), vec3(childAnchor.rotation)))
        : childTransform.rotation;
      const parentAnchorWorld = transformPoint(transformToMat4(parentTransform), parentAnchor.position);
      const childAnchorOffset = transformPoint(transformToMat4({ ...childTransform, position: ZERO_VEC3, rotation: nextRotation }), childAnchor.position);
      const nextPosition = subVec3(parentAnchorWorld, childAnchorOffset);
      if (!sameVec3(nextPosition, childTransform.position) || !sameVec3(nextRotation, childTransform.rotation)) {
        transforms.set(child.id, { ...childTransform, position: nextPosition, rotation: nextRotation });
        changed = true;
      }
    }
    if (!changed) break;
  }

  return modelNode({
    id,
    modelName: model.name,
    transform: model.transform,
    anchors: model.anchors,
    children: model.parts.map((modelPart) => ({
      ...modelPart.node,
      transform: transforms.get(modelPart.id) ?? normalizeTransform(modelPart.node.transform),
    })),
  });
}

export function validateModel(model: ModelDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (model.parts.length === 0) {
    issues.push({ path: model.name, code: 'empty-model', message: `Model "${model.name}" has no parts.` });
  }

  const ids = new Set<string>();
  for (const modelPart of model.parts) {
    if (ids.has(modelPart.id)) {
      issues.push({ path: `${model.name}.${modelPart.id}`, code: 'duplicate-id', message: `Duplicate part id "${modelPart.id}".` });
    }
    ids.add(modelPart.id);
    issues.push(...validateNode(modelPart.node, `${model.name}.${modelPart.id}`));
  }

  for (const modelAttachment of model.attachments ?? []) {
    const child = model.parts.find((candidate) => candidate.id === modelAttachment.childId);
    const parent = model.parts.find((candidate) => candidate.id === modelAttachment.parentId);
    if (!child) {
      issues.push({ path: `${model.name}.${modelAttachment.childId}`, code: 'missing-part', message: `Missing child part "${modelAttachment.childId}".` });
      continue;
    }
    if (!parent) {
      issues.push({ path: `${model.name}.${modelAttachment.parentId}`, code: 'missing-part', message: `Missing parent part "${modelAttachment.parentId}".` });
      continue;
    }
    if (!child.node.anchors?.[modelAttachment.childAnchor]) {
      issues.push({ path: `${model.name}.${child.id}.${modelAttachment.childAnchor}`, code: 'missing-anchor', message: `Missing child anchor "${modelAttachment.childAnchor}".` });
    }
    if (!parent.node.anchors?.[modelAttachment.parentAnchor]) {
      issues.push({ path: `${model.name}.${parent.id}.${modelAttachment.parentAnchor}`, code: 'missing-anchor', message: `Missing parent anchor "${modelAttachment.parentAnchor}".` });
    }
  }

  return issues;
}

export function validateScene(node: SceneNode): ValidationIssue[] {
  return validateNode(node, node.id);
}

export function resolveScene(node: SceneNode, parentMatrix: Mat4 = identityMat4(), parentPath?: string): WorldNode {
  const path = parentPath ? `${parentPath}/${node.id}` : node.id;
  const localMatrix = transformToMat4(node.transform);
  const worldMatrix = multiplyMat4(parentMatrix, localMatrix);
  const children = (node.children ?? []).map((child) => resolveScene(child, worldMatrix, path));
  const localBounds = node.primitive ? getPrimitiveBounds(node.primitive) : undefined;
  const ownBounds = localBounds ? transformBounds(localBounds, worldMatrix) : undefined;
  const childBounds = children.reduce<Bounds3 | undefined>((bounds, child) => unionBounds(bounds, child.worldBounds), undefined);

  const worldAnchors = Object.fromEntries(
    Object.entries(node.anchors ?? {}).map(([id, anchor]) => [id, resolveWorldAnchor(anchor, worldMatrix)]),
  );

  return {
    node,
    path,
    worldMatrix,
    worldBounds: unionBounds(ownBounds, childBounds),
    worldAnchors,
    children,
  };
}

function resolveWorldAnchor(anchor: Anchor, worldMatrix: Mat4): Anchor {
  const anchorMatrix = anchor.rotation ? multiplyMat4(worldMatrix, transformToMat4({ rotation: anchor.rotation })) : worldMatrix;
  return {
    ...anchor,
    position: transformPoint(worldMatrix, anchor.position),
    normal: anchor.normal ? transformDirection(anchorMatrix, anchor.normal) : undefined,
    tangent: anchor.tangent ? transformDirection(anchorMatrix, anchor.tangent) : undefined,
  };
}

export type WorldBoundsReport = {
  path: string;
  nodeId: string;
  kind: SceneNodeKind;
  modelName?: string;
  primitiveKind?: Primitive['kind'];
  bounds?: Bounds3;
  center?: Vec3;
  size?: Vec3;
};

export function flattenWorldNodes(world: WorldNode): WorldNode[] {
  return [world, ...world.children.flatMap(flattenWorldNodes)];
}

export function findWorldNode(world: WorldNode, path: string): WorldNode | undefined {
  return flattenWorldNodes(world).find((candidate) => candidate.path === path);
}

export function getWorldBoundsReport(world: WorldNode): WorldBoundsReport[] {
  return flattenWorldNodes(world).map((item) => ({
    path: item.path,
    nodeId: item.node.id,
    kind: item.node.kind,
    modelName: item.node.modelName,
    primitiveKind: item.node.primitive?.kind,
    bounds: item.worldBounds,
    center: item.worldBounds ? boundsCenter(item.worldBounds) : undefined,
    size: item.worldBounds ? boundsSize(item.worldBounds) : undefined,
  }));
}

export function boundsCenter(bounds: Bounds3): Vec3 {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
}

export function boundsSize(bounds: Bounds3): Vec3 {
  return {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  };
}

export function normalizeViewState(view?: Partial<ViewState>): ViewState {
  return {
    position: vec3(view?.position),
    rotation: vec3(view?.rotation),
    zoom: Number.isFinite(view?.zoom) && view?.zoom != null ? view.zoom : 1,
    origin: view?.origin ? vec3(view.origin) : undefined,
  };
}

export function composeViewTransform(view: ViewState): Transform3D {
  const normalized = normalizeViewState(view);
  return normalizeTransform({
    position: normalized.position,
    rotation: normalized.rotation,
    scale: { x: normalized.zoom, y: normalized.zoom, z: normalized.zoom },
    pivot: normalized.origin,
  });
}

export function interpolateViewState(a: ViewState, b: ViewState, t: number): ViewState {
  const progress = clamp01(t);
  const start = normalizeViewState(a);
  const end = normalizeViewState(b);
  return {
    position: lerpVec3(start.position, end.position, progress),
    rotation: lerpVec3(start.rotation, end.rotation, progress),
    zoom: lerp(start.zoom, end.zoom, progress),
    origin: start.origin || end.origin
      ? lerpVec3(start.origin ?? ZERO_VEC3, end.origin ?? start.origin ?? ZERO_VEC3, progress)
      : undefined,
  };
}

export function resolveTimelineState(clip: TimelineClip, time: number): TimelinePlaybackState {
  const duration = Math.max(0, finiteNumber(clip.duration, 0));
  const delay = Math.max(0, finiteNumber(clip.delay, 0));
  const elapsed = Math.max(0, finiteNumber(time, 0) - delay);
  const loop = clip.loop === true && duration > 0;
  const rawIteration = duration > 0 ? Math.floor(elapsed / duration) : 0;
  const iteration = loop ? rawIteration : Math.min(rawIteration, elapsed >= duration && duration > 0 ? 1 : 0);
  const localTime = duration === 0
    ? 0
    : loop
      ? elapsed % duration
      : clamp(elapsed, 0, duration);
  const resolvedDirection = resolveTimelineDirection(clip.direction ?? 'normal', iteration);
  const rawProgress = duration === 0 ? 1 : localTime / duration;
  const progress = resolvedDirection === 'reverse' ? 1 - rawProgress : rawProgress;
  return {
    time: finiteNumber(time, 0),
    localTime: resolvedDirection === 'reverse' ? duration - localTime : localTime,
    duration,
    progress: clamp01(progress),
    iteration,
    direction: resolvedDirection,
    done: !loop && elapsed >= duration,
  };
}

export function evaluateTimeline(clip: TimelineClip, time: number): TimelineEvaluation {
  const state = resolveTimelineState(clip, time);
  const transforms: Record<string, PartialTransform3D> = {};
  for (const track of clip.tracks) {
    if (!track.targetPath || track.keyframes.length === 0) continue;
    const transform = evaluateTimelineTrack(track, state.localTime, clip);
    if (transform) transforms[track.targetPath] = transform;
  }
  return { state, transforms };
}

export function evaluateTimelineTrack(track: TimelineTrack, localTime: number, clip?: Pick<TimelineClip, 'easing'>): PartialTransform3D | undefined {
  const keyframes = [...track.keyframes]
    .filter((keyframe) => Number.isFinite(keyframe.at))
    .sort((a, b) => a.at - b.at);
  if (keyframes.length === 0) return undefined;
  if (keyframes.length === 1 || localTime <= keyframes[0].at) return keyframes[0].transform;
  const last = keyframes[keyframes.length - 1];
  if (localTime >= last.at) return last.transform;

  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1];
    const next = keyframes[index];
    if (localTime < previous.at || localTime > next.at) continue;
    const span = Math.max(0.0001, next.at - previous.at);
    const progress = clamp01((localTime - previous.at) / span);
    const easing = previous.easing ?? track.easing ?? clip?.easing ?? 'linear';
    return interpolatePartialTransform(previous.transform, next.transform, easeTimelineProgress(easing, progress));
  }
  return last.transform;
}

export function interpolatePartialTransform(a: PartialTransform3D, b: PartialTransform3D, t: number): PartialTransform3D {
  const progress = clamp01(t);
  const position = interpolatePartialVec3(a.position, b.position, ZERO_VEC3, progress);
  const rotation = interpolatePartialVec3(a.rotation, b.rotation, ZERO_VEC3, progress);
  const scale = interpolatePartialVec3(a.scale, b.scale, UNIT_VEC3, progress);
  const pivot = interpolatePartialVec3(a.pivot, b.pivot, ZERO_VEC3, progress);
  return {
    ...(position ? { position } : undefined),
    ...(rotation ? { rotation } : undefined),
    ...(scale ? { scale } : undefined),
    ...(pivot ? { pivot } : undefined),
  };
}

export function easeTimelineProgress(easing: Easing | undefined, t: number): number {
  const progress = clamp01(t);
  if (!easing || easing === 'linear') return progress;
  if (easing === 'ease-in') return progress * progress;
  if (easing === 'ease-out') return 1 - (1 - progress) * (1 - progress);
  if (easing === 'ease-in-out' || easing === 'ease') {
    return progress < 0.5
      ? 2 * progress * progress
      : 1 - ((-2 * progress + 2) ** 2) / 2;
  }
  return cubicBezierY(easing.cubicBezier, progress);
}

export function fitViewToBounds(bounds: Bounds3, options: FitViewOptions): ViewState {
  const size = boundsSize(bounds);
  const center = boundsCenter(bounds);
  const padding = Math.max(0, options.padding ?? 0);
  const availableWidth = Math.max(1, options.viewport.x - padding * 2);
  const availableHeight = Math.max(1, options.viewport.y - padding * 2);
  const zoomX = size.x === 0 ? Infinity : availableWidth / size.x;
  const zoomY = size.y === 0 ? Infinity : availableHeight / size.y;
  const rawZoom = Math.min(zoomX, zoomY);
  const finiteZoom = Number.isFinite(rawZoom) ? rawZoom : 1;
  const zoom = clamp(finiteZoom, options.minZoom ?? 0.0001, options.maxZoom ?? Infinity);

  return {
    position: {
      x: options.viewport.x / 2 - center.x * zoom,
      y: options.viewport.y / 2 - center.y * zoom,
      z: -center.z * zoom,
    },
    rotation: vec3(options.rotation),
    zoom,
    origin: options.origin ? vec3(options.origin) : undefined,
  };
}

export function projectBoundsToRect(bounds: Bounds3, view: ViewState): ProjectedRect {
  const normalized = normalizeViewState(view);
  const minX = bounds.min.x * normalized.zoom + normalized.position.x;
  const maxX = bounds.max.x * normalized.zoom + normalized.position.x;
  const minY = bounds.min.y * normalized.zoom + normalized.position.y;
  const maxY = bounds.max.y * normalized.zoom + normalized.position.y;
  const x = Math.min(minX, maxX);
  const y = Math.min(minY, maxY);
  const width = Math.abs(maxX - minX);
  const height = Math.abs(maxY - minY);
  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

export function getPrimitiveBounds(primitive: Primitive): Bounds3 {
  if (primitive.kind === 'box') {
    return createBounds({ x: 0, y: 0, z: 0 }, { x: primitive.size.x, y: primitive.size.y, z: primitive.size.z });
  }
  if (primitive.kind === 'extrude') {
    return createBounds({ x: 0, y: 0, z: 0 }, { x: primitive.size.x, y: primitive.size.y, z: primitive.depth });
  }
  return createBounds({ x: 0, y: 0, z: 0 }, { x: primitive.size.x, y: primitive.size.y, z: 0 });
}

export function getPrimitiveFaces(primitive: Primitive): FaceDescriptor[] {
  if (primitive.kind === 'box') {
    return createBoxFaces({ size: primitive.size, material: primitive.material, materials: primitive.materials, contrast: primitive.contrast });
  }
  if (primitive.kind === 'plane' || primitive.kind === 'sprite') {
    return [{
      direction: 'front',
      size: primitive.size,
      transform: normalizeTransform({ position: { x: primitive.size.x / 2, y: primitive.size.y / 2, z: 0 } }),
      material: primitive.material,
      shade: 0,
    }];
  }
  return Array.from({ length: Math.max(1, primitive.layers) }, (_, index) => ({
    direction: 'front' as const,
    size: primitive.size,
    transform: normalizeTransform({
      position: {
        x: primitive.size.x / 2,
        y: primitive.size.y / 2,
        z: primitive.layers <= 1 ? 0 : (primitive.depth / (primitive.layers - 1)) * index,
      },
    }),
    material: primitive.material,
    shade: 0,
  }));
}

export function createCubeFaces(size: Size3, material?: MaterialSolid, contrast = 20): FaceDescriptor[] {
  const { x, y, z } = size;
  return [
    {
      direction: 'front',
      size: { x, y },
      transform: normalizeTransform({ position: { x: x / 2, y: y / 2, z } }),
      material: shadeMaterial(material, 0),
      shade: 0,
    },
    {
      direction: 'back',
      size: { x, y },
      transform: normalizeTransform({ position: { x: x / 2, y: y / 2, z: 0 }, rotation: { y: 180 } }),
      material: shadeMaterial(material, 4 * contrast),
      shade: 4 * contrast,
    },
    {
      direction: 'left',
      size: { x: z, y },
      transform: normalizeTransform({ position: { x: 0, y: y / 2, z: z / 2 }, rotation: { y: -90 } }),
      material: shadeMaterial(material, 3 * contrast),
      shade: 3 * contrast,
    },
    {
      direction: 'right',
      size: { x: z, y },
      transform: normalizeTransform({ position: { x, y: y / 2, z: z / 2 }, rotation: { y: 90 } }),
      material: shadeMaterial(material, 2 * contrast),
      shade: 2 * contrast,
    },
    {
      direction: 'top',
      size: { x, y: z },
      transform: normalizeTransform({ position: { x: x / 2, y: 0, z: z / 2 }, rotation: { x: 90 } }),
      material: shadeMaterial(material, contrast),
      shade: contrast,
    },
    {
      direction: 'bottom',
      size: { x, y: z },
      transform: normalizeTransform({ position: { x: x / 2, y, z: z / 2 }, rotation: { x: -90 } }),
      material: shadeMaterial(material, 5 * contrast),
      shade: 5 * contrast,
    },
  ];
}

export function createBoxFaces(init: { size: Size3; material?: MaterialSolid; materials?: FaceMaterials; contrast?: number }): FaceDescriptor[] {
  const { size, material, materials, contrast = 20 } = init;
  return createCubeFaces(size, material, contrast).map((face) => ({
    ...face,
    material: materials?.[face.direction] ?? face.material,
  }));
}

export class Node3D {
  readonly size?: Size3;
  transform: Transform3D;

  constructor(init: { size?: Size3; transform?: PartialTransform3D } = {}) {
    this.size = init.size;
    this.transform = normalizeTransform(init.transform);
  }
}

export class Cube extends Node3D {
  readonly size: Size3;
  readonly material?: MaterialSolid;
  readonly materials?: FaceMaterials;
  readonly contrast: number;

  constructor(init: { size: Size3; material?: MaterialSolid; materials?: FaceMaterials; contrast?: number; transform?: PartialTransform3D }) {
    super({ size: init.size, transform: init.transform });
    this.size = init.size;
    this.material = init.material;
    this.materials = init.materials;
    this.contrast = init.contrast ?? 20;
  }

  faces(): FaceDescriptor[] {
    return createBoxFaces({ size: this.size, material: this.material, materials: this.materials, contrast: this.contrast });
  }
}

function validateNode(node: SceneNode, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (node.id.trim() === '') {
    issues.push({ path, code: 'empty-id', message: `Node "${path}" has an empty id.` });
  }
  if (!isFiniteTransform(node.transform)) {
    issues.push({ path, code: 'invalid-transform', message: `Node "${path}" has an invalid transform.` });
  }
  if (node.primitive) {
    const bounds = getPrimitiveBounds(node.primitive);
    if (
      !Number.isFinite(bounds.max.x) ||
      !Number.isFinite(bounds.max.y) ||
      !Number.isFinite(bounds.max.z) ||
      bounds.max.x < 0 ||
      bounds.max.y < 0 ||
      bounds.max.z < 0
    ) {
      issues.push({ path, code: 'invalid-size', message: `Node "${path}" has an invalid primitive size.` });
    }
  }
  const childIds = new Set<string>();
  for (const child of node.children ?? []) {
    if (childIds.has(child.id)) {
      issues.push({ path: `${path}.${child.id}`, code: 'duplicate-id', message: `Duplicate child node id "${child.id}".` });
    }
    childIds.add(child.id);
    issues.push(...validateNode(child, `${path}.${child.id}`));
  }
  return issues;
}

function isFiniteTransform(transform: Transform3D): boolean {
  return [
    transform.position.x,
    transform.position.y,
    transform.position.z,
    transform.rotation.x,
    transform.rotation.y,
    transform.rotation.z,
    transform.scale.x,
    transform.scale.y,
    transform.scale.z,
    transform.pivot?.x ?? 0,
    transform.pivot?.y ?? 0,
    transform.pivot?.z ?? 0,
  ].every(Number.isFinite);
}

function isSceneNode(value: Primitive | SceneNode): value is SceneNode {
  return 'id' in value && 'kind' in value && 'transform' in value;
}

function sameVec3(a: Vec3, b: Vec3): boolean {
  return Math.abs(a.x - b.x) < 0.0001 && Math.abs(a.y - b.y) < 0.0001 && Math.abs(a.z - b.z) < 0.0001;
}

function degToRad(value: number): number {
  return (value / 180) * Math.PI;
}

function radToDeg(value: number): number {
  return (value / Math.PI) * 180;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function finiteNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value != null ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

function resolveTimelineDirection(direction: TimelineDirection, iteration: number): 'normal' | 'reverse' {
  if (direction === 'reverse') return 'reverse';
  if (direction === 'alternate') return iteration % 2 === 0 ? 'normal' : 'reverse';
  if (direction === 'alternate-reverse') return iteration % 2 === 0 ? 'reverse' : 'normal';
  return 'normal';
}

function interpolatePartialVec3(
  a: Partial<Vec3> | undefined,
  b: Partial<Vec3> | undefined,
  fallback: Vec3,
  t: number,
): Partial<Vec3> | undefined {
  const result: Partial<Vec3> = {};
  for (const axis of ['x', 'y', 'z'] as const) {
    if (a?.[axis] == null && b?.[axis] == null) continue;
    result[axis] = lerp(a?.[axis] ?? fallback[axis], b?.[axis] ?? fallback[axis], t);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function cubicBezierY(points: [number, number, number, number], t: number): number {
  const [, y1, , y2] = points;
  const inverse = 1 - t;
  return clamp01(
    (3 * inverse * inverse * t * y1) +
    (3 * inverse * t * t * y2) +
    (t * t * t),
  );
}

function clampColor(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
