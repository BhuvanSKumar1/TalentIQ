import type { MutableRefObject } from 'react';
import * as THREE from 'three';

/** Scroll progress ref shared between page and 3D scene (0→1) */
export type ScrollProgressRef = MutableRefObject<number>;

/** Demo animation state ref — 0 = idle, 0→1 = animating, 1 = complete */
export type DemoProgressRef = MutableRefObject<number>;

/** Node visibility during demo sequence */
export type DemoNodeVisibilityRef = MutableRefObject<{ [nodeId: string]: number }>;

export type NodeType = 'candidate' | 'skill' | 'job';

/** Per-node target state driven by the current story beat */
export interface NodeBeatTarget {
  /** Multiplier applied to the node's base size (1 = default) */
  scale: number;
  /** Extra Y offset for position lerp */
  yDrift: number;
  /** Opacity multiplier (0→1) */
  opacity: number;
  /** Emissive intensity target */
  emissive: number;
}

/** Scene-level targets driven by the current story beat */
export interface SceneBeatTarget {
  /** Core icosahedron scale multiplier */
  coreScale: number;
  /** Core rotation speed multiplier */
  coreSpeed: number;
  /** Connection line opacity target */
  lineOpacity: number;
  /** Particle density multiplier */
  particleDensity: number;
  /** Camera Z position */
  cameraZ: number;
}

/** Combined beat state for a single node type */
export interface TypeBeatTarget {
  candidate: NodeBeatTarget;
  skill: NodeBeatTarget;
  job: NodeBeatTarget;
}

export interface NetworkNode {
  id: string;
  type: NodeType;
  position: [number, number, number];
  label: string;
  subtitle: string;
  color: string;
  size: number;
  detail?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
}

export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  node: NetworkNode | null;
}

export const NODE_COLORS: Record<NodeType, string> = {
  candidate: '#5c7cfa',
  skill: '#10b981',
  job: '#f59e0b',
};

export const NODE_GLOW: Record<NodeType, string> = {
  candidate: '#3b5bdb',
  skill: '#059669',
  job: '#d97706',
};
