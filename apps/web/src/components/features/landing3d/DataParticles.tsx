import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ScrollProgressRef } from './types';
import { getBeatAtProgress } from './storyBeats';

interface DataParticlesProps {
  count?: number;
  reducedMotion: boolean;
  scrollProgress: ScrollProgressRef;
}

/**
 * Ambient floating particles. Opacity responds to scroll via story beats.
 */
export function DataParticles({ count = 80, reducedMotion, scrollProgress }: DataParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const smoothDensity = useRef(1);

  const particles = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; phase: number; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10,
        speed: 0.1 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        size: 0.012 + Math.random() * 0.018,
      });
    }
    return arr;
  }, [count]);

  const geo = useMemo(() => new THREE.SphereGeometry(1, 4, 4), []);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) return;
    const t = clock.getElapsedTime();
    const progress = scrollProgress.current;
    const { scene } = getBeatAtProgress(progress);

    // Smooth density
    smoothDensity.current += (scene.particleDensity - smoothDensity.current) * 0.03;
    const d = smoothDensity.current;

    particles.forEach((p, i) => {
      const x = p.x + Math.sin(t * p.speed + p.phase) * 0.3;
      const y = p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.2;
      const z = p.z + Math.sin(t * p.speed * 0.4 + p.phase + 2) * 0.15;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.size * d);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (reducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, count]}>
      <meshBasicMaterial color="#5c7cfa" transparent opacity={0.3} />
    </instancedMesh>
  );
}
