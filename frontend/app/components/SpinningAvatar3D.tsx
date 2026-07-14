"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Props {
  // Our internal user UUID — the backend resolves the linked roblox_user_id itself.
  // (A raw numeric Roblox user ID is also accepted for backwards compatibility.)
  userId: string;
  onError?: () => void;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ModelData {
  success: boolean;
  obj: string;
  mtl: string;
  textures: Record<string, string>;
  camera: { position: Vec3; direction: Vec3; fov?: number } | null;
  aabb: { min: Vec3; max: Vec3 } | null;
}

// Roblox CDN hash decoder — picks which t#.rbxcdn.com host serves a given asset hash.
// Mirrors the backend's resolveRobloxCdnUrl exactly so texture URLs referenced by the
// .mtl file (which arrive as bare hashes) resolve to the correct CDN host.
function get(hash: string): string {
  let i = 31;
  for (let t = 0; t < 38; t++) i ^= hash.charCodeAt(t);
  return `https://t${i % 8}.rbxcdn.com/${hash}`;
}

export default function SpinningAvatar3D({ userId, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!userId || !container) return;

    let cancelled = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`${API_BASE}/avatar/3d-model/${userId}`);
        const data = (await res.json()) as ModelData;
        if (!data.success || !data.obj || !data.mtl) throw new Error("Failed to load 3D model");
        if (cancelled || !container) return;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(data.camera?.fov || 30, width / height, 0.1, 1000);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(2, 4, 3);
        scene.add(dirLight);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Resolve CDN texture URLs — the .mtl references texture files by hash name, and
        // the manifest's `textures` map (plus the same get(hash) decoder used on the
        // backend) is what turns that name into a real t#.rbxcdn.com URL.
        const texturesMap = data.textures || {};
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url: string) => {
          const filename = url.split("/").pop() || url;
          const hash = texturesMap[filename] || filename;
          return get(hash);
        });

        const mtlLoader = new MTLLoader(manager);
        const materials = mtlLoader.parse(data.mtl, "");
        materials.preload();

        // Fix the alpha map transparency issue — force every material fully opaque.
        Object.values(materials.materials).forEach((mat) => {
          const material = mat as THREE.Material;
          material.transparent = false;
          (material as any).alphaTest = 0;
          material.depthWrite = true;
          material.needsUpdate = true;
        });

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        const object = objLoader.parse(data.obj);

        // Center the model at the origin so it spins in place
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        if (data.camera?.position) {
          camera.position.set(data.camera.position.x, data.camera.position.y, data.camera.position.z);
        } else {
          camera.position.set(0, 0, maxDim * 1.8);
        }
        camera.lookAt(0, 0, 0);

        scene.add(object);

        const animate = () => {
          object.rotation.y += 0.012;
          renderer!.render(scene, camera);
          frameId = requestAnimationFrame(animate);
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
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
          onError?.();
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [userId, onError]);

  if (failed) return null;

  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-xs text-amber-700 dark:text-amber-300">Loading 3D avatar...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded font-semibold text-sm text-gray-900 dark:text-gray-100 z-20">
        3D
      </div>
    </div>
  );
}
