import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Scene lighting with cursor-reactive accent.
 * A point light subtly follows the mouse, creating a premium interactive feel.
 */
export function SceneLighting() {
  const cursorLightRef = useRef<THREE.PointLight>(null!);
  const targetPos = useRef(new THREE.Vector3(0, 0, 3));

  useFrame(({ pointer }) => {
    if (!cursorLightRef.current) return;
    // Map mouse to 3D space — subtle movement only
    targetPos.current.set(
      pointer.x * 3,
      pointer.y * 2,
      3
    );
    // Smooth follow
    cursorLightRef.current.position.lerp(targetPos.current, 0.04);
  });

  return (
    <>
      {/* Ambient fill — very subtle */}
      <ambientLight intensity={0.15} color="#e2e4ed" />

      {/* Key light — soft, from upper-right */}
      <directionalLight position={[5, 6, 4]} intensity={0.4} color="#e2e4ed" />

      {/* Fill light — cooler, from lower-left */}
      <directionalLight position={[-4, -3, -2]} intensity={0.15} color="#748ffc" />

      {/* Accent rim — brand blue from behind */}
      <pointLight position={[0, 3, -6]} intensity={0.6} color="#5c7cfa" distance={15} decay={2} />

      {/* Cursor-reactive light — follows mouse subtly */}
      <pointLight
        ref={cursorLightRef}
        intensity={0.4}
        color="#748ffc"
        distance={10}
        decay={2}
        position={[0, 0, 3]}
      />
    </>
  );
}
