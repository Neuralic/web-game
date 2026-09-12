"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Props {
  userId: string;
  className?: string;
}

interface Vec3 { x: number; y: number; z: number; }

interface AvatarData {
  success: boolean;
  obj: string | null;
  mtl: string | null;
  textures: string[];
  camera: { position: Vec3; direction: Vec3; fov?: number } | null;
  aabb: { min: Vec3; max: Vec3 } | null;
}

// Roblox CDN hash decoder — mirrors the backend resolver exactly.
function getCDNUrl(hash: string): string {
  let i = 31;
  for (let t = 0; t < 38; t++) i ^= hash.charCodeAt(t);
  return `https://t${(i % 8).toString()}.rbxcdn.com/${hash}`;
}

const DEG = Math.PI / 180;
const DAMPING = 0.08;

export default function Avatar3DViewer({ userId, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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

    // Spherical camera orbit state
    let targetTheta = 0;       // azimuth (horizontal)
    let targetPhi = 90 * DEG;  // elevation (vertical) — start level
    let targetRadius = 1;      // distance from center

    let currentTheta = targetTheta;
    let currentPhi = targetPhi;
    let currentRadius = targetRadius;

    const PHI_MIN = 5 * DEG;
    const PHI_MAX = 175 * DEG;

    let isDragging = false;
    let autoRotate = true;
    let prevX = 0;
    let prevY = 0;

    // Pinch zoom state
    let prevPinchDist = 0;

    let minRadius = 1;
    let maxRadius = 10;

    // --- Mouse handlers ---
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      autoRotate = false;
      prevX = e.clientX;
      prevY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      targetTheta -= dx * 0.005;
      targetPhi = Math.max(PHI_MIN, Math.min(PHI_MAX, targetPhi - dy * 0.005));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; };

    // --- Touch handlers (pinch zoom) ---
    const getTouchDist = (e: TouchEvent) => {
      const t = e.touches;
      if (t.length < 2) return 0;
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        prevPinchDist = getTouchDist(e);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e);
        if (prevPinchDist > 0) {
          const scale = prevPinchDist / dist;
          targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius * scale));
        }
        prevPinchDist = dist;
      }
    };
    const onTouchEnd = () => { prevPinchDist = 0; };

    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        // Step 1 — fetch CDN URLs from our backend proxy
        const res = await fetch(`${API_BASE}/avatar/3d/${userId}`);
        const rawText = await res.text();
        console.log("Raw response:", rawText);
        const data = JSON.parse(rawText) as AvatarData;
        console.log("3D data:", data);
        if (!data.success || !data.obj || !data.mtl) throw new Error("No model data");
        if (cancelled || !container) return;

        // Step 2 — fetch OBJ and MTL text via our backend proxy to avoid CORS issues
        // with direct browser requests to rbxcdn.com.
        const proxyUrl = (cdnUrl: string) =>
          `${API_BASE}/avatar/proxy?url=${encodeURIComponent(cdnUrl)}`;
        const [objRes, mtlRes] = await Promise.all([
          fetch(proxyUrl(data.obj)),
          fetch(proxyUrl(data.mtl)),
        ]);
        if (!objRes.ok || !mtlRes.ok) throw new Error("Failed to fetch model files");
        const [objText, mtlText] = await Promise.all([objRes.text(), mtlRes.text()]);
        if (cancelled || !container) return;

        // Step 3 — set up Three.js scene
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 400;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        const camera = new THREE.PerspectiveCamera(data.camera?.fov || 30, width / height, 0.1, 1000);

        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(2, 4, 3);
        scene.add(dirLight);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Step 4 — parse MTL with a URL modifier that resolves texture hashes to CDN URLs.
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url: string) => {
          const hash = url.split("/").pop() || url;
          const cdnUrl = getCDNUrl(hash);
          return `${API_BASE}/avatar/proxy?url=${encodeURIComponent(cdnUrl)}`;
        });

        const mtlLoader = new MTLLoader(manager);
        const materials = mtlLoader.parse(mtlText, "");
        materials.preload();

        Object.values(materials.materials).forEach((mat) => {
          const m = mat as THREE.Material;
          m.transparent = false;
          (m as any).alphaTest = 0;
          m.depthWrite = true;
          m.needsUpdate = true;
        });

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        const object = objLoader.parse(objText);
        console.log("Object loaded:", object);

        // Center model at origin
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);

        scene.add(object);

        // Compute ideal camera distance from bounding box
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fovRad = camera.fov * DEG;
        const idealDist = Math.abs(maxDim / Math.sin(fovRad / 2)) * 0.8;

        camera.near = idealDist / 100;
        camera.far = idealDist * 100;
        camera.updateProjectionMatrix();

        // Initialize spherical coords
        targetRadius = idealDist;
        currentRadius = idealDist;
        minRadius = idealDist * 0.3;
        maxRadius = idealDist * 3;

        // Scroll wheel zoom
        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius * (1 + e.deltaY * 0.001)));
        };

        // Attach input listeners
        container.addEventListener("wheel", onWheel, { passive: false });
        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerup", onPointerUp);
        renderer.domElement.addEventListener("pointercancel", onPointerUp);
        renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
        renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
        renderer.domElement.addEventListener("touchend", onTouchEnd);

        // Animation loop with spherical camera orbit + damping
        const animate = () => {
          frameId = requestAnimationFrame(animate);

          // Auto-rotate when not dragging
          if (autoRotate && !isDragging) {
            targetTheta += 0.005;
          }

          // Smooth damp current values toward targets
          currentTheta += (targetTheta - currentTheta) * DAMPING;
          currentPhi += (targetPhi - currentPhi) * DAMPING;
          currentRadius += (targetRadius - currentRadius) * DAMPING;

          // Convert spherical to cartesian
          camera.position.x = currentRadius * Math.sin(currentPhi) * Math.sin(currentTheta);
          camera.position.y = currentRadius * Math.cos(currentPhi);
          camera.position.z = currentRadius * Math.sin(currentPhi) * Math.cos(currentTheta);
          camera.lookAt(0, 0, 0);

          renderer!.render(scene, camera);
        };
        animate();

        resizeObserver = new ResizeObserver(() => {
          if (!container || !renderer) return;
          const w = container.clientWidth || width;
          const h = container.clientHeight || height;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        });
        resizeObserver.observe(container);

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        if (!cancelled) {
          // Fetch 2D fallback
          try {
            const fb = await fetch(`${API_BASE}/avatar/render/${userId}`);
            const fbData = await fb.json();
            if (fbData.imageUrl) setFallbackUrl(fbData.imageUrl);
          } catch {
            // ignore
          }
          setFailed(true);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
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

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#1a1a1a] rounded-lg overflow-hidden ${className}`}>
        {fallbackUrl ? (
          <img src={fallbackUrl} alt="Avatar" className="h-full object-contain" />
        ) : (
          <div className="text-gray-500 text-sm">Avatar unavailable</div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative bg-[#1a1a1a] rounded-lg overflow-hidden ${className}`}>
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
