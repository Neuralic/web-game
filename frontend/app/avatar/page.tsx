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
// The head is a rounded box: flat sides, top and front, corners rounded with radius HEAD_CORNER, built from
// HEAD_SEGMENTS subdivisions per side. Sinking it into the torso tucks its rounded lower edge under the torso top
// so no gap shows. Everything attached to the head (hair, hats, face accessories and the face decal) is
// positioned from the head mesh, so it moves with it. Tune here.
const HEAD_SINK = 0.12;
const HEAD_CORNER = 0.28;
const HEAD_SEGMENTS = 24;
const DECAL_OFFSET = 0.004; // how far the face decal floats off the head surface
const HEAD_CY = TORSO_TOP + HEAD_S / 2 - HEAD_SINK;       // 4.48

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
  { name: "Head",          w: 1.2, h: HEAD_S,       d: 1.2, x: 0,    yTop: TORSO_TOP + HEAD_S - HEAD_SINK, kind: "head",  seg: [0, 1] },
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

/** Roblox-style head: a box with flat sides and rounded corners. Every vertex of a subdivided box is pushed to
 *  `radius` from the inner (shrunken) box, so flat areas stay exactly flat and edges/corners become arcs/spheres. */
function roundedHeadGeometry(size: number, radius: number, segments: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const nor = geo.getAttribute("normal") as THREE.BufferAttribute;
  const inner = size / 2 - radius;
  const v = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    d.set(
      v.x - THREE.MathUtils.clamp(v.x, -inner, inner),
      v.y - THREE.MathUtils.clamp(v.y, -inner, inner),
      v.z - THREE.MathUtils.clamp(v.z, -inner, inner),
    ).normalize(); // every box-surface vertex is at least `radius` from the inner box, so d is never zero
    pos.setXYZ(
      i,
      THREE.MathUtils.clamp(v.x, -inner, inner) + d.x * radius,
      THREE.MathUtils.clamp(v.y, -inner, inner) + d.y * radius,
      THREE.MathUtils.clamp(v.z, -inner, inner) + d.z * radius,
    );
    nor.setXYZ(i, d.x, d.y, d.z);
  }
  return geo;
}

/** Point on the front (+Z) of the rounded-box head, `offset` off its surface, for plane coordinates (x, y).
 *  The flat part maps 1:1. Past the flat part the plane runs along the rounded corner by arc length, so the
 *  decal follows the head with even sampling and never dips into it. */
function headFrontPoint(x: number, y: number, offset: number): [number, number, number] {
  const half = HEAD_S / 2;
  const inner = half - HEAD_CORNER;
  const ax = (Math.max(Math.abs(x) - inner, 0) / HEAD_CORNER) * (Math.PI / 2); // angle round the corner in x
  const ay = (Math.max(Math.abs(y) - inner, 0) / HEAD_CORNER) * (Math.PI / 2); // angle round the corner in y
  const nx = Math.sign(x) * Math.sin(ax) * Math.cos(ay);
  const ny = Math.sign(y) * Math.sin(ay);
  const nz = Math.cos(ax) * Math.cos(ay);
  const r = HEAD_CORNER + offset;
  return [
    THREE.MathUtils.clamp(x, -inner, inner) + nx * r,
    THREE.MathUtils.clamp(y, -inner, inner) + ny * r,
    inner + nz * r,
  ];
}

// ─── Hair fit ────────────────────────────────────────────────────────────
// Hair meshes are authored as a shell standing off the head they were made for; on this head that leaves a visible
// gap (0.05 to 0.25 studs at the back, depending on the hair). Hair-slot meshes are therefore pulled onto the head
// after placement: the standoff each mesh actually has is measured, and the part of it near the head is shrunk.
// The front is left alone so fringes keep clear of the face decal, the underside is left alone so hair hanging
// below the head keeps its length, and meshes with a deliberately large standoff (afro, bun) are not touched.
const HAIR_FIT_EDGE = 0.01;     // standoff kept between the fitted hair and the skin (the decal floats at 0.004)
const HAIR_FIT_KEEP = 0.06;     // share of the standoff above the edge that is kept (the pull is local, see fitHairMesh)
const HAIR_FIT_PASSES = 10;     // relaxation passes before giving up on a mesh
const HAIR_FIT_MAX_GAP = 0.3;   // measured standoff above this is deliberate volume: no fit
const HAIR_FIT_MIN_RAYS = 8;    // fewer hair hits than this over the back/sides: not a head-hugging mesh, no fit
const HAIR_FIT_BLEND = 0.3;     // standoff range over which the fit fades out above the measured gap

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Signed distance from the head surface (negative inside) for a point in head-local space; `n` gets the outward normal. */
function headSurfaceAt(x: number, y: number, z: number, n: THREE.Vector3): number {
  const inner = HEAD_S / 2 - HEAD_CORNER;
  const dx = x - THREE.MathUtils.clamp(x, -inner, inner);
  const dy = y - THREE.MathUtils.clamp(y, -inner, inner);
  const dz = z - THREE.MathUtils.clamp(z, -inner, inner);
  const len = Math.hypot(dx, dy, dz);
  if (len > 1e-6) {
    n.set(dx / len, dy / len, dz / len);
    return len - HEAD_CORNER;
  }
  // Inside the inner box: nearest flat face.
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  const m = Math.max(ax, ay, az);
  n.set(m === ax ? Math.sign(x) : 0, m === ay ? Math.sign(y) : 0, m === az ? Math.sign(z) : 0);
  return m - HEAD_S / 2;
}

/** Distance from the head centre to the head surface along a unit direction. */
function headRadiusAlong(ux: number, uy: number, uz: number): number {
  const n = new THREE.Vector3();
  let lo = 0, hi = HEAD_S;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (headSurfaceAt(ux * mid, uy * mid, uz * mid, n) < 0) lo = mid; else hi = mid;
  }
  return lo;
}

interface HeadRay { dir: THREE.Vector3; r: number }

/** Rays from the head centre (azimuth 0 = straight back (+Z), 180 = front) with the head surface distance along each. */
function headRays(azDegs: number[], elDegs: number[]): HeadRay[] {
  const rays: HeadRay[] = [];
  for (const azDeg of azDegs) {
    for (const elDeg of elDegs) {
      const a = azDeg * DEG, e = elDeg * DEG;
      const dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
      rays.push({ dir, r: headRadiusAlong(dir.x, dir.y, dir.z) });
    }
  }
  return rays;
}

const HAIR_MEASURE_RAYS = headRays([0, 25, -25, 50, -50, 75, -75, 100, -100], [-15, 0, 15, 30]);

/** Distance along each ray (from the head centre) to the hair's first surface at or beyond the head surface; null where none. */
function hairSurfaceBeyondHead(mesh: THREE.Mesh, rays: HeadRay[]): Array<number | null> {
  mesh.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  return rays.map(({ dir, r }) => {
    rc.set(origin, dir);
    const hit = rc.intersectObject(mesh, false).find((h) => h.distance >= r);
    return hit ? hit.distance : null;
  });
}

const SAMPLE_DIVISIONS = 4; // 15 sample points per triangle

/**
 * For every triangle, how far its worst point (over a grid of points: corners, edges, inside) is above the lowest height the
 * hair may have there: just clear of the skin so the head does not hide it, and in the face area also clear of the decal.
 * Negative means the head hides the point or the hair touches the decal.
 */
function hairTriangleMargins(geo: THREE.BufferGeometry): Float32Array {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const index = geo.getIndex();
  const tris = (index ? index.count : pos.count) / 3;
  const out = new Float32Array(tris);
  const n = new THREE.Vector3();
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let t = 0; t < tris; t++) {
    for (let c = 0; c < 3; c++) v[c].fromBufferAttribute(pos, index ? index.getX(t * 3 + c) : t * 3 + c);
    let lowest = Infinity;
    for (let i = 0; i <= SAMPLE_DIVISIONS; i++) {
      for (let j = 0; j <= SAMPLE_DIVISIONS - i; j++) {
        const a = i / SAMPLE_DIVISIONS, b = j / SAMPLE_DIVISIONS, c = 1 - a - b;
        const s = headSurfaceAt(
          v[0].x * a + v[1].x * b + v[2].x * c,
          v[0].y * a + v[1].y * b + v[2].y * c,
          v[0].z * a + v[1].z * b + v[2].z * c,
          n,
        );
        lowest = Math.min(lowest, s - (-n.z > 0.3 ? DECAL_OFFSET * 2 : -0.002)); // front is -Z; the decal reaches about 57 degrees round
      }
    }
    out[t] = lowest;
  }
  return out;
}

/**
 * How far the hair's nearest surface beyond the head stands off it over the back and sides: the lower quartile of the
 * gaps along rays from the head centre. Null when the mesh does not cover the back/sides (not head-hugging).
 * `mesh` is in head-local space.
 */
function measureHairStandoff(mesh: THREE.Mesh): number | null {
  const hits = hairSurfaceBeyondHead(mesh, HAIR_MEASURE_RAYS);
  const gaps: number[] = [];
  hits.forEach((d, i) => { if (d !== null) gaps.push(d - HAIR_MEASURE_RAYS[i].r); });
  if (gaps.length < HAIR_FIT_MIN_RAYS) return null;
  gaps.sort((p, q) => p - q);
  return gaps[Math.floor(gaps.length * 0.25)];
}

/** Pull the hair's standoff toward the head surface (see the notes above). `pos` is in head-local space. */
function fitHairToHead(pos: THREE.BufferAttribute, standoff: number, keep: Float32Array, groupOf: Int32Array) {
  const n = new THREE.Vector3();
  const full = standoff + 0.08;          // standoff up to here is pulled in completely
  const none = full + HAIR_FIT_BLEND;    // above this the hair is left as it is
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const s = headSurfaceAt(x, y, z, n);
    if (s <= HAIR_FIT_EDGE) continue;
    const wFront = 1 - smoothstep(0.3, 0.65, -n.z);   // front is -Z: fringe/face area stays put
    const wUnder = smoothstep(-0.75, -0.25, n.y);     // underside stays put: long hair keeps its length
    const w = wFront * wUnder * (1 - smoothstep(full, none, s));
    if (w <= 0) continue;
    const fitted = HAIR_FIT_EDGE + (s - HAIR_FIT_EDGE) * (1 - w * (1 - keep[groupOf[i]]));
    pos.setXYZ(i, x - n.x * (s - fitted), y - n.y * (s - fitted), z - n.z * (s - fitted));
  }
  pos.needsUpdate = true;
}

/**
 * Fit a placed hair mesh (head-local space) onto the head in place. Starts with the full pull everywhere; a triangle that
 * had room (see hairTriangleMargins) but now cuts into the head or reaches the face decal relaxes the pull at its corners,
 * and the fit is redone until none does. Triangles that already crossed the head (the hair's own thickness walls) are
 * expected to. Returns false (mesh untouched) when the mesh is not a head-hugging shell or never settles.
 */
function fitHairMesh(geo: THREE.BufferGeometry, mat: THREE.Material): boolean {
  const standoff = measureHairStandoff(new THREE.Mesh(geo, mat));
  if (standoff === null || standoff > HAIR_FIT_MAX_GAP) return false;

  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const index = geo.getIndex();
  const original = pos.array.slice();
  const cornerOf = (t: number, c: number) => (index ? index.getX(t * 3 + c) : t * 3 + c);

  // Corners sharing a position (non-indexed meshes repeat them) must move together: one pull setting per position.
  const groupOf = new Int32Array(pos.count);
  const groups = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i)},${pos.getY(i)},${pos.getZ(i)}`;
    let g = groups.get(key);
    if (g === undefined) { g = groups.size; groups.set(key, g); }
    groupOf[i] = g;
  }
  const keep = new Float32Array(groups.size).fill(HAIR_FIT_KEEP);
  const before = hairTriangleMargins(geo);

  for (let pass = 0; pass < HAIR_FIT_PASSES; pass++) {
    pos.array.set(original);
    fitHairToHead(pos, Math.max(standoff, 0), keep, groupOf);
    const after = hairTriangleMargins(geo);
    let buried = false;
    for (let t = 0; t < after.length; t++) {
      // Room before: must still have it. Already crossing the head by a little (a thin spot of the shell): must not get worse.
      const worse = before[t] >= 0 ? after[t] < 0 : before[t] > -0.06 && after[t] < before[t] - 0.004;
      if (!worse) continue;
      buried = true;
      for (let c = 0; c < 3; c++) {
        const g = groupOf[cornerOf(t, c)];
        keep[g] += (1 - keep[g]) * 0.5; // halve the remaining pull at this corner
      }
    }
    if (!buried) {
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      return true;
    }
  }
  pos.array.set(original);
  pos.needsUpdate = true;
  return false;
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

  // Hair: measure how far the placed mesh stands off the head and, if it is a head-hugging shell, pull it onto the head.
  // The fitted copy is baked into body space, so the mesh then carries no transform of its own.
  if (item.attachmentName === "HairAttachment" && partName === "Head") {
    mesh.updateMatrix();
    const placed = geo.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(handle.matrix, mesh.matrix));
    const center = part.position;
    placed.translate(-center.x, -center.y, -center.z); // head-local, so the head centre is the origin
    if (fitHairMesh(placed, mat)) {
      placed.translate(center.x, center.y, center.z);
      mesh.geometry.dispose();
      mesh.geometry = placed;
      mesh.position.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      handle.matrix.identity();
    } else {
      placed.dispose();
    }
  }
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
    const geo = p.kind === "head" ? roundedHeadGeometry(p.w, HEAD_CORNER, HEAD_SEGMENTS) : new THREE.BoxGeometry(p.w, p.h, p.d);
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
      // The front of the head is flat with rounded edges, so a flat plane would float off the corners.
      // Segment the plane and move each vertex onto the head surface (flat part 1:1, corners by arc length)
      // with a small offset so the decal neither floats nor clips.
      const geo = new THREE.PlaneGeometry(HEAD_S, HEAD_S, 24, 24);
      const gp = geo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < gp.count; i++) {
        const [x, y, z] = headFrontPoint(gp.getX(i), gp.getY(i), DECAL_OFFSET);
        gp.setXYZ(i, x, y, z);
      }
      gp.needsUpdate = true;
      geo.computeVertexNormals();
      const plane = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
      );
      plane.rotation.y = Math.PI; // the wrapped patch faces +Z by default; head front is -Z
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
  scene.background = new THREE.Color(0x1a1a1a); // matches the page background
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
