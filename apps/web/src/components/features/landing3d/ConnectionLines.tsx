import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NetworkEdge, NetworkNode, ScrollProgressRef, DemoProgressRef } from './types';
import { getBeatAtProgress } from './storyBeats';

interface ConnectionLinesProps {
  edges: NetworkEdge[];
  nodes: NetworkNode[];
  hoveredNodeId: string | null;
  reducedMotion: boolean;
  scrollProgress: ScrollProgressRef;
  demoProgress: DemoProgressRef;
}

interface PulseData {
  edgeIndex: number;
  progress: number;
  speed: number;
}

const MAX_PULSES_PER_EDGE = 1;

/**
 * Connection lines with scroll + demo-driven opacity and pulse intensity.
 */
export function ConnectionLines({ edges, nodes, hoveredNodeId, reducedMotion, scrollProgress, demoProgress }: ConnectionLinesProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    edges.forEach((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) return;
      positions.push(...from.position, ...to.position);
      const brightness = 0.2 + edge.strength * 0.3;
      colors.push(brightness, brightness, brightness + 0.05, brightness, brightness, brightness + 0.05);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [edges, nodeMap]);

  const highlightedGeometry = useMemo(() => {
    if (!hoveredNodeId) return null;
    const positions: number[] = [];
    edges.forEach((edge) => {
      if (edge.from === hoveredNodeId || edge.to === hoveredNodeId) {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (from && to) positions.push(...from.position, ...to.position);
      }
    });
    if (positions.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [hoveredNodeId, edges, nodeMap]);

  const pulses = useRef<PulseData[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lineRef = useRef<THREE.LineSegments>(null!);
  const smoothOpacity = useRef(0.5);

  const pulseGeo = useMemo(() => new THREE.SphereGeometry(0.03, 6, 6), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const progress = scrollProgress.current;
    const demo = demoProgress.current;
    const { scene } = getBeatAtProgress(progress);

    // Demo boosts line visibility
    const demoBoost = demo > 0 && demo < 1 ? 1 + demo * 0.5 : 1;
    const targetOpacity = scene.lineOpacity * demoBoost;

    smoothOpacity.current += (targetOpacity - smoothOpacity.current) * 0.04;

    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = smoothOpacity.current;
    }

    if (reducedMotion || !meshRef.current) return;

    // More pulses during demo
    const demoPulseBoost = demo > 0 && demo < 1 ? 2 : 1;
    const maxPulses = Math.round(edges.length * MAX_PULSES_PER_EDGE * scene.particleDensity * demoPulseBoost);
    if (pulses.current.length < maxPulses) {
      const idx = Math.floor(Math.random() * edges.length);
      const existing = pulses.current.filter((p) => p.edgeIndex === idx);
      if (existing.length === 0) {
        pulses.current.push({ edgeIndex: idx, progress: 0, speed: 0.15 + Math.random() * 0.2 });
      }
    }

    const toRemove: number[] = [];
    pulses.current.forEach((p, i) => {
      p.progress += p.speed * 0.016;
      if (p.progress > 1) { toRemove.push(i); return; }

      const edge = edges[p.edgeIndex];
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) { toRemove.push(i); return; }

      const x = THREE.MathUtils.lerp(from.position[0], to.position[0], p.progress);
      const y = THREE.MathUtils.lerp(from.position[1], to.position[1], p.progress);
      const z = THREE.MathUtils.lerp(from.position[2], to.position[2], p.progress);

      dummy.position.set(x, y, z);
      const opacity = Math.sin(p.progress * Math.PI);
      dummy.scale.setScalar(opacity * 1.5 * demoBoost);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(p.edgeIndex * MAX_PULSES_PER_EDGE, dummy.matrix);
    });

    if (toRemove.length > 0) {
      pulses.current = pulses.current.filter((_, i) => !toRemove.includes(i));
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </lineSegments>

      {highlightedGeometry && (
        <lineSegments geometry={highlightedGeometry}>
          <lineBasicMaterial color="#748ffc" transparent opacity={0.7} />
        </lineSegments>
      )}

      {!reducedMotion && (
        <instancedMesh ref={meshRef} args={[pulseGeo, undefined, edges.length * MAX_PULSES_PER_EDGE]}>
          <meshBasicMaterial color="#748ffc" transparent opacity={0.8} />
        </instancedMesh>
      )}
    </group>
  );
}
