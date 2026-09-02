import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ScrollProgressRef } from './types';
import { getBeatAtProgress } from './storyBeats';

interface SceneCameraProps {
  reducedMotion: boolean;
  scrollProgress: ScrollProgressRef;
}

/**
 * Camera with mouse parallax + scroll-driven Z drift.
 * Closer framing (Z=5) for immersive view of the talent network.
 */
export function SceneCamera({ reducedMotion, scrollProgress }: SceneCameraProps) {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothZ = useRef(5.5);

  useFrame(({ pointer }) => {
    if (reducedMotion) return;
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, pointer.x * 0.8, 0.03);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, pointer.y * 0.5, 0.03);
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const progress = scrollProgress.current;
    const { scene } = getBeatAtProgress(progress);

    // Smooth camera Z — base is 5.5 for immersive framing
    const targetZ = scene.cameraZ; // story beats already set the right Z
    smoothZ.current += (targetZ - smoothZ.current) * 0.025;

    if (reducedMotion) {
      camera.position.set(0, 0, smoothZ.current);
      camera.lookAt(0, 0, 0);
      return;
    }

    const driftX = Math.sin(t * 0.08) * 0.2;
    const driftY = Math.cos(t * 0.06) * 0.15;

    camera.position.set(
      mouseRef.current.x + driftX,
      mouseRef.current.y + driftY,
      smoothZ.current
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}
