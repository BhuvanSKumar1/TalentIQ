import { NetworkNode, NetworkEdge } from './types';

// ── Nodes ──
// Positions spread across ±4.5 range for a large, immersive scene.
// Sizes scaled up 2–2.5× for visibility at Z=5.5.
export const nodes: NetworkNode[] = [
  // Candidates (blue)
  {
    id: 'c1', type: 'candidate', position: [-3.8, 2.0, -0.8],
    label: 'Senior Full-Stack Dev', subtitle: '94% Job Match',
    color: '#5c7cfa', size: 0.42, detail: 'React · Node.js · 8yr',
  },
  {
    id: 'c2', type: 'candidate', position: [4.0, -1.5, 0.6],
    label: 'ML Engineer', subtitle: '91% Job Match',
    color: '#5c7cfa', size: 0.38, detail: 'Python · PyTorch · 5yr',
  },
  {
    id: 'c3', type: 'candidate', position: [-2.2, -2.5, 1.5],
    label: 'DevOps Lead', subtitle: '87% Job Match',
    color: '#5c7cfa', size: 0.35, detail: 'AWS · Kubernetes · 7yr',
  },
  {
    id: 'c4', type: 'candidate', position: [3.2, 2.5, -0.5],
    label: 'Frontend Architect', subtitle: '89% Job Match',
    color: '#5c7cfa', size: 0.36, detail: 'React · TypeScript · 6yr',
  },
  {
    id: 'c5', type: 'candidate', position: [-1.8, 0.8, 2.8],
    label: 'Data Scientist', subtitle: '85% Job Match',
    color: '#5c7cfa', size: 0.33, detail: 'Python · ML · 4yr',
  },
  {
    id: 'c6', type: 'candidate', position: [1.2, -3.0, -1.2],
    label: 'Backend Engineer', subtitle: '82% Job Match',
    color: '#5c7cfa', size: 0.32, detail: 'Go · Postgres · 3yr',
  },

  // Skills (green)
  {
    id: 's1', type: 'skill', position: [1.0, 3.2, 1.0],
    label: 'Python', subtitle: 'High Demand',
    color: '#10b981', size: 0.30, detail: '127 candidates · 8 jobs',
  },
  {
    id: 's2', type: 'skill', position: [-4.2, -0.5, -1.5],
    label: 'React', subtitle: 'High Demand',
    color: '#10b981', size: 0.28, detail: '98 candidates · 5 jobs',
  },
  {
    id: 's3', type: 'skill', position: [4.5, 1.0, -1.0],
    label: 'Kubernetes', subtitle: 'Growing Demand',
    color: '#10b981', size: 0.26, detail: '54 candidates · 6 jobs',
  },
  {
    id: 's4', type: 'skill', position: [-0.8, -3.2, -2.2],
    label: 'TypeScript', subtitle: 'High Demand',
    color: '#10b981', size: 0.28, detail: '112 candidates · 7 jobs',
  },
  {
    id: 's5', type: 'skill', position: [2.8, 1.2, 2.5],
    label: 'AWS', subtitle: 'In Demand',
    color: '#10b981', size: 0.25, detail: '76 candidates · 5 jobs',
  },
  {
    id: 's6', type: 'skill', position: [-3.2, 3.0, 0.2],
    label: 'Machine Learning', subtitle: 'Specialized',
    color: '#10b981', size: 0.25, detail: '41 candidates · 4 jobs',
  },

  // Jobs (amber)
  {
    id: 'j1', type: 'job', position: [1.8, -1.8, 2.2],
    label: 'Sr. Backend Engineer', subtitle: '184 Candidates',
    color: '#f59e0b', size: 0.38, detail: 'Go · AWS · Remote',
  },
  {
    id: 'j2', type: 'job', position: [-1.2, 1.8, -2.5],
    label: 'ML Engineer', subtitle: '92 Candidates',
    color: '#f59e0b', size: 0.36, detail: 'Python · PyTorch · Hybrid',
  },
  {
    id: 'j3', type: 'job', position: [3.5, -2.8, -0.8],
    label: 'Full-Stack Dev', subtitle: '215 Candidates',
    color: '#f59e0b', size: 0.40, detail: 'React · Node · On-site',
  },
  {
    id: 'j4', type: 'job', position: [-4.0, -2.0, 1.8],
    label: 'DevOps Engineer', subtitle: '78 Candidates',
    color: '#f59e0b', size: 0.34, detail: 'K8s · Terraform · Remote',
  },
];

// ── Edges ──
export const edges: NetworkEdge[] = [
  // Candidate → Skill connections
  { from: 'c1', to: 's2', strength: 0.95 },
  { from: 'c1', to: 's4', strength: 0.90 },
  { from: 'c2', to: 's1', strength: 0.92 },
  { from: 'c3', to: 's3', strength: 0.88 },
  { from: 'c3', to: 's5', strength: 0.85 },
  { from: 'c4', to: 's2', strength: 0.91 },
  { from: 'c4', to: 's4', strength: 0.87 },
  { from: 'c5', to: 's1', strength: 0.89 },
  { from: 'c5', to: 's6', strength: 0.93 },
  { from: 'c6', to: 's1', strength: 0.80 },
  { from: 'c6', to: 's4', strength: 0.82 },

  // Skill → Job connections
  { from: 's1', to: 'j1', strength: 0.75 },
  { from: 's1', to: 'j2', strength: 0.90 },
  { from: 's2', to: 'j3', strength: 0.92 },
  { from: 's3', to: 'j4', strength: 0.88 },
  { from: 's4', to: 'j3', strength: 0.85 },
  { from: 's5', to: 'j1', strength: 0.80 },
  { from: 's6', to: 'j2', strength: 0.87 },

  // Candidate → Job (matched)
  { from: 'c1', to: 'j3', strength: 0.94 },
  { from: 'c2', to: 'j2', strength: 0.91 },
  { from: 'c3', to: 'j4', strength: 0.87 },
  { from: 'c4', to: 'j3', strength: 0.89 },
  { from: 'c5', to: 'j2', strength: 0.85 },
  { from: 'c6', to: 'j1', strength: 0.82 },
];
