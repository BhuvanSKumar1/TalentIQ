import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ScrollProgressRef, DemoProgressRef } from './types';
import { getBeatAtProgress } from './storyBeats';

interface AICoreProps {
  scrollProgress: ScrollProgressRef;
  demoProgress: DemoProgressRef;
}

/**
 * Central AI Core — 1.2 radius, visually dominant.
 * Pulses brighter and spins faster during demo activation.
 */
export function AICore({ scrollProgress, demoProgress }: AICoreProps) {
  const solidRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.LineSegments>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null!);

  const smoothRef = useRef({ coreScale: 1.15, coreSpeed: 1 });

  const icosaGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []);
  const wireGeo = useMemo(() => new THREE.WireframeGeometry(icosaGeo), [icosaGeo]);
  const innerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.6, 0), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const progress = scrollProgress.current;
    const demo = demoProgress.current;
    const { scene } = getBeatAtProgress(progress);

    // Demo boost — core activates during demo sequence
    const demoBoost = demo > 0 && demo < 1 ? 1 + demo * 0.3 : 1;
    const demoSpeed = demo > 0 && demo < 1 ? 1 + demo * 0.8 : 1;

    // Smooth the targets
    const s = smoothRef.current;
    s.coreScale += (scene.coreScale * demoBoost - s.coreScale) * 0.04;
    s.coreSpeed += (scene.coreSpeed * demoSpeed - s.coreSpeed) * 0.04;

    const pulse = 1 + Math.sin(t * 0.8) * 0.03;

    if (solidRef.current) {
      solidRef.current.rotation.y = t * 0.12 * s.coreSpeed;
      solidRef.current.rotation.x = Math.sin(t * 0.08 * s.coreSpeed) * 0.12;
      solidRef.current.scale.setScalar(pulse * s.coreScale);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.12 * s.coreSpeed;
      wireRef.current.rotation.x = Math.sin(t * 0.08 * s.coreSpeed) * 0.12;
      wireRef.current.scale.setScalar(pulse * s.coreScale * 1.01);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.25 * s.coreSpeed;
      innerRef.current.rotation.z = t * 0.15 * s.coreSpeed;
      const innerPulse = 1 + Math.sin(t * 1.2) * 0.06;
      innerRef.current.scale.setScalar(innerPulse * s.coreScale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 * s.coreScale * (1 + demo * 0.5);
    }

    // Material glow during demo
    if (materialRef.current && demo > 0 && demo < 1) {
      materialRef.current.emissiveIntensity = 0.2 + demo * 0.4;
    }
  });

  return (
    <group>
      <mesh ref={solidRef} geometry={icosaGeo}>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#3b5bdb"
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.5}
          emissive="#3b5bdb"
          emissiveIntensity={0.2}
          envMapIntensity={0.8}
        />
      </mesh>

      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial color="#748ffc" transparent opacity={0.2} />
      </lineSegments>

      <mesh ref={innerRef} geometry={innerGeo}>
        <meshBasicMaterial color="#5c7cfa" transparent opacity={0.65} />
      </mesh>

      <pointLight ref={lightRef} color="#5c7cfa" intensity={3} distance={12} decay={2} />
    </group>
  );
}
