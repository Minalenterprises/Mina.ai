"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Edges, RoundedBox, Html, ContactShadows, Environment } from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import type { DesignSpec } from "@/lib/types";

export type ViewAngle = "front" | "back" | "side" | "top" | "iso";

interface Props {
  spec: DesignSpec;
  className?: string;
  angle?: ViewAngle;
  rotate?: boolean;
}

const ANGLE_CAMERAS: Record<ViewAngle, [number, number, number]> = {
  front: [0, 0.5, 9],
  back: [0, 0.5, -9],
  side: [9, 0.5, 0],
  top: [0.01, 9, 0.01],
  iso: [6, 4, 7],
};

function LogoMark({ spec, face }: { spec: DesignSpec; face: "front" | "back" | "side" }) {
  const colors = spec.colors && spec.colors.length ? spec.colors : ["#141618", "#ffffff"];
  // If AI provided an SVG, render it via foreignObject in Html
  if (spec.logoSvg) {
    const svg = spec.logoSvg;
    return (
      <Html position={[0, face === "back" ? -0.05 : 0.1, 0]} center transform scale={0.5}>
        <div
          style={{ width: 200, height: 60, pointerEvents: "none", userSelect: "none" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </Html>
    );
  }
  // Fallback: a simple wordmark "M" in primary color
  return (
    <Html position={[0, 0.1, 0]} center transform scale={0.4}>
      <div
        style={{
          fontFamily: "Geist, sans-serif",
          fontWeight: 800,
          fontSize: "32px",
          color: colors[1] ?? "#faf6ee",
          letterSpacing: "-0.04em",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        M
      </div>
    </Html>
  );
}

function BackPanel({ spec, width, height, depth }: { spec: DesignSpec; width: number; height: number; depth: number }) {
  const colors = spec.colors && spec.colors.length ? spec.colors : ["#141618", "#ffffff"];
  const brand = spec.brand;
  if (!brand) return null;

  // Render brand info as an HTML overlay on the back face
  return (
    <Html position={[0, 0, -depth / 2 - 0.01]} center transform rotation={[0, Math.PI, 0]} scale={0.5}>
      <div
        style={{
          width: width * 50,
          height: height * 50,
          padding: "10px 12px",
          boxSizing: "border-box",
          background: colors[1] ?? "#faf6ee",
          color: colors[0] ?? "#1a1410",
          fontFamily: "Geist, sans-serif",
          fontSize: "8px",
          lineHeight: 1.4,
          pointerEvents: "none",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          overflow: "hidden",
        }}
      >
        {brand.companyName && (
          <div style={{ fontWeight: 800, fontSize: "11px", letterSpacing: "-0.02em" }}>
            {brand.companyName.toUpperCase()}
          </div>
        )}
        {brand.tagline && (
          <div style={{ fontStyle: "italic", opacity: 0.7, marginBottom: "3px" }}>
            {brand.tagline}
          </div>
        )}
        {brand.description && (
          <div style={{ opacity: 0.85, marginBottom: "3px" }}>
            {brand.description}
          </div>
        )}
        {brand.ingredients && (
          <div style={{ borderTop: `1px solid ${colors[0]}33`, paddingTop: "3px", opacity: 0.8 }}>
            <div style={{ fontWeight: 700, fontSize: "6px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1px" }}>
              {brand.weight ? `INGREDIENTS · ${brand.weight}` : "INGREDIENTS"}
            </div>
            {brand.ingredients}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: "3px", borderTop: `1px solid ${colors[0]}33` }}>
          <div style={{ fontSize: "7px", opacity: 0.7 }}>
            {brand.website && <div>{brand.website}</div>}
            {brand.email && <div>{brand.email}</div>}
            {brand.phone && <div>{brand.phone}</div>}
            {brand.address && <div style={{ marginTop: "1px", opacity: 0.6 }}>{brand.address}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {brand.barcode && (
              <div style={{ fontFamily: "monospace", fontSize: "7px", letterSpacing: "0.05em" }}>
                {brand.barcode}
              </div>
            )}
            {brand.regulatory && (
              <div style={{ fontSize: "6px", opacity: 0.6, marginTop: "1px" }}>
                {brand.regulatory}
              </div>
            )}
            {brand.social && brand.social.length > 0 && (
              <div style={{ fontSize: "6px", opacity: 0.7, marginTop: "1px" }}>
                {brand.social.join(" · ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Html>
  );
}

function Box({ spec, rotate }: { spec: DesignSpec; rotate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  
  // Safe extraction of dimensions (support both inches and mm)
  const rawW = Number(spec.width) || 140;
  const rawH = Number(spec.height) || 50;
  const rawL = Number(spec.length) || 80;
  const maxDim = Math.max(rawW, rawH, rawL, 1);
  
  // Target max 3D dimension around 3.2 units so camera framing is always perfect
  const scale = maxDim > 15 ? 3.4 / maxDim : 0.65;
  const w = Math.max(0.6, rawW * scale);
  const h = Math.max(0.4, rawH * scale);
  const l = Math.max(0.6, rawL * scale);
  const unit = maxDim > 15 ? "mm" : '"';

  const colors = useMemo(() => {
    const arr = spec.colors && spec.colors.length ? spec.colors : ["#d4af37", "#141618"];
    return arr.map((c) => new THREE.Color(c));
  }, [spec.colors]);

  const isRigid = (spec.kind || "").toLowerCase().includes("rigid") || (spec.kind || "").toLowerCase().includes("gift") || (spec.title || "").toLowerCase().includes("rigid");

  const finishProps = useMemo(() => {
    switch (spec.finish) {
      case "gloss":
        return { roughness: 0.08, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05 };
      case "foil":
        return { roughness: 0.16, metalness: 0.85, clearcoat: 0.6, clearcoatRoughness: 0.1 };
      case "soft-touch":
        return { roughness: 0.96, metalness: 0.01 };
      case "spot-uv":
        return { roughness: 0.35, metalness: 0.25, clearcoat: 0.8 };
      default:
        return { roughness: 0.75, metalness: 0.04 };
    }
  }, [spec.finish]);

  useFrame((_, dt) => {
    if (ref.current && rotate) ref.current.rotation.y += dt * 0.25;
  });

  return (
    <group ref={ref}>
      {isRigid ? (
        /* Luxury 2-piece Rigid Box with fitted Lid */
        <group>
          {/* Base Tray */}
          <RoundedBox args={[w, h * 0.95, l]} radius={Math.min(0.06, Math.min(w, h, l) * 0.03)} smoothness={8} position={[0, -h * 0.025, 0]}>
            <meshStandardMaterial color={colors[1] ?? "#1a1a1c"} {...finishProps} />
            <Edges threshold={15} color="#2b2b2b" />
          </RoundedBox>
          {/* Accent Gold / Foil Rim Gap */}
          <mesh position={[0, h * 0.44, 0]}>
            <boxGeometry args={[w * 0.98, 0.06, l * 0.98]} />
            <meshStandardMaterial color={colors[0] ?? "#d4af37"} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Fitted Lid */}
          <RoundedBox args={[w * 1.025, h * 0.38, l * 1.025]} radius={Math.min(0.06, Math.min(w, h, l) * 0.03)} smoothness={8} position={[0, h * 0.32, 0]}>
            <meshStandardMaterial color={colors[1] ?? "#1a1a1c"} {...finishProps} />
            <Edges threshold={15} color="#2b2b2b" />
          </RoundedBox>
        </group>
      ) : (
        /* Standard Folding Carton */
        <RoundedBox args={[w, h, l]} radius={Math.min(0.08, Math.min(w, h, l) * 0.04)} smoothness={8}>
          <meshStandardMaterial color={colors[1] ?? colors[0]} {...finishProps} />
          <Edges threshold={15} color="#1a1410" />
        </RoundedBox>
      )}

      {/* Front accent ribbon */}
      <mesh position={[0, h * 0.08, l / 2 + 0.008]}>
        <planeGeometry args={[w * 0.94, h * 0.22]} />
        <meshStandardMaterial color={colors[0]} roughness={0.35} metalness={spec.finish === "foil" ? 0.8 : 0.1} />
      </mesh>

      {/* Logo on front */}
      <group position={[0, h * 0.08, l / 2 + 0.01]}>
        <LogoMark spec={spec} face="front" />
      </group>

      {/* Brand info on back */}
      <BackPanel spec={spec} width={w} height={h} depth={l} />

      {/* Bottom shadow strip */}
      <mesh position={[0, -h / 2 + 0.01, 0]}>
        <boxGeometry args={[w * 0.95, 0.02, l * 0.95]} />
        <meshStandardMaterial color={colors[0]} opacity={0.15} transparent roughness={0.9} />
      </mesh>

      {/* Dimension lines */}
      <DimLine
        from={[-w / 2, -h / 2 - 0.3, -l / 2]}
        to={[w / 2, -h / 2 - 0.3, -l / 2]}
        label={`W ${rawW} ${unit}`}
      />
      <DimLine
        from={[w / 2 + 0.3, -h / 2, -l / 2]}
        to={[w / 2 + 0.3, h / 2, -l / 2]}
        label={`H ${rawH} ${unit}`}
        vertical
      />
      <DimLine
        from={[-w / 2, -h / 2 - 0.3, l / 2 + 0.3]}
        to={[-w / 2, -h / 2 - 0.3, -l / 2]}
        label={`L ${rawL} ${unit}`}
      />
    </group>
  );
}

function DimLine({
  from,
  to,
  label,
  vertical,
}: {
  from: [number, number, number];
  to: [number, number, number];
  label: string;
  vertical?: boolean;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    return g;
  }, [from, to]);

  const mid = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return a.add(b).multiplyScalar(0.5);
  }, [from, to]);

  return (
    <>
      <line>
        <primitive object={geom} attach="geometry" />
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </line>
      <Html position={[mid.x, mid.y, mid.z]} center>
        <div
          style={{
            padding: "2px 5px",
            background: "#ffffff",
            color: "#0a0a0b",
            fontSize: "9px",
            fontWeight: 700,
            fontFamily: "Reference Sans, sans-serif",
            letterSpacing: "0.04em",
            borderRadius: "3px",
            transform: vertical ? "rotate(90deg)" : undefined,
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </Html>
    </>
  );
}


function CameraRig({ angle }: { angle: ViewAngle }) {
  const pos = ANGLE_CAMERAS[axisSafe(angle)];
  useFrame(({ camera }) => {
    camera.position.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.08);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Ensure angle keys are valid
function axisSafe(a: ViewAngle): ViewAngle {
  return a in ANGLE_CAMERAS ? a : "iso";
}

export function Box3DViewer({ spec, className, angle = "iso", rotate = true }: Props) {
  const rawW = Number(spec.width) || 140;
  const rawH = Number(spec.height) || 50;
  const rawL = Number(spec.length) || 80;
  const maxDim = Math.max(rawW, rawH, rawL, 1);
  const scale = maxDim > 15 ? 3.4 / maxDim : 0.65;
  const h = Math.max(0.4, rawH * scale);

  return (
    <div className={className}>
      <Canvas
        camera={{ position: ANGLE_CAMERAS.iso, fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {/* Studio HDRI Environment for realistic reflections */}
          <Environment preset="city" />

          {/* Studio Key Light */}
          <directionalLight position={[6, 10, 6]} intensity={1.4} castShadow />
          {/* Studio Fill Light (Warm) */}
          <directionalLight position={[-6, 4, -4]} intensity={0.45} color="#fff4e6" />
          {/* Studio Rim Light (Cool) */}
          <directionalLight position={[0, -3, -6]} intensity={0.35} color="#e0f2fe" />
          {/* Ambient Fill */}
          <ambientLight intensity={0.65} />

          {/* Authentic Studio Contact Shadow on ground */}
          <ContactShadows
            position={[0, -h / 2 - 0.02, 0]}
            opacity={0.65}
            scale={12}
            blur={1.8}
            far={4}
            color="#0a0a0b"
          />

          <Box spec={spec} rotate={rotate} />
          <CameraRig angle={angle} />

          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={22}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.85}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
