"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import {
  buildAvatar, createAvatarScene, fitDistance, orbitCamera, DEG,
  type AvatarModel, type CustomAvatarData,
} from "./avatar3d/avatarScene";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Props {
  userId: string;
  className?: string;
  /** Bump to make the viewer refetch and swap in the latest outfit without remounting. */
  refreshKey?: number;
}

// ─── Constants ─────────────────────────────────────────────────────
const DAMPING = 0.08;
const AUTO_ROTATE_RAD_PER_SEC = 1.5; // time-based, so the spin is the same on 60/120/144 Hz screens
const AUTO_ROTATE_RESUME_MS = 1500;  // auto-spin resumes this long after the last interaction
const MAX_FRAME_DT_S = 0.1;          // don't jump if the tab was in the background

/** Free GPU resources (geometries, materials, textures) of everything in a scene. */
function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const mat of mats) {
      for (const value of Object.values(mat)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      mat.dispose();
    }
  });
}

export default function Avatar3DViewer({ userId, className = "", refreshKey = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reloadRef = useRef<((fresh?: boolean) => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!userId || !container) return;

    let cancelled = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    let targetTheta = 0;
    let targetPhi = 85 * DEG;
    let targetRadius = 1;

    let currentTheta = targetTheta;
    let currentPhi = targetPhi;
    let currentRadius = targetRadius;

    const PHI_MIN = 15 * DEG;
    const PHI_MAX = 165 * DEG;

    let isDragging = false;
    let lastInteraction = -Infinity; // performance.now() of the last drag/zoom/pinch
    let prevX = 0;
    let prevY = 0;
    let prevPinchDist = 0;

    let minRadius = 1;
    let maxRadius = 10;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastInteraction = performance.now();
      prevX = e.clientX;
      prevY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      lastInteraction = performance.now();
      targetTheta -= (e.clientX - prevX) * 0.005;
      targetPhi = Math.max(PHI_MIN, Math.min(PHI_MAX, targetPhi - (e.clientY - prevY) * 0.005));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; lastInteraction = performance.now(); };

    const getTouchDist = (e: TouchEvent) => {
      const t = e.touches;
      if (t.length < 2) return 0;
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) prevPinchDist = getTouchDist(e);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastInteraction = performance.now();
        const dist = getTouchDist(e);
        if (prevPinchDist > 0) {
          targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius * (prevPinchDist / dist)));
        }
        prevPinchDist = dist;
      }
    };
    const onTouchEnd = () => { prevPinchDist = 0; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteraction = performance.now();
      targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius * (1 + e.deltaY * 0.001)));
    };

    // Live render state. The renderer, camera and listeners are created once; later loads only swap `scene`.
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let fitDist = 1;
    let currentCustom: AvatarModel | undefined;
    let currentFov = 30;
    let requestId = 0; // bumped per load; a load whose id is stale must not touch the viewer

    // Path 1 passes a baked OBJ; Path 2 passes a model from avatar3d/avatarScene (already centred and fitted).
    const setupAndRender = (object: THREE.Object3D | null, fov = 30, custom?: AvatarModel) => {
      if (cancelled || !container) return;

      const width = container.clientWidth || 300;
      const height = container.clientHeight || 400;

      let newScene: THREE.Scene;
      if (custom) {
        newScene = createAvatarScene(custom);
      } else {
        newScene = new THREE.Scene();
        newScene.background = new THREE.Color(0x1a1a1a);
        newScene.add(new THREE.AmbientLight(0xffffff, 1.8));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(2, 4, 3);
        newScene.add(dirLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 1, -2);
        newScene.add(fillLight);
      }

      let idealDist: number;
      if (custom) {
        idealDist = fitDistance(custom, fov, width / height);
      } else {
        const box = new THREE.Box3().setFromObject(object!);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object!.position.sub(center);
        newScene.add(object!);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        idealDist = Math.abs(maxDim / Math.sin((fov * DEG) / 2)) * 0.75;
      }

      if (!renderer || !camera) {
        // First model: create the renderer, camera, listeners and render loop.
        const cam = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
        camera = cam;
        const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer = r;
        r.setSize(width, height);
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(r.domElement);

        targetRadius = idealDist;
        currentRadius = idealDist;
        minRadius = idealDist * 0.3;
        maxRadius = idealDist * 3;

        container.addEventListener("wheel", onWheel, { passive: false });
        r.domElement.addEventListener("pointerdown", onPointerDown);
        r.domElement.addEventListener("pointermove", onPointerMove);
        r.domElement.addEventListener("pointerup", onPointerUp);
        r.domElement.addEventListener("pointercancel", onPointerUp);
        r.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
        r.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
        r.domElement.addEventListener("touchend", onTouchEnd);

        let lastFrameTime = 0;
        const animate = (now: number) => {
          frameId = requestAnimationFrame(animate);
          const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, MAX_FRAME_DT_S) : 0;
          lastFrameTime = now;
          if (!isDragging && now - lastInteraction >= AUTO_ROTATE_RESUME_MS) targetTheta += AUTO_ROTATE_RAD_PER_SEC * dt;
          currentTheta += (targetTheta - currentTheta) * DAMPING;
          currentPhi += (targetPhi - currentPhi) * DAMPING;
          currentRadius += (targetRadius - currentRadius) * DAMPING;
          orbitCamera(cam, currentTheta, currentPhi, currentRadius);
          if (scene) r.render(scene, cam);
        };
        animate(performance.now());

        resizeObserver = new ResizeObserver(() => {
          if (!container || !renderer || !camera) return;
          const w = container.clientWidth || width;
          const h = container.clientHeight || height;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          if (currentCustom) {
            // keep the whole avatar in frame when the box changes shape, preserving the user's zoom
            const newFit = fitDistance(currentCustom, currentFov, w / h);
            const k = newFit / fitDist;
            targetRadius *= k; currentRadius *= k; minRadius *= k; maxRadius *= k;
            fitDist = newFit;
          }
          camera.updateProjectionMatrix();
        });
        resizeObserver.observe(container);
      } else {
        // Swap: keep the user's orbit angle and zoom, only rescale for the new model's fit distance.
        const k = idealDist / fitDist;
        targetRadius *= k; currentRadius *= k; minRadius *= k; maxRadius *= k;
        camera.aspect = width / height;
        camera.fov = fov;
      }

      camera.near = idealDist / 100;
      camera.far = idealDist * 100;
      camera.updateProjectionMatrix();

      fitDist = idealDist;
      currentCustom = custom;
      currentFov = fov;

      // Swap in the new scene on the next frame, then free the old one's GPU resources.
      const oldScene = scene;
      scene = newScene;
      if (oldScene) disposeScene(oldScene);
    };

    // `fresh`: the outfit just changed, so ask the server to skip its short-lived per-user cache.
    const load = async (fresh = false) => {
      const myId = ++requestId;
      // Superseded by a newer load, or the viewer unmounted: drop this load's result.
      const stale = () => cancelled || myId !== requestId;
      // Keep showing the current avatar while a refresh loads; only show the spinner when nothing is on screen.
      if (!scene) setLoading(true);
      try {
        // Always the custom, server-parsed outfit (/avatar/3d-custom-v2), including users with a linked Roblox account.

        const customRes = await fetch(`${API_BASE}/avatar/3d-custom-v2/${userId}${fresh ? "?fresh=1" : ""}`, { cache: "no-store" });
        if (!customRes.ok) throw new Error("Custom avatar fetch failed");

        const customData = await customRes.json() as CustomAvatarData;
        if (!customData.success) throw new Error("No avatar data");
        if (stale()) return;

        const model = await buildAvatar(customData);
        if (stale()) {
          disposeScene(createAvatarScene(model)); // never shown — free its textures/geometry
          return;
        }
        setupAndRender(null, 30, model);
        setFailed(false);
        setLoading(false);
      } catch (error) {
        console.error("Avatar3DViewer load error:", error);
        if (stale()) return;
        if (scene) return; // a refresh failed: keep showing the current avatar
        try {
          const fb = await fetch(`${API_BASE}/avatar/render/${userId}`);
          const fbData = await fb.json();
          if (!stale() && fbData.imageUrl) setFallbackUrl(fbData.imageUrl);
        } catch { /* ignore */ }
        if (stale()) return;
        setFailed(true);
        setLoading(false);
      }
    };

    reloadRef.current = load;
    load();

    return () => {
      cancelled = true;
      reloadRef.current = null;
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      container.removeEventListener("wheel", onWheel);
      if (scene) disposeScene(scene);
      if (renderer) {
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [userId]);

  // Refetch and swap when the parent bumps refreshKey (skip the initial mount — the effect above loads).
  const firstKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey === firstKey.current) return;
    firstKey.current = refreshKey;
    reloadRef.current?.(true);
  }, [refreshKey]);

  return (
    <div className={`relative bg-[#1a1a1a] rounded-lg overflow-hidden ${className}`}>
      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a1a]">
          {fallbackUrl ? (
            <img src={fallbackUrl} alt="Avatar" className="h-full object-contain" />
          ) : (
            <div className="text-gray-500 text-sm">Avatar unavailable</div>
          )}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-xs text-gray-400">Loading 3D avatar...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ touchAction: "none" }} />
    </div>
  );
}
