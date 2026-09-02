import { useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { AICore } from './AICore';
import { NetworkNode } from './NetworkNode';
import { ConnectionLines } from './ConnectionLines';
import { DataParticles } from './DataParticles';
import { SceneLighting } from './SceneLighting';
import { SceneCamera } from './SceneCamera';
import { NodeTooltip } from './NodeTooltip';
import { nodes, edges } from './networkData';
import type {
  NetworkNode as NetworkNodeType, TooltipData,
  ScrollProgressRef, DemoProgressRef, DemoNodeVisibilityRef,
} from './types';

interface TalentNetworkSceneProps {
  reducedMotion: boolean;
  scrollProgress: ScrollProgressRef;
  demoProgress: DemoProgressRef;
  demoNodeVisibility: DemoNodeVisibilityRef;
}

/**
 * The complete 3D talent intelligence network scene.
 * Supports scroll-driven storytelling and on-demand demo animation.
 */
export function TalentNetworkScene({
  reducedMotion, scrollProgress, demoProgress, demoNodeVisibility,
}: TalentNetworkSceneProps) {
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false, x: 0, y: 0, node: null,
  });

  const handleNodeHover = useCallback((
    node: NetworkNodeType | null,
    event?: { clientX: number; clientY: number }
  ) => {
    if (!node || !event) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    setTooltip({ visible: true, x: event.clientX, y: event.clientY, node });
  }, []);

  const hoveredNodeId = useMemo(() => tooltip.node?.id ?? null, [tooltip.node]);

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 55, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={reducedMotion ? 1 : Math.min(window.devicePixelRatio, 2)}
        style={{ background: 'transparent', pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <fog attach="fog" args={['#0a0b0f', 10, 22]} />
        <SceneLighting />
        <SceneCamera reducedMotion={reducedMotion} scrollProgress={scrollProgress} />

        <Suspense fallback={null}>
          <AICore scrollProgress={scrollProgress} demoProgress={demoProgress} />

          {nodes.map((node) => (
            <NetworkNode
              key={node.id}
              node={node}
              onHover={handleNodeHover}
              reducedMotion={reducedMotion}
              scrollProgress={scrollProgress}
              demoNodeVisibility={demoNodeVisibility}
            />
          ))}

          <ConnectionLines
            edges={edges}
            nodes={nodes}
            hoveredNodeId={hoveredNodeId}
            reducedMotion={reducedMotion}
            scrollProgress={scrollProgress}
            demoProgress={demoProgress}
          />

          <DataParticles
            count={reducedMotion ? 30 : 80}
            reducedMotion={reducedMotion}
            scrollProgress={scrollProgress}
          />
        </Suspense>
      </Canvas>

      <NodeTooltip data={tooltip} />
    </>
  );
}
