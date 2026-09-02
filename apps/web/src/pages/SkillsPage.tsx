import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Filter, X, TrendingUp, Users, Briefcase,
  GitBranch, ChevronRight, BarChart3, Target, Zap, Info,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { LayoutContext } from '@/types/layout';

const API = '/api/v1';

const CATEGORY_COLORS: Record<string, string> = {
  'Programming Languages': '#6366f1',
  'Frontend': '#3b82f6',
  'Backend': '#10b981',
  'Databases': '#f59e0b',
  'Cloud & DevOps': '#8b5cf6',
  'AI & Machine Learning': '#ec4899',
  'Data Engineering': '#06b6d4',
  'Testing': '#84cc16',
  'Soft Skills': '#f97316',
  'Security': '#ef4444',
};

const CATEGORY_BG: Record<string, string> = {
  'Programming Languages': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Frontend': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Backend': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Databases': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Cloud & DevOps': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'AI & Machine Learning': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Data Engineering': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Testing': 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'Soft Skills': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Security': 'bg-red-500/10 text-red-400 border-red-500/20',
};

/* ─── Force-directed graph canvas ────────────────────── */
function SkillGraph({ nodes, edges, onSelectSkill, selectedId }: {
  nodes: { id: string; name: string; category: string; candidateCount: number; jobCount: number; size: number }[];
  edges: { source: string; target: string; relation: string; weight: number }[];
  onSelectSkill: (id: string) => void;
  selectedId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    // Initialize positions
    const pos = positionsRef.current;
    for (const n of nodes) {
      if (!pos.has(n.id)) {
        pos.set(n.id, {
          x: W() / 2 + (Math.random() - 0.5) * 300,
          y: H() / 2 + (Math.random() - 0.5) * 200,
          vx: 0, vy: 0,
        });
      }
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    let tick = 0;
    const simulate = () => {
      tick++;
      if (tick > 300) return; // stop after stabilization

      // Force simulation
      for (const n of nodes) {
        const p = pos.get(n.id)!;
        // Center gravity
        p.vx += (W() / 2 - p.x) * 0.001;
        p.vy += (H() / 2 - p.y) * 0.001;
      }

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos.get(nodes[i].id)!;
          const b = pos.get(nodes[j].id)!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          a.vx -= dx * force / dist;
          a.vy -= dy * force / dist;
          b.vx += dx * force / dist;
          b.vy += dy * force / dist;
        }
      }

      // Edge attraction
      for (const e of edges) {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.003 * e.weight;
        a.vx += dx * force / dist;
        a.vy += dy * force / dist;
        b.vx -= dx * force / dist;
        b.vy -= dy * force / dist;
      }

      // Apply velocity with damping
      for (const n of nodes) {
        const p = pos.get(n.id)!;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(30, Math.min(W() - 30, p.x));
        p.y = Math.max(30, Math.min(H() - 30, p.y));
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, W(), H());

      // Draw edges
      for (const e of edges) {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) continue;
        const highlighted = e.source === selectedId || e.target === selectedId || e.source === hoveredNode || e.target === hoveredNode;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = highlighted ? 'rgba(99,102,241,0.4)' : 'rgba(100,116,139,0.12)';
        ctx.lineWidth = highlighted ? 1.5 : 0.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const p = pos.get(n.id)!;
        const color = CATEGORY_COLORS[n.category] || '#6366f1';
        const isSelected = n.id === selectedId;
        const isHovered = n.id === hoveredNode;
        const isConnectedToSelected = selectedId ? edges.some(e =>
          (e.source === selectedId && e.target === n.id) || (e.target === selectedId && e.source === n.id)
        ) : false;
        const dimmed = selectedId && !isSelected && !isConnectedToSelected;

        const r = n.size;
        ctx.globalAlpha = dimmed ? 0.2 : 1;

        // Glow for selected
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
          ctx.fillStyle = color + '20';
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color + (isSelected ? 'ff' : 'cc');
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = isSelected || isHovered ? '#fff' : '#e2e8f0';
        ctx.font = `${isSelected ? '600' : '400'} ${Math.max(9, Math.min(12, r * 0.6))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = n.name.length > 14 ? n.name.slice(0, 12) + '…' : n.name;
        ctx.fillText(label, p.x, p.y);

        // Candidate count badge
        if (n.candidateCount > 0 && r > 15) {
          ctx.font = '600 8px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`${n.candidateCount}c`, p.x, p.y + r + 10);
        }

        ctx.globalAlpha = 1;
      }
    };

    const loop = () => {
      simulate();
      render();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    // Handle click
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const n of nodes) {
        const p = pos.get(n.id)!;
        const dx = mx - p.x;
        const dy = my - p.y;
        if (dx * dx + dy * dy < n.size * n.size + 20) {
          onSelectSkill(n.id);
          return;
        }
      }
      onSelectSkill(null as any);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found: string | null = null;
      for (const n of nodes) {
        const p = pos.get(n.id)!;
        const dx = mx - p.x;
        const dy = my - p.y;
        if (dx * dx + dy * dy < n.size * n.size + 20) {
          found = n.id;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, [nodes, edges, selectedId, hoveredNode, onSelectSkill]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-xl" />;
}

/* ─── Skill detail panel ──────────────────────────────── */
function SkillDetailPanel({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/skills/${skillId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then(r => r.json())
      .then(data => { setSkill(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [skillId]);

  if (loading) return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  if (!skill) return <div className="p-4 text-sm text-surface-600">Skill not found</div>;

  const relatedSkills = [
    ...(skill.relatedFrom?.map((r: any) => r.target) || []),
    ...(skill.relatedTo?.map((r: any) => r.source) || []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-surface-950">{skill.name}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {skill.category && (
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', CATEGORY_BG[skill.category.name] || 'bg-surface-200 text-surface-700')}>
          {skill.category.name}
        </span>
      )}

      {skill.aliases?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1.5">Also known as</p>
          <div className="flex flex-wrap gap-1">
            {skill.aliases.map((a: any) => (
              <span key={a.id} className="inline-flex items-center rounded-full bg-surface-200 px-2 py-0.5 text-2xs text-surface-700">
                {a.alias}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-surface-300 p-3">
          <div className="flex items-center gap-1.5 text-surface-600 mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-2xs font-medium">Candidates</span>
          </div>
          <p className="text-lg font-bold text-surface-950">{skill._count?.candidateSkills || 0}</p>
        </div>
        <div className="rounded-lg border border-surface-300 p-3">
          <div className="flex items-center gap-1.5 text-surface-600 mb-1">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="text-2xs font-medium">Job Demand</span>
          </div>
          <p className="text-lg font-bold text-surface-950">{skill._count?.jobSkills || 0}</p>
        </div>
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1.5 flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" /> Related Skills
          </p>
          <div className="space-y-1">
            {relatedSkills.slice(0, 8).map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-surface-300 p-2">
                <div className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[s.category?.name] || '#6366f1' }} />
                <span className="text-xs font-medium text-surface-950 flex-1">{s.name}</span>
                {s.category && (
                  <span className="text-2xs text-surface-500">{s.category.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Candidates */}
      {skill.topCandidates?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1.5">Top Candidates</p>
          <div className="space-y-1">
            {skill.topCandidates.map((cs: any) => (
              <div key={cs.id} className="flex items-center justify-between rounded-lg border border-surface-300 p-2">
                <span className="text-xs text-surface-950">{cs.candidate.firstName} {cs.candidate.lastName}</span>
                <span className="text-2xs text-surface-600">{Math.round(cs.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Jobs */}
      {skill.topJobs?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1.5">Requiring this skill</p>
          <div className="space-y-1">
            {skill.topJobs.map((js: any) => (
              <div key={js.id} className="flex items-center justify-between rounded-lg border border-surface-300 p-2">
                <span className="text-xs text-surface-950">{js.job.title}</span>
                <Badge variant="outline" className="text-2xs">{js.job.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy */}
      {skill.parent && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1">Parent Skill</p>
          <div className="flex items-center gap-2 text-sm text-surface-950">
            <ChevronRight className="h-3 w-3" />
            {skill.parent.name}
          </div>
        </div>
      )}
      {skill.children?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-600 mb-1">Child Skills</p>
          <div className="space-y-1">
            {skill.children.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 text-sm text-surface-950">
                <ChevronRight className="h-3 w-3" />
                {c.name}
                <span className="text-2xs text-surface-500">({c._count.candidateSkills}c / {c._count.jobSkills}j)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Analytics cards ──────────────────────────────────── */
function AnalyticsSection({ analytics }: { analytics: any }) {
  if (!analytics) return null;

  return (
    <div className="space-y-4">
      {/* Skill Gaps */}
      {analytics.gaps?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-danger-500" />
              Skill Gaps (High Demand, Low Supply)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.gaps.slice(0, 8).map((gap: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-surface-950 w-32 truncate">{gap.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-danger-500"
                      style={{ width: `${Math.min(100, (gap.jobDemand / (gap.candidateSupply || 1)) * 20)}%` }}
                    />
                  </div>
                  <span className="text-2xs text-surface-600 w-16 text-right">
                    {gap.jobDemand}j / {gap.candidateSupply}c
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category distribution */}
      {analytics.categories?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-400" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.categories.map((cat: any) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded" style={{ background: CATEGORY_COLORS[cat.name] || '#6366f1' }} />
                  <span className="text-xs text-surface-950 flex-1 truncate">{cat.name}</span>
                  <span className="text-2xs text-surface-500">{cat.skillCount} skills</span>
                  <span className="text-2xs text-surface-500">{cat.totalCandidates}c / {cat.totalJobs}j</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top by candidates */}
      {analytics.topByCandidates?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success-500" />
              Top Skills by Candidate Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topByCandidates.slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xs text-surface-500 w-4 text-right">{i + 1}</span>
                  <span className="text-xs font-medium text-surface-950 flex-1">{s.name}</span>
                  <span className="text-2xs text-success-500">{s.candidateCount} candidates</span>
                  <span className="text-2xs text-surface-500">{s.jobCount} jobs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────── */
export function SkillsPage() {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
      const [graphRes, analyticsRes, catRes] = await Promise.all([
        fetch(`${API}/skills/graph${filterCategory ? `?categoryId=${filterCategory}` : ''}`, { headers }),
        fetch(`${API}/skills/analytics`, { headers }),
        fetch(`${API}/skills/categories`, { headers }),
      ]);
      const [graph, analyticsData, cats] = await Promise.all([
        graphRes.json(), analyticsRes.json(), catRes.json(),
      ]);
      setGraphData(graph);
      setAnalytics(analyticsData);
      setCategories(cats);
    } catch { /* keep existing */ }
    setLoading(false);
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredNodes = graphData?.nodes?.filter(n =>
    !search || n.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredEdges = graphData?.edges?.filter(e =>
    filteredNodes.some(n => n.id === e.source) && filteredNodes.some(n => n.id === e.target)
  ) || [];

  return (
    <div>
      <TopBar title="Skill Intelligence" subtitle="Explore skills, relationships, and demand" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
            <Input placeholder="Search skills..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-surface-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c._count?.skills || c.skillCount || 0})</option>
            ))}
          </select>
          <Button variant={showAnalytics ? 'default' : 'outline'} size="sm" onClick={() => setShowAnalytics(v => !v)}>
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Analytics
          </Button>
          <div className="text-xs text-surface-500">
            {filteredNodes.length} skills · {filteredEdges.length} connections
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph / Analytics */}
          <div className={cn('space-y-4', showAnalytics ? 'lg:col-span-3' : 'lg:col-span-4')}>
            {loading ? (
              <Skeleton className="h-[500px] rounded-xl" />
            ) : showAnalytics ? (
              <AnalyticsSection analytics={analytics} />
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-0 h-[500px]">
                  {filteredNodes.length > 0 ? (
                    <SkillGraph
                      nodes={filteredNodes}
                      edges={filteredEdges}
                      onSelectSkill={setSelectedSkillId}
                      selectedId={selectedSkillId}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-surface-600">No skills match your search</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            {!showAnalytics && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-2xs text-surface-600">{cat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedSkillId ? (
                <Card key={selectedSkillId}>
                  <CardContent className="p-4">
                    <SkillDetailPanel skillId={selectedSkillId} onClose={() => setSelectedSkillId(null)} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Info className="h-8 w-8 text-surface-400 mx-auto mb-3" />
                    <p className="text-sm text-surface-600">Click a skill node in the graph to view details</p>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
