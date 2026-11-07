"use client";
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import type * as THREE from "three";
import { FoldingBox, SCALE } from "./FoldingBox";
import { makeTextures, type PanelKind } from "./artwork";
import type { DesignSpec } from "@/db/schema";

export default function BoxScene({
  spec,
  logo,
  fold,
  autoRotate = true,
  interactive = true,
}: {
  spec: DesignSpec;
  logo: string | null;
  fold: number;
  autoRotate?: boolean;
  interactive?: boolean;
}) {
  const [textures, setTextures] = useState<Record<PanelKind, THREE.Texture> | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        await document.fonts.ready;
      } catch {}
      const tex = await makeTextures(spec, logo);
      if (alive) setTextures(tex);
    };
    run();
    return () => {
      alive = false;
    };
  }, [spec, logo]);

  const camSize = useMemo(() => {
    const s = Math.max(spec.dims.w, spec.dims.h, spec.dims.d) * SCALE;
    return Math.max(2.2, s);
  }, [spec]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [camSize * 1.7, camSize * 1.15, camSize * 1.7], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 7, 3]} intensity={1.35} />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#C6F24E" />
      <group position={[0, -camSize * 0.1, 0]}>
        <FoldingBox spec={spec} textures={textures} fold={fold} />
      </group>
      <ContactShadows position={[0, -camSize * 0.62, 0]} opacity={0.34} scale={camSize * 4.4} blur={2.8} far={camSize * 1.6} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        minDistance={camSize * 1.05}
        maxDistance={camSize * 4}
        enabled={interactive}
      />
    </Canvas>
  );
}
