"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DesignSpec } from "@/db/schema";
import type { PanelKind } from "./artwork";

export const SCALE = 1 / 40;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

type Textures = Record<PanelKind, THREE.Texture> | null;

export function FoldingBox({ spec, textures, fold }: { spec: DesignSpec; textures: Textures; fold: number }) {
  const { w, h, d } = spec.dims;
  const W = w * SCALE, H = h * SCALE, D = d * SCALE;
  const T = Math.max(1.2 * SCALE, 0.045);

  const frontRef = useRef<THREE.Group>(null);
  const backRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const flapRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const foldRef = useRef(1);

  const kraft = spec.paper === "kraft";

  const { interiorMat, edgeMat } = useMemo(
    () => ({
      interiorMat: new THREE.MeshStandardMaterial({ color: kraft ? "#C89E71" : "#F1EEE6", roughness: 1 }),
      edgeMat: new THREE.MeshStandardMaterial({ color: kraft ? "#A9885B" : "#E3DFD4", roughness: 1 }),
    }),
    [kraft]
  );

  const mats = useMemo(() => {
    const build = (tex?: THREE.Texture): THREE.Material[] => {
      const outer = tex
        ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0.02 })
        : edgeMat;
      return [edgeMat, edgeMat, interiorMat, outer, edgeMat, edgeMat];
    };
    return {
      front: build(textures?.front),
      back: build(textures?.back),
      left: build(textures?.left),
      right: build(textures?.right),
      top: build(textures?.top),
      bottom: build(textures?.bottom),
      flap: [edgeMat, edgeMat, interiorMat, interiorMat, edgeMat, edgeMat] as THREE.Material[],
    };
  }, [textures, interiorMat, edgeMat]);

  const geo = useMemo(
    () => ({
      bottom: new THREE.BoxGeometry(W, T, D),
      front: new THREE.BoxGeometry(W - T * 2, T, H),
      back: new THREE.BoxGeometry(W - T * 2, T, H),
      left: new THREE.BoxGeometry(H, T, D - T * 2),
      lid: new THREE.BoxGeometry(W - T * 2, T, D),
      flap: new THREE.BoxGeometry(W * 0.7, T, H * 0.42),
    }),
    [W, H, D, T]
  );

  useFrame((state, delta) => {
    const f = (foldRef.current = THREE.MathUtils.damp(foldRef.current, clamp(fold), 5.5, delta));
    const q = Math.PI / 2;
    if (frontRef.current) frontRef.current.rotation.x = f * q;
    if (backRef.current) backRef.current.rotation.x = -f * q;
    if (leftRef.current) leftRef.current.rotation.z = -f * q;
    if (rightRef.current) rightRef.current.rotation.z = f * q;
    if (lidRef.current) {
      const lidF = clamp((f - 0.18) / 0.82);
      lidRef.current.rotation.x = -lidF * q;
    }
    if (flapRef.current) {
      const flapF = clamp((f - 0.62) / 0.38);
      flapRef.current.rotation.x = -flapF * q * 0.92;
    }
    if (rootRef.current) {
      rootRef.current.position.y = -H * 0.5 * f + Math.sin(state.clock.elapsedTime * 0.9) * 0.015;
    }
  });

  return (
    <group ref={rootRef}>
      <mesh geometry={geo.bottom} material={mats.bottom} />

      <group ref={frontRef} position={[0, 0, -D / 2]}>
        <mesh position={[0, 0, -H / 2 + T]} geometry={geo.front} material={mats.front} />
      </group>

      <group ref={backRef} position={[0, 0, D / 2]}>
        <mesh position={[0, 0, H / 2 - T]} geometry={geo.back} material={mats.back} />
        <group ref={lidRef} position={[0, 0, H - T]}>
          <mesh position={[0, 0, D / 2]} geometry={geo.lid} material={mats.top} />
          <group ref={flapRef} position={[0, 0, D]}>
            <mesh position={[0, 0, H * 0.21]} geometry={geo.flap} material={mats.flap} />
          </group>
        </group>
      </group>

      <group ref={leftRef} position={[-W / 2, 0, 0]}>
        <mesh position={[-H / 2 + T, 0, 0]} geometry={geo.left} material={mats.left} />
      </group>

      <group ref={rightRef} position={[W / 2, 0, 0]}>
        <mesh position={[H / 2 - T, 0, 0]} geometry={geo.left} material={mats.right} />
      </group>
    </group>
  );
}
