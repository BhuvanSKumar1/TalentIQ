import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NetworkNode as NetworkNodeType, ScrollProgressRef, DemoNodeVisibilityRef } from './types';
import { getBeatAtProgress } from './storyBeats';

interface NetworkNodeProps {
  node: NetworkNodeType;
  onHover: (node: NetworkNodeType | null, event?: { clientX: number; clientY: number }) => void;
  reducedMotion: boolean;
  scrollProgress: ScrollProgressRef;
  demoNodeVisibility: DemoNodeVisibilityRef;
}

/**
 * A single floating node. Responds to scroll beats and demo animation visibility.
 */
export function NetworkNode({ node, onHover, reducedMotion, scrollProgress, demoNodeVisibility }: NetworkNodeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const basePos = useMemo(() => new THREE.Vector3(...node.position), [node.position]);
  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const floatSpeed = useMemo(() => 0.3 + Math.random() * 0.4, []);
  const floatAmp = useMemo(() => reducedMotion ? 0 : 0.06 + Math.random() * 0.08, [reducedMotion]);

  const smoothRef = useRef({ scale: 1, yDrift: 0, opacity: 0.9, emissive: 0.15 });
  const demoVisRef = useRef(1); // smooth demo visibility

  const handlePointerOver = useCallback((e: unknown) => {
    const ev = e as { stopPropagation?: () => void; clientX: number; clientY: number };
    ev.stopPropagation?.();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onHover(node, { clientX: ev.clientX, clientY: ev.clientY });
  }, [node, onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
    onHover(null);
  }, [onHover]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !meshRef.current || !glowRef.current || !coreRef.current) return;
    const t = clock.getElapsedTime();
    const progress = scrollProgress.current;
    const { types } = getBeatAtProgress(progress);
    const beat = types[node.type];

    // Demo visibility — node appears/disappears during demo sequence
    const targetVis = demoNodeVisibility.current[node.id] ?? 1;
    demoVisRef.current += (targetVis - demoVisRef.current) * 0.06;

    // Smooth beat targets
    const s = smoothRef.current;
    s.scale += (beat.scale - s.scale) * 0.05;
    s.yDrift += (beat.yDrift - s.yDrift) * 0.05;
    s.opacity += (beat.opacity - s.opacity) * 0.05;
    s.emissive += (beat.emissive - s.emissive) * 0.05;

    // Float animation
    if (!reducedMotion) {
      groupRef.current.position.x = basePos.x + Math.sin(t * floatSpeed + floatPhase) * floatAmp;
      groupRef.current.position.y = basePos.y + Math.cos(t * floatSpeed * 0.7 + floatPhase) * floatAmp * 0.8 + s.yDrift;
      groupRef.current.position.z = basePos.z + Math.sin(t * floatSpeed * 0.5 + floatPhase + 1) * floatAmp * 0.6;
    } else {
      groupRef.current.position.y = basePos.y + s.yDrift;
    }

    // Scale: beat target * hover boost * demo visibility
    const hoverBoost = hovered ? 1.3 : 1.0;
    const targetScale = s.scale * hoverBoost * demoVisRef.current;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08
    );

    // Glow
    const glowPulse = 1 + Math.sin(t * 1.5 + floatPhase) * 0.15;
    glowRef.current.scale.setScalar(glowPulse * s.scale * demoVisRef.current);
    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    if (glowMat.opacity !== undefined) {
      const glowTarget = hovered ? 0.12 : 0.04 + s.opacity * 0.06;
      glowMat.opacity += (glowTarget - glowMat.opacity) * 0.08;
      glowMat.opacity *= demoVisRef.current;
    }

    // Core emissive
    const coreMat = coreRef.current.material as THREE.MeshBasicMaterial;
    if (coreMat.opacity !== undefined) {
      const coreTarget = hovered ? 0.8 : 0.3 + s.emissive * 1.5;
      coreMat.opacity += (coreTarget - coreMat.opacity) * 0.08;
      coreMat.opacity *= demoVisRef.current;
    }
  });

  const nodeColor = new THREE.Color(node.color);
  const isCandidate = node.type === 'candidate';
  const isJob = node.type === 'job';

  return (
    <group ref={groupRef} position={node.position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[node.size * 2.2, 12, 12]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.06} depthWrite={false} />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[node.size, 16, 16]} />
        <meshPhysicalMaterial
          color={nodeColor}
          roughness={0.4}
          metalness={isCandidate ? 0.5 : isJob ? 0.3 : 0.4}
          transparent
          opacity={0.9}
          emissive={nodeColor}
          emissiveIntensity={0.15}
        />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[node.size * 0.4, 8, 8]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
