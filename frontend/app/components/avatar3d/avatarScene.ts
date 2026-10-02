// Scene-building code for the custom (server-parsed) 3D avatar.
// Shared by Avatar3DViewer (React) and the dev-only screenshot harness in
// frontend/scripts/avatar-harness. Pure three.js — no React, no DOM except canvas/Image.
//
// COORDINATES: everything is built in Roblox's own right-handed frame (x = avatar's right,
// y = up, front of the avatar = -Z), in studs. No axis negation anywhere: the finished
// model is wrapped in a pivot rotated 180° about Y so its front faces the default +Z camera.
// A Z-negation would mirror the model (wrong chirality: mirrored shirt text, swapped sides).
import * as THREE from "three";

export const DEG = Math.PI / 180;

// ─── Response types (GET /avatar/3d-custom-v2/:userId) ────────────────────
export interface AccessoryItem {
  itemType: "accessory";
  positions: number[]; // handle-local studs (backend already normalises v1 meshes to studs)
  normals: number[];
  uvs: number[];
  indices: number[];
  scale: [number, number, number];   // SpecialMesh.Scale
  offset: [number, number, number];  // SpecialMesh.Offset (studs, handle space, NOT scaled)
  attachmentName: string | null;
  accessoryCFrame?: number[];        // Attachment CFrame in Handle space: [x,y,z] or [x,y,z,r00..r22]
  textureDataUrl: string | null;
}
export interface CustomAvatarData {
  success: boolean;
  skinColor: string;
  items: Array<Record<string, unknown> | null>;
}

// ─── R15-ish body layout (studs; origin at the soles) ────────────────────
// Parts are stacked without overlap so the classic 2-stud-tall torso/arm/leg template
// can be split proportionally between the R15 pieces.
const FOOT_H = 0.3, LOWER_LEG_H = 0.7, UPPER_LEG_H = 1.0;
const LOWER_TORSO_H = 0.4, UPPER_TORSO_H = 1.6, HEAD_S = 1.2;
const HAND_H = 0.3, LOWER_ARM_H = 0.7, UPPER_ARM_H = 1.0;
const LEG_TOP = FOOT_H + LOWER_LEG_H + UPPER_LEG_H;     // 2.0
const TORSO_TOP = LEG_TOP + LOWER_TORSO_H + UPPER_TORSO_H; // 4.0
const HEAD_CY = TORSO_TOP + HEAD_S / 2;                   // 4.6

type Seg = [number, number]; // vertical fraction of the classic 2-stud tall slot [top, bottom]
type PartName =
  | "Head" | "UpperTorso" | "LowerTorso"
  | "LeftUpperArm" | "RightUpperArm" | "LeftLowerArm" | "RightLowerArm" | "LeftHand" | "RightHand"
  | "LeftUpperLeg" | "RightUpperLeg" | "LeftLowerLeg" | "RightLowerLeg" | "LeftFoot" | "RightFoot";

interface PartDef {
  name: PartName; w: number; h: number; d: number; x: number; yTop: number;
  kind: "head" | "torso" | "armR" | "armL" | "legR" | "legL"; seg: Seg;
}
// Roblox "Right" = +X. Right limbs are at +X. Limbs sit 0.04 studs clear of the torso/each other
// (a visual gap only) so same-coloured clothing keeps readable edges.
const PARTS: PartDef[] = [
  { name: "Head",          w: 1.2, h: HEAD_S,       d: 1.2, x: 0,    yTop: TORSO_TOP + HEAD_S, kind: "head",  seg: [0, 1] },
  { name: "UpperTorso",    w: 2.0, h: UPPER_TORSO_H, d: 1.0, x: 0,    yTop: TORSO_TOP,          kind: "torso", seg: [0, 0.8] },
  { name: "LowerTorso",    w: 2.0, h: LOWER_TORSO_H, d: 1.0, x: 0,    yTop: LEG_TOP + LOWER_TORSO_H, kind: "torso", seg: [0.8, 1] },
  { name: "RightUpperArm", w: 1.0, h: UPPER_ARM_H,  d: 1.0, x: 1.54,  yTop: TORSO_TOP,          kind: "armR",  seg: [0, 0.5] },
  { name: "RightLowerArm", w: 1.0, h: LOWER_ARM_H,  d: 1.0, x: 1.54,  yTop: TORSO_TOP - UPPER_ARM_H, kind: "armR", seg: [0.5, 0.85] },
  { name: "RightHand",     w: 1.0, h: HAND_H,       d: 1.0, x: 1.54,  yTop: TORSO_TOP - UPPER_ARM_H - LOWER_ARM_H, kind: "armR", seg: [0.85, 1] },
  { name: "LeftUpperArm",  w: 1.0, h: UPPER_ARM_H,  d: 1.0, x: -1.54, yTop: TORSO_TOP,          kind: "armL",  seg: [0, 0.5] },
  { name: "LeftLowerArm",  w: 1.0, h: LOWER_ARM_H,  d: 1.0, x: -1.54, yTop: TORSO_TOP - UPPER_ARM_H, kind: "armL", seg: [0.5, 0.85] },
  { name: "LeftHand",      w: 1.0, h: HAND_H,       d: 1.0, x: -1.54, yTop: TORSO_TOP - UPPER_ARM_H - LOWER_ARM_H, kind: "armL", seg: [0.85, 1] },
  { name: "RightUpperLeg", w: 1.0, h: UPPER_LEG_H,  d: 1.0, x: 0.52,  yTop: LEG_TOP,            kind: "legR",  seg: [0, 0.5] },
  { name: "RightLowerLeg", w: 1.0, h: LOWER_LEG_H,  d: 1.0, x: 0.52,  yTop: LEG_TOP - UPPER_LEG_H, kind: "legR", seg: [0.5, 0.85] },
  { name: "RightFoot",     w: 1.0, h: FOOT_H,       d: 1.0, x: 0.52,  yTop: FOOT_H,             kind: "legR",  seg: [0.85, 1] },
  { name: "LeftUpperLeg",  w: 1.0, h: UPPER_LEG_H,  d: 1.0, x: -0.52, yTop: LEG_TOP,            kind: "legL",  seg: [0, 0.5] },
  { name: "LeftLowerLeg",  w: 1.0, h: LOWER_LEG_H,  d: 1.0, x: -0.52, yTop: LEG_TOP - UPPER_LEG_H, kind: "legL", seg: [0.5, 0.85] },
  { name: "LeftFoot",      w: 1.0, h: FOOT_H,       d: 1.0, x: -0.52, yTop: FOOT_H,             kind: "legL",  seg: [0.85, 1] },
];

// Accessory attachment points: [body part, point in that part's local space (Roblox frame)].
const ATTACHMENTS: Record<string, [PartName, [number, number, number]]> = {
  HairAttachment:          ["Head", [0, 0.6, 0]],
  HatAttachment:           ["Head", [0, 0.6, 0]],
  FaceFrontAttachment:     ["Head", [0, 0, -0.6]],
  FaceCenterAttachment:    ["Head", [0, 0, 0]],
  NeckAttachment:          ["UpperTorso", [0, 0.8, 0]],
  BodyFrontAttachment:     ["UpperTorso", [0, 0, -0.5]],
  BodyBackAttachment:      ["UpperTorso", [0, 0, 0.5]],
  LeftShoulderAttachment:  ["LeftUpperArm", [0, 0.4, 0]],
  RightShoulderAttachment: ["RightUpperArm", [0, 0.4, 0]],
  WaistFrontAttachment:    ["LowerTorso", [0, 0, -0.5]],
  WaistBackAttachment:     ["LowerTorso", [0, 0, 0.5]],
  WaistCenterAttachment:   ["LowerTorso", [0, 0, 0]],
};

// ─── Classic clothing template (585×559) ─────────────────────────────────
// Verified by cropping the real shirt (asset 13707005008) — see scripts/avatar-harness/crop-template.mjs.
// Rect = [x, y, w, h] in template pixels. Faces are named by Roblox surface (as seen from OUTSIDE).
type Rect = [number, number, number, number];
export const TW = 585, TH = 559;
interface Slot { top: Rect; bottom: Rect; right: Rect; front: Rect; left: Rect; back: Rect }
export const TEMPLATE: Record<"torso" | "armR" | "armL" | "legR" | "legL", Slot> = {
  torso: { top: [231, 8, 128, 64],  bottom: [231, 204, 128, 64], right: [165, 74, 64, 128],  front: [231, 74, 128, 128], left: [361, 74, 64, 128],  back: [427, 74, 128, 128] },
  armR:  { top: [217, 289, 64, 64], bottom: [217, 485, 64, 64],  right: [19, 355, 64, 128],  front: [85, 355, 64, 128],  left: [151, 355, 64, 128], back: [217, 355, 64, 128] },
  armL:  { top: [308, 289, 64, 64], bottom: [308, 485, 64, 64],  right: [308, 355, 64, 128], front: [374, 355, 64, 128], left: [440, 355, 64, 128], back: [506, 355, 64, 128] },
  legR:  { top: [217, 289, 64, 64], bottom: [217, 485, 64, 64],  right: [19, 355, 64, 128],  front: [85, 355, 64, 128],  left: [151, 355, 64, 128], back: [217, 355, 64, 128] },
  legL:  { top: [308, 289, 64, 64], bottom: [308, 485, 64, 64],  right: [308, 355, 64, 128], front: [374, 355, 64, 128], left: [440, 355, 64, 128], back: [506, 355, 64, 128] },
};

// BoxGeometry face order is +X,-X,+Y,-Y,+Z,-Z. Roblox: +X=Right, -X=Left, -Z=Front, +Z=Back.
const FACE_ORDER: Array<keyof Slot> = ["right", "left", "top", "bottom", "back", "front"];

function setFaceUVs(geo: THREE.BufferGeometry, slot: Slot, seg: Seg) {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
  FACE_ORDER.forEach((face, f) => {
    // Faces buried inside the body (where R15 pieces join) must not sample the template's top/bottom
    // cells (e.g. the neck hole) or a hairline of that shows at the seam — use a plain side cell instead.
    const internal = (face === "top" && seg[0] > 0) || (face === "bottom" && seg[1] < 1);
    const [x, y, w, h] = slot[internal ? "front" : face];
    const side = internal || (face !== "top" && face !== "bottom");
    // Side faces: this part shows only a vertical slice of the 2-stud-tall classic slot.
    const y0 = side ? y + h * seg[0] : y;
    const y1 = side ? y + h * seg[1] : y + h;
    const u0 = x / TW, u1 = (x + w) / TW, vTop = 1 - y0 / TH, vBot = 1 - y1 / TH;
    const b = f * 4; // three BoxGeometry: verts are TL, TR, BL, BR of each face as seen from outside
    uv.setXY(b + 0, u0, vTop);
    uv.setXY(b + 1, u1, vTop);
    uv.setXY(b + 2, u0, vBot);
    uv.setXY(b + 3, u1, vBot);
  });
  uv.needsUpdate = true;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/** Skin colour + clothing templates composited like Roblox does (transparent template pixels show what is underneath). */
async function composeSheet(skin: string, layers: Array<string | undefined>): Promise<THREE.CanvasTexture> {
  const c = document.createElement("canvas");
  c.width = TW; c.height = TH;
  const g = c.getContext("2d")!;
  g.fillStyle = skin;
  g.fillRect(0, 0, TW, TH);
  for (const url of layers) {
    if (!url) continue;
    try { g.drawImage(await loadImage(url), 0, 0, TW, TH); } catch { /* skip bad template */ }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Roblox heads are rounded, not cubes, and hair meshes are modelled around that shape.
 *  Blend a subdivided box toward a sphere: face centres keep their 0.6 extent, corners pull in. */
function roundedHeadGeometry(size: number, roundness = 0.55): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(size, size, size, 10, 10, 10);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const nor = geo.getAttribute("normal") as THREE.BufferAttribute;
  const v = new THREE.Vector3(), n = new THREE.Vector3(), r = size / 2;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const sphere = v.clone().normalize().multiplyScalar(r);
    v.lerp(sphere, roundness);
    n.lerp(sphere.normalize(), roundness).normalize();
    pos.setXYZ(i, v.x, v.y, v.z);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// ─── Accessories ─────────────────────────────────────────────────────────
async function buildAccessory(item: AccessoryItem, parts: Map<PartName, THREE.Mesh>): Promise<THREE.Object3D> {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(item.positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(item.normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(item.uvs, 2));
  if (item.indices.length > 0) geo.setIndex(new THREE.Uint32BufferAttribute(item.indices, 1));

  let mat: THREE.Material;
  if (item.textureDataUrl) {
    const tex = new THREE.Texture(await loadImage(item.textureDataUrl));
    tex.colorSpace = THREE.SRGBColorSpace;
    // Roblox mesh UVs have V measured from the bottom (OBJ convention); three's default flipY=true matches that.
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  } else {
    mat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
  }

  // SpecialMesh: vertex_in_handle = vertex * Scale + Offset
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.fromArray(item.scale);
  mesh.position.fromArray(item.offset);

  // Handle world = AttachmentWorld * inverse(AttachmentCFrameInHandle)
  const [partName, local] = ATTACHMENTS[item.attachmentName || ""] ?? ATTACHMENTS.HairAttachment;
  const part = parts.get(partName)!;
  const attachWorld = new THREE.Matrix4().makeTranslation(
    part.position.x + local[0], part.position.y + local[1], part.position.z + local[2],
  );
  const cf = item.accessoryCFrame ?? [0, 0, 0];
  const cfMat = new THREE.Matrix4().makeTranslation(cf[0], cf[1], cf[2]);
  if (cf.length >= 12) {
    cfMat.set(cf[3], cf[4], cf[5], cf[0], cf[6], cf[7], cf[8], cf[1], cf[9], cf[10], cf[11], cf[2], 0, 0, 0, 1);
  }
  const handle = new THREE.Group();
  handle.add(mesh);
  handle.matrixAutoUpdate = false;
  handle.matrix.copy(attachWorld).multiply(cfMat.invert());
  return handle;
}

// ─── Public API ──────────────────────────────────────────────────────────
export interface AvatarModel {
  /** Rotated so the avatar's front faces +Z; centred on the origin. Add this to a scene. */
  pivot: THREE.Group;
  /** Extents of everything (accessories included) for camera fitting. */
  size: THREE.Vector3;
  /** Largest horizontal distance from the vertical axis (for any orbit angle). */
  radiusXZ: number;
}

export async function buildAvatar(data: CustomAvatarData): Promise<AvatarModel> {
  const skin = data.skinColor || "#F5C842";
  const items = (data.items || []).filter(Boolean) as Array<Record<string, any>>;
  const shirt = items.find((i) => i.itemType === "shirt" && i.templateDataUrl)?.templateDataUrl as string | undefined;
  const pants = items.find((i) => i.itemType === "pants" && i.templateDataUrl)?.templateDataUrl as string | undefined;

  // Shirt covers torso + arms, pants cover torso + legs. Both templates reuse the same pixel slots
  // for arms and legs, so they must NOT be composited onto the same limb.
  const mats = {
    torso: new THREE.MeshLambertMaterial({ map: await composeSheet(skin, [pants, shirt]) }),
    arm: new THREE.MeshLambertMaterial({ map: await composeSheet(skin, [shirt]) }),
    leg: new THREE.MeshLambertMaterial({ map: await composeSheet(skin, [pants]) }),
  };
  const headMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(skin) });

  const body = new THREE.Group();
  const parts = new Map<PartName, THREE.Mesh>();
  for (const p of PARTS) {
    const geo = p.kind === "head" ? roundedHeadGeometry(p.w) : new THREE.BoxGeometry(p.w, p.h, p.d);
    if (p.kind !== "head") setFaceUVs(geo, TEMPLATE[p.kind], p.seg);
    const mat = p.kind === "head" ? headMat : p.kind === "torso" ? mats.torso : p.kind.startsWith("arm") ? mats.arm : mats.leg;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.yTop - p.h / 2, 0);
    mesh.name = p.name;
    body.add(mesh);
    parts.set(p.name, mesh);
  }

  for (const item of items) {
    if (item.itemType === "face_decal" && item.decalDataUrl) {
      const tex = new THREE.Texture(await loadImage(item.decalDataUrl as string));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
      );
      plane.rotation.y = Math.PI; // plane faces +Z by default; head front is -Z
      plane.position.set(0, 0, -0.601);
      parts.get("Head")!.add(plane);
    } else if (item.itemType === "accessory" && item.positions) {
      body.add(await buildAccessory(item as unknown as AccessoryItem, parts));
    }
  }

  // Centre on the origin, then spin 180° about Y so the front (-Z) faces the +Z camera.
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  body.position.sub(center);
  const pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;
  pivot.add(body);

  const radiusXZ = Math.max(
    Math.hypot(box.min.x - center.x, box.min.z - center.z),
    Math.hypot(box.max.x - center.x, box.max.z - center.z),
    Math.hypot(box.min.x - center.x, box.max.z - center.z),
    Math.hypot(box.max.x - center.x, box.min.z - center.z),
  );
  return { pivot, size, radiusXZ };
}

export function createAvatarScene(model: AvatarModel): THREE.Scene {
  const scene = new THREE.Scene();
  // Lighter than the page's #1a1a1a so near-black clothing keeps a readable silhouette.
  scene.background = new THREE.Color(0x3a3f4a);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-3, 1, -2);
  scene.add(fill);
  const back = new THREE.DirectionalLight(0xffffff, 0.8); // so the back view isn't lit only by ambient
  back.position.set(0, 2, -4);
  scene.add(back);
  scene.add(model.pivot);
  return scene;
}

/** Camera distance at which the whole model (hair included) fits with `margin` to spare, from any orbit angle. */
export function fitDistance(model: AvatarModel, fovDeg: number, aspect: number, margin = 1.18): number {
  const tanV = Math.tan((fovDeg * DEG) / 2);
  const tanH = tanV * aspect;
  const halfH = model.size.y / 2;
  // Nearest surface is up to radiusXZ closer than the pivot, so push back by that much.
  const dV = (halfH * margin) / tanV + model.radiusXZ;
  const dH = (model.radiusXZ * margin) / tanH + model.radiusXZ;
  return Math.max(dV, dH);
}

/** theta: 0 = camera in front (+Z), +θ orbits toward the avatar's left (+X). phi: polar angle, 90° = level. */
export function orbitCamera(camera: THREE.PerspectiveCamera, theta: number, phi: number, radius: number) {
  camera.position.set(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta),
  );
  camera.lookAt(0, 0, 0);
}
