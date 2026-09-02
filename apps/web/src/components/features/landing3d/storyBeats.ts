import type { NodeBeatTarget, TypeBeatTarget, SceneBeatTarget } from './types';

// ── Default / rest state ──
const defaultNode = (s = 1, y = 0, o = 1, e = 0.15): NodeBeatTarget => ({
  scale: s, yDrift: y, opacity: o, emissive: e,
});

const defaultType: TypeBeatTarget = {
  candidate: defaultNode(),
  skill: defaultNode(),
  job: defaultNode(),
};

const defaultScene: SceneBeatTarget = {
  coreScale: 1,
  coreSpeed: 1,
  lineOpacity: 0.4,
  particleDensity: 1,
  cameraZ: 5.5,
};

// ── Story Beat Keyframes ──
// Each entry: [scrollProgress 0→1, type targets, scene targets]

interface BeatKeyframe {
  at: number;
  types: TypeBeatTarget;
  scene: SceneBeatTarget;
}

const beats: BeatKeyframe[] = [
  // 0.00 — Hero: core prominent, everything subtle
  {
    at: 0.0,
    types: {
      candidate: defaultNode(0.7, 0, 0.5, 0.08),
      skill: defaultNode(0.6, 0, 0.4, 0.06),
      job: defaultNode(0.65, 0, 0.45, 0.07),
    },
    scene: { ...defaultScene, coreScale: 1.15, coreSpeed: 1.0, lineOpacity: 0.25, particleDensity: 0.6, cameraZ: 5.5 },
  },

  // 0.12 — Platform / Resume Intelligence: candidates step forward
  {
    at: 0.12,
    types: {
      candidate: defaultNode(1.25, 0, 1.0, 0.35),
      skill: defaultNode(0.65, 0, 0.45, 0.08),
      job: defaultNode(0.6, 0, 0.4, 0.06),
    },
    scene: { ...defaultScene, coreScale: 0.85, coreSpeed: 0.8, lineOpacity: 0.3, particleDensity: 0.8, cameraZ: 5.8 },
  },

  // 0.28 — AI Intelligence: skills expand, connections brighten
  {
    at: 0.28,
    types: {
      candidate: defaultNode(0.8, 0, 0.6, 0.12),
      skill: defaultNode(1.35, 0, 1.0, 0.4),
      job: defaultNode(0.65, 0, 0.45, 0.07),
    },
    scene: { ...defaultScene, coreScale: 0.75, coreSpeed: 0.7, lineOpacity: 0.6, particleDensity: 1.1, cameraZ: 5.5 },
  },

  // 0.42 — Candidate Matching: candidates + jobs converge
  {
    at: 0.42,
    types: {
      candidate: defaultNode(1.15, 0.15, 1.0, 0.3),
      skill: defaultNode(0.7, 0, 0.55, 0.1),
      job: defaultNode(1.2, -0.15, 1.0, 0.3),
    },
    scene: { ...defaultScene, coreScale: 0.6, coreSpeed: 0.5, lineOpacity: 0.65, particleDensity: 1.2, cameraZ: 5.2 },
  },

  // 0.56 — Recruiter Copilot: network calms, centered
  {
    at: 0.56,
    types: {
      candidate: defaultNode(0.85, 0, 0.7, 0.15),
      skill: defaultNode(0.75, 0, 0.6, 0.1),
      job: defaultNode(0.8, 0, 0.65, 0.12),
    },
    scene: { ...defaultScene, coreScale: 0.7, coreSpeed: 0.6, lineOpacity: 0.35, particleDensity: 0.7, cameraZ: 5.8 },
  },

  // 0.70 — Analytics: grid-like arrangement, structured
  {
    at: 0.70,
    types: {
      candidate: defaultNode(0.75, 0, 0.55, 0.1),
      skill: defaultNode(0.75, 0, 0.55, 0.1),
      job: defaultNode(0.75, 0, 0.55, 0.1),
    },
    scene: { ...defaultScene, coreScale: 0.55, coreSpeed: 0.4, lineOpacity: 0.3, particleDensity: 0.5, cameraZ: 6.0 },
  },

  // 0.82 — Fairness: very calm, muted
  {
    at: 0.82,
    types: {
      candidate: defaultNode(0.7, 0, 0.45, 0.08),
      skill: defaultNode(0.7, 0, 0.45, 0.08),
      job: defaultNode(0.7, 0, 0.45, 0.08),
    },
    scene: { ...defaultScene, coreScale: 0.6, coreSpeed: 0.3, lineOpacity: 0.2, particleDensity: 0.4, cameraZ: 6.2 },
  },

  // 1.00 — CTA / End: return to hero state, core prominent
  {
    at: 1.0,
    types: {
      candidate: defaultNode(0.7, 0, 0.5, 0.08),
      skill: defaultNode(0.6, 0, 0.4, 0.06),
      job: defaultNode(0.65, 0, 0.45, 0.07),
    },
    scene: { ...defaultScene, coreScale: 1.15, coreSpeed: 1.0, lineOpacity: 0.25, particleDensity: 0.6, cameraZ: 5.5 },
  },
];

/**
 * Given a scroll progress (0→1), interpolate between the two nearest
 * beat keyframes and return smooth type + scene targets.
 */
function lerpVal(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpNode(a: NodeBeatTarget, b: NodeBeatTarget, t: number): NodeBeatTarget {
  return {
    scale: lerpVal(a.scale, b.scale, t),
    yDrift: lerpVal(a.yDrift, b.yDrift, t),
    opacity: lerpVal(a.opacity, b.opacity, t),
    emissive: lerpVal(a.emissive, b.emissive, t),
  };
}

function lerpScene(a: SceneBeatTarget, b: SceneBeatTarget, t: number): SceneBeatTarget {
  return {
    coreScale: lerpVal(a.coreScale, b.coreScale, t),
    coreSpeed: lerpVal(a.coreSpeed, b.coreSpeed, t),
    lineOpacity: lerpVal(a.lineOpacity, b.lineOpacity, t),
    particleDensity: lerpVal(a.particleDensity, b.particleDensity, t),
    cameraZ: lerpVal(a.cameraZ, b.cameraZ, t),
  };
}

function lerpTypeBeat(a: TypeBeatTarget, b: TypeBeatTarget, t: number): TypeBeatTarget {
  return {
    candidate: lerpNode(a.candidate, b.candidate, t),
    skill: lerpNode(a.skill, b.skill, t),
    job: lerpNode(a.job, b.job, t),
  };
}

export function getBeatAtProgress(progress: number): {
  types: TypeBeatTarget;
  scene: SceneBeatTarget;
} {
  const clamped = Math.max(0, Math.min(1, progress));

  // Find the two surrounding keyframes
  let lower = beats[0];
  let upper = beats[beats.length - 1];

  for (let i = 0; i < beats.length - 1; i++) {
    if (clamped >= beats[i].at && clamped <= beats[i + 1].at) {
      lower = beats[i];
      upper = beats[i + 1];
      break;
    }
  }

  // Local interpolation factor between the two keyframes
  const range = upper.at - lower.at;
  const t = range === 0 ? 0 : (clamped - lower.at) / range;

  return {
    types: lerpTypeBeat(lower.types, upper.types, t),
    scene: lerpScene(lower.scene, upper.scene, t),
  };
}
