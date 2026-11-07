"use client";
import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

type Key = { p: number; pos: [number, number, number]; rot: [number, number, number]; s: number };

const KEYS: Key[] = [
  { p: 0.0, pos: [2.4, 0.15, 0], rot: [0.25, 0.55, 0.08], s: 1.12 },
  { p: 0.26, pos: [-2.6, 0.75, 0], rot: [0.95, 2.05, 0.35], s: 0.78 },
  { p: 0.5, pos: [2.7, -0.35, 0], rot: [1.7, 3.35, -0.25], s: 0.88 },
  { p: 0.74, pos: [-2.5, 0.15, 0], rot: [2.35, 4.6, 0.18], s: 0.8 },
  { p: 1.0, pos: [0, -1.06, 0], rot: [0.06, 0.75, 0], s: 1.35 },
];

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function sample(p: number): Key {
  if (p <= KEYS[0].p) return KEYS[0];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = smooth((p - a.p) / (b.p - a.p));
      const l = (x: number, y: number) => x + (y - x) * t;
      return {
        p,
        pos: [l(a.pos[0], b.pos[0]), l(a.pos[1], b.pos[1]), l(a.pos[2], b.pos[2])],
        rot: [l(a.rot[0], b.rot[0]), l(a.rot[1], b.rot[1]), l(a.rot[2], b.rot[2])],
        s: l(a.s, b.s),
      };
    }
  }
  return KEYS[KEYS.length - 1];
}

function FlightBox({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const cur = useRef({ pos: new THREE.Vector3(...KEYS[0].pos), rot: new THREE.Euler(...KEYS[0].rot), s: KEYS[0].s });

  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#FBFAF6";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#141412";
    ctx.textAlign = "center";
    ctx.font = `700 108px "Space Grotesk", sans-serif`;
    ctx.fillText("minal", 250, 268);
    ctx.fillStyle = "#C6F24E";
    ctx.beginPath(); ctx.arc(414, 230, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#141412";
    ctx.font = `500 24px "IBM Plex Mono", monospace`;
    ctx.fillText("P A C K   S M A R T", 256, 340);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const target = sample(progress.current);
    const k = 3.4;
    const c = cur.current;
    // keep the box inside the frame on narrow screens
    const mx = Math.max(0, state.viewport.width / 2 - 1.3);
    const tx = Math.max(-mx, Math.min(mx, target.pos[0]));
    const ts = Math.min(target.s, Math.max(0.6, state.viewport.width / 9));
    c.pos.x = THREE.MathUtils.damp(c.pos.x, tx, k, delta);
    c.pos.y = THREE.MathUtils.damp(c.pos.y, target.pos[1] + Math.sin(state.clock.elapsedTime * 1.1) * 0.06, k, delta);
    c.pos.z = THREE.MathUtils.damp(c.pos.z, target.pos[2], k, delta);
    c.rot.x = THREE.MathUtils.damp(c.rot.x, target.rot[0], k, delta);
    c.rot.y = THREE.MathUtils.damp(c.rot.y, target.rot[1] + state.clock.elapsedTime * 0.06, k, delta);
    c.rot.z = THREE.MathUtils.damp(c.rot.z, target.rot[2], k, delta);
    c.s = THREE.MathUtils.damp(c.s, ts, k, delta);
    g.position.copy(c.pos);
    g.rotation.copy(c.rot);
    g.scale.setScalar(c.s);
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial map={tex} roughness={0.75} />
        <Edges scale={1.001} color="#141412" threshold={20} lineWidth={1} />
      </mesh>
    </group>
  );
}

export default function HomeFlight() {
  const progress = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none" aria-hidden>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.2, 6.4], fov: 33 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 5, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, -3]} intensity={0.25} color="#C6F24E" />
        <FlightBox progress={progress} />
        <ContactShadows position={[0, -2.1, 0]} opacity={0.25} scale={9} blur={2.6} far={4} />
      </Canvas>
    </div>
  );
}
