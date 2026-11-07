// Decoder for the compact mesh form the avatar endpoint sends with ?packed=1 (backend/src/lib/packedMesh.ts: keep in sync).
// Each array is a separate base64 string of little-endian values, so it becomes a typed array without any copying tricks.

export interface PackedMesh {
  /** number of vertices */
  count: number;
  /** bounding box of the positions: value = min + q / 65535 * (max - min) */
  pMin: [number, number, number];
  pMax: [number, number, number];
  /** range of the UVs, same scheme */
  uMin: [number, number];
  uMax: [number, number];
  /** base64 uint16 x3 per vertex */
  p: string;
  /** base64 int8 x3 per vertex */
  n: string;
  /** base64 uint16 x2 per vertex */
  uv: string;
  /** base64 indices, 2 or 4 bytes each (see iBytes) */
  i: string;
  iBytes: 2 | 4;
}

export interface UnpackedMesh {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
}

const Q = 65535;

function decode(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function unpackMesh(m: PackedMesh): UnpackedMesh {
  const p = new Uint16Array(decode(m.p));
  const uv = new Uint16Array(decode(m.uv));
  const n = new Int8Array(decode(m.n));
  const indices = m.iBytes === 4 ? new Uint32Array(decode(m.i)) : new Uint16Array(decode(m.i));

  const positions = new Float32Array(p.length);
  for (let i = 0; i < p.length; i++) {
    const c = i % 3;
    positions[i] = m.pMin[c] + (p[i] / Q) * (m.pMax[c] - m.pMin[c]);
  }
  const uvs = new Float32Array(uv.length);
  for (let i = 0; i < uv.length; i++) {
    const c = i % 2;
    uvs[i] = m.uMin[c] + (uv[i] / Q) * (m.uMax[c] - m.uMin[c]);
  }
  const normals = new Float32Array(n.length);
  for (let i = 0; i < n.length; i++) normals[i] = n[i] / 127;
  return { positions, normals, uvs, indices };
}
