// The two 2D images of an avatar (full body, and head/bust) rendered from the SAME 3D scene the viewer shows, so they include
// every item the scene can draw (long-id UGC, imported accessories), unlike Roblox's own renderer. Transparent background.
// Used by AvatarThumbnailSync (the owner's browser, after an outfit change) and by the headless backfill in
// scripts/avatar-harness. Pure three.js: no React.

import * as THREE from "three";
import {
  buildAvatar, createAvatarScene, disposeScene, fitDistance, orbitCamera, DEG,
  type AvatarModel, type CustomAvatarData,
} from "./avatarScene";

// Rendered a little larger than the stored size (the server resizes to 420 / 256), so the downscale smooths the edges.
export const FULL_RENDER_SIZE = 512;
export const HEAD_RENDER_SIZE = 320;

const FULL_FOV = 30;
const HEAD_FOV = 26;

export interface AvatarImages {
  full: Blob;
  head: Blob;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

/** WebP where the browser can encode it, PNG otherwise (Safari). Both keep the transparency. */
async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await canvasToBlob(canvas, "image/webp", 0.92);
  if (webp && webp.type === "image/webp") return webp;
  const png = await canvasToBlob(canvas, "image/png");
  if (!png) throw new Error("Could not encode the avatar image");
  return png;
}

/** Camera for the head/bust shot: the head plus what is worn on it, with the shoulders just in view. */
export function headCamera(model: AvatarModel): THREE.PerspectiveCamera {
  const { center, size, top, bottom, halfWidth } = model.head;
  const natural = Math.max(top - bottom, halfWidth * 2) * 1.1;
  // Tall hair or a long hat would shrink the face to nothing: cap the frame, keeping the top of the head in it.
  const extent = Math.min(Math.max(natural, size * 1.6), size * 2.4);
  const frameTop = top + size * 0.14;
  const centerY = natural > extent ? frameTop - extent / 2 : (top + bottom) / 2;
  const camera = new THREE.PerspectiveCamera(HEAD_FOV, 1, 0.05, 100);
  const distance = extent / 2 / Math.tan((HEAD_FOV * DEG) / 2) + size / 2;
  camera.position.set(center.x, centerY, center.z + distance);
  camera.lookAt(center.x, centerY, center.z);
  camera.updateProjectionMatrix();
  return camera;
}

/** Camera for the full-body shot: the whole model, slightly above level, as the viewer's own snapshot. */
export function fullCamera(model: AvatarModel): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(FULL_FOV, 1, 0.05, 100);
  const distance = fitDistance(model, FULL_FOV, 1, 1.06);
  orbitCamera(camera, 0, 85 * DEG, distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  return camera;
}

/** Renders both images from the `/avatar/3d-custom-v2` response. Throws if WebGL or encoding is unavailable. */
export async function captureAvatarImages(data: CustomAvatarData): Promise<AvatarImages> {
  const model = await buildAvatar(data);
  const scene = createAvatarScene(model);
  scene.background = null; // transparent: the image sits on whatever background the page has

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  try {
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    renderer.setSize(FULL_RENDER_SIZE, FULL_RENDER_SIZE, false);
    renderer.render(scene, fullCamera(model));
    const full = await encode(canvas);

    renderer.setSize(HEAD_RENDER_SIZE, HEAD_RENDER_SIZE, false);
    renderer.render(scene, headCamera(model));
    const head = await encode(canvas);

    return { full, head };
  } finally {
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
