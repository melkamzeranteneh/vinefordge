'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type NodeSpec = {
  position: [number, number, number];
  size: number;
  accent: 'green' | 'blue' | 'none';
  phase: number;
  speed: number;
  amp: number;
};

const NODE_COUNT = 16;

function buildNodes(): NodeSpec[] {
  const rand = mulberry32(1337);
  const nodes: NodeSpec[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    let x = rand() * 2 - 1;
    let y = rand() * 2 - 1;
    let z = rand() * 2 - 1;
    const len = Math.hypot(x, y, z) || 1;
    const r = 1.3 + rand() * 1.7;
    x = (x / len) * r;
    y = ((y / len) * r) * 0.62;
    z = (z / len) * r;
    const accent = i % 5 === 0 ? 'green' : i === 7 ? 'blue' : 'none';
    const size = 0.08 + rand() * 0.12 + (accent !== 'none' ? 0.05 : 0);
    nodes.push({
      position: [x, y, z],
      size,
      accent,
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 0.6,
      amp: 0.12 + rand() * 0.16,
    });
  }
  return nodes;
}

function buildEdgeGeometry(nodes: NodeSpec[]): THREE.BufferGeometry {
  const pairs: Array<[number, number, number]> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(
        nodes[i].position[0] - nodes[j].position[0],
        nodes[i].position[1] - nodes[j].position[1],
        nodes[i].position[2] - nodes[j].position[2]
      );
      if (d < 1.95) pairs.push([i, j, d]);
    }
  }
  pairs.sort((a, b) => a[2] - b[2]);
  const positions = new Float32Array(pairs.slice(0, 26).length * 6);
  pairs.slice(0, 26).forEach(([i, j], k) => {
    positions.set(nodes[i].position, k * 6);
    positions.set(nodes[j].position, k * 6 + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

function makeGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const PALETTE = {
  dark: {
    node: '#39414b',
    nodeHi: '#8b949e',
    green: '#3fb950',
    blue: '#58a6ff',
    edge: '#8b949e',
    wire: '#8b949e',
  },
  light: {
    node: '#d7dde3',
    nodeHi: '#afb8c1',
    green: '#1f883d',
    blue: '#0969da',
    edge: '#57606a',
    wire: '#57606a',
  },
};

function useIsDark() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function FloatingNode({
  spec,
  geometry,
  glowMap,
}: {
  spec: NodeSpec;
  geometry: THREE.SphereGeometry;
  glowMap: THREE.Texture;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const colors = PALETTE.dark;
  const color =
    spec.accent === 'green' ? colors.green : spec.accent === 'blue' ? colors.blue : null;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mesh.current.position.y = spec.position[1] + Math.sin(t * spec.speed + spec.phase) * spec.amp;
    mesh.current.position.x = spec.position[0] + Math.cos(t * spec.speed * 0.7 + spec.phase) * spec.amp * 0.5;
  });

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={geometry}
        position={spec.position}
      >
        <meshStandardMaterial
          color={color ?? (spec.size > 0.16 ? colors.nodeHi : colors.node)}
          roughness={0.35}
          metalness={0.1}
          emissive={color ?? '#000000'}
          emissiveIntensity={spec.accent !== 'none' ? 0.55 : 0}
        />
      </mesh>
      {spec.accent !== 'none' && (
        <sprite position={spec.position} scale={[spec.size * 11, spec.size * 11, 1]}>
          <spriteMaterial
            map={glowMap}
            color={color ?? undefined}
            transparent
            opacity={0.32}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null!);
  const wire = useRef<THREE.Mesh>(null!);
  const autoAngle = useRef(0);
  const isDark = useIsDark();
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const nodes = useMemo(buildNodes, []);
  const edgesGeo = useMemo(() => buildEdgeGeometry(nodes), [nodes]);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);
  const glowMap = useMemo(makeGlowTexture, []);

  const { width } = useThree((s) => s.viewport);

  useFrame((state, delta) => {
    autoAngle.current += delta * 0.07;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const dampedY = THREE.MathUtils.damp(
      group.current.rotation.y - autoAngle.current,
      px * 0.35,
      3,
      delta
    );
    group.current.rotation.y = autoAngle.current + dampedY;
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      py * 0.14 + 0.12,
      3,
      delta
    );
    if (wire.current) {
      wire.current.rotation.y -= delta * 0.03;
      wire.current.rotation.x += delta * 0.015;
    }
  });

  return (
    <group ref={group} scale={Math.min(1, Math.max(0.62, width / 10))}>
      <mesh ref={wire}>
        <icosahedronGeometry args={[3.4, 1]} />
        <meshBasicMaterial color={palette.wire} wireframe transparent opacity={isDark ? 0.07 : 0.09} />
      </mesh>

      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color={palette.edge} transparent opacity={isDark ? 0.22 : 0.2} />
      </lineSegments>

      {nodes.map((spec, i) => (
        <FloatingNode key={i} spec={spec} geometry={sphereGeo} glowMap={glowMap} />
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 6.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -4]} intensity={0.35} />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#58a6ff" />
      <Scene />
    </Canvas>
  );
}
