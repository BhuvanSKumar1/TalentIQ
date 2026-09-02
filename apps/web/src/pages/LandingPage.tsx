import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, useCallback } from 'react';
import {
  Sparkles, Brain, Shield, BarChart3, Search, Users, Zap, ChevronRight,
  ArrowRight, Lock, Eye, Scale, FileText, Cpu, Target, MessageSquare,
  TrendingUp, AlertTriangle, GitBranch, Database, Layers, Briefcase,
  CheckCircle2, Activity, GitMerge, Code2, FileSearch, Bot,
  ArrowUpRight, CircleDot, GitPullRequest, Send, UserCheck,
  ShieldCheck, Fingerprint, ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { ScrollProgressRef, DemoProgressRef, DemoNodeVisibilityRef } from '@/components/features/landing3d';

const TalentNetworkScene = lazy(() =>
  import('@/components/features/landing3d').then((m) => ({ default: m.TalentNetworkScene }))
);

// ────────────────────────────────────────────
// Animation Helpers
// ────────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ────────────────────────────────────────────
// Data
// ────────────────────────────────────────────

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'AI Intelligence', href: '#ai' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Security', href: '#security' },
];

const metrics = [
  { value: '10K+', label: 'Candidate Profiles', note: 'demo metric' },
  { value: '98%', label: 'Extraction Accuracy', note: 'product benchmark' },
  { value: '70%', label: 'Faster Screening', note: 'product benchmark' },
  { value: '24/7', label: 'AI Recruiter', note: '' },
];

const platformFeatures = [
  { icon: FileSearch, title: 'Resume Intelligence', desc: 'Upload resumes in any format. AI extracts skills, experience, education, and projects into structured candidate profiles.' },
  { icon: Target, title: 'Skill Intelligence', desc: 'Normalized skill graph with aliases, relationships, parent-child connections, and confidence levels.' },
  { icon: GitMerge, title: 'Semantic Matching', desc: 'Multi-factor matching that combines skill overlap, experience relevance, project evidence, and education.' },
  { icon: MessageSquare, title: 'Recruiter Copilot', desc: 'Conversational AI assistant that searches candidates, compares profiles, and generates interview questions.' },
];

const aiPipeline = [
  { icon: FileSearch, label: 'Resume', color: '#5c7cfa' },
  { icon: Brain, label: 'AI Understanding', color: '#748ffc' },
  { icon: Code2, label: 'Skill Intelligence', color: '#10b981' },
  { icon: Search, label: 'Semantic Matching', color: '#f59e0b' },
  { icon: CheckCircle2, label: 'Explainable Rec.', color: '#5c7cfa' },
];

const candidateMatchData = {
  name: 'Priya Sharma',
  role: 'Senior Backend Engineer',
  score: 94,
  matchedSkills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'REST APIs', 'Docker'],
  missingSkills: ['Kubernetes'],
  evidence: [
    'Built microservices handling 2M+ daily requests',
    'Led PostgreSQL migration reducing query time by 40%',
    'AWS certified solutions architect',
  ],
  experience: '7 years',
  education: 'B.Tech Computer Science',
};

const copilotMessages = [
  { role: 'recruiter' as const, text: 'Find strong Python candidates with healthcare experience.' },
  { role: 'ai' as const, text: 'Found 24 matching candidates.\n\nTop matches:\n94% — Priya Sharma\n91% — Rahul Patel\n89% — Ananya Reddy\n\nAll three have healthcare project experience and strong Python proficiency.' },
];

const fairnessItems = [
  { icon: Brain, title: 'Explainable AI', desc: 'Every recommendation shows exactly which factors contributed to the score — skills, experience, projects, education.' },
  { icon: ShieldCheck, title: 'Bias Monitoring', desc: 'Automated detection of potential bias patterns in ranking distributions, selection rates, and feature contributions.' },
  { icon: UserCheck, title: 'Human Oversight', desc: 'AI provides recommendations, evidence, and insights. The recruiter always makes the final hiring decision.' },
  { icon: ClipboardCheck, title: 'Audit Trails', desc: 'Complete logging of every AI analysis, candidate action, and recruiter decision for compliance and review.' },
];

const securityItems = [
  { icon: Lock, title: 'Enterprise Auth', desc: 'JWT with refresh tokens, bcrypt hashing, RBAC with 5 roles, session management.' },
  { icon: Shield, title: 'Input Sanitization', desc: 'XSS protection, SQL injection prevention, prompt injection detection, file scanning.' },
  { icon: Eye, title: 'Organization Isolation', desc: 'Multi-tenant architecture ensures recruiters only access data belonging to their organization.' },
  { icon: Fingerprint, title: 'Protected Data', desc: 'PII protection, encrypted storage, secrets via environment variables, no hardcoded keys.' },
];

// ────────────────────────────────────────────
// Reduced Motion
// ────────────────────────────────────────────

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ────────────────────────────────────────────
// Nav
// ────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0b0f]/80 backdrop-blur-xl border-b border-[#1a1d26]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient">TalentIQ</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#6b7194] hover:text-[#e2e4ed] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────

function Hero({ scrollProgress, demoProgress, demoNodeVisibility, onDemo }: {
  scrollProgress: ScrollProgressRef;
  demoProgress: DemoProgressRef;
  demoNodeVisibility: DemoNodeVisibilityRef;
  onDemo: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <section className="relative min-h-[85vh] lg:min-h-[80vh] flex items-center overflow-hidden pt-16">
      <div className="w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* 3D scene — left side on desktop, below on mobile */}
        <div className="relative w-full h-[400px] md:h-[600px] lg:h-[650px] order-2 md:order-1 pointer-events-none">
          <Suspense fallback={<div className="w-full h-full" />}>
            <TalentNetworkScene
              reducedMotion={reducedMotion}
              scrollProgress={scrollProgress}
              demoProgress={demoProgress}
              demoNodeVisibility={demoNodeVisibility}
            />
          </Suspense>
        </div>

        {/* Text content — right side on desktop, top on mobile */}
        <div className="relative z-10 order-1 md:order-2">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-xl"
          >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#2c3046] bg-[#0f1117]/80 backdrop-blur-sm px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-xs font-medium text-[#b4b8cc]">AI-Powered Recruitment Intelligence</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-extrabold text-[#e2e4ed] tracking-tight leading-[1.08] mb-6" style={{ fontSize: 'clamp(2.25rem, 4vw + 1rem, 5rem)' }}>
            Turn Talent Data Into{' '}
            <span className="text-gradient">Better Hiring Decisions</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-[#b4b8cc] leading-relaxed mb-8 max-w-lg">
            TalentIQ combines AI-powered resume intelligence, semantic candidate matching,
            skill intelligence, and recruiter analytics into one intelligent hiring platform.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
              <Link to="/register">
                Start Exploring
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={onDemo}
            >
              View Live Demo
            </Button>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────
// Metrics
// ────────────────────────────────────────────

function MetricsBar() {
  return (
    <Section className="py-16 px-6" id="metrics">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <motion.div
              key={m.label}
              variants={scaleIn}
              className="text-center p-6 rounded-xl border border-[#1a1d26] bg-[#0f1117]"
            >
              <p className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] tabular-nums">{m.value}</p>
              <p className="text-sm text-[#b4b8cc] mt-2">{m.label}</p>
              {m.note && (
                <p className="text-[10px] text-[#6b7194] mt-1 uppercase tracking-wider">{m.note}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Platform
// ────────────────────────────────────────────

function PlatformSection() {
  return (
    <Section className="py-24 px-6" id="platform">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            The complete hiring intelligence platform
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            From resume ingestion to explainable candidate recommendations — every step
            powered by transparent AI with human oversight.
          </motion.p>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {platformFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="group p-6 rounded-xl border border-[#1a1d26] bg-[#0f1117] hover:border-[#2c3046] transition-all duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5c7cfa]/10 border border-[#5c7cfa]/20 mb-4 group-hover:bg-[#5c7cfa]/15 transition-all">
                <f.icon className="h-5 w-5 text-[#5c7cfa]" />
              </div>
              <h3 className="text-lg font-semibold text-[#e2e4ed] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6b7194] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// AI Intelligence Pipeline
// ────────────────────────────────────────────

function AIIntelligence() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <Section className="py-24 px-6" id="ai">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5c7cfa]/20 bg-[#5c7cfa]/5 px-4 py-1.5 mb-6">
            <Brain className="h-4 w-4 text-[#5c7cfa]" />
            <span className="text-xs font-medium text-[#5c7cfa]">AI Architecture</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            How TalentIQ processes talent
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            Every resume is parsed, understood, and matched using a transparent AI pipeline.
          </p>
        </div>

        {/* Pipeline */}
        <div ref={ref} className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0">
          {aiPipeline.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${step.color}10`,
                  borderColor: `${step.color}30`,
                }}
              >
                <step.icon className="h-6 w-6" style={{ color: step.color }} />
              </div>
              <span className="text-xs font-medium text-[#b4b8cc] text-center max-w-[80px]">{step.label}</span>
            </motion.div>
          )).reduce((acc: React.ReactNode[], el, i) => {
            if (i > 0) {
              acc.push(
                <motion.div
                  key={`arrow-${i}`}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                  transition={{ delay: i * 0.12 - 0.06, duration: 0.3 }}
                  className="hidden md:block w-8 h-px bg-[#2c3046] mx-1"
                />
              );
            }
            acc.push(el);
            return acc;
          }, [])}
        </div>

        <motion.div variants={fadeUp} className="mt-8 rounded-xl border border-[#1a1d26] bg-[#0f1117] p-5 text-center">
          <p className="text-sm text-[#6b7194]">
            <span className="font-semibold text-[#b4b8cc]">Important:</span> TalentIQ provides recommendations and decision support.
            The recruiter remains responsible for the final hiring decision.
          </p>
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Candidate Matching
// ────────────────────────────────────────────

function CandidateMatching() {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = candidateMatchData.score;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView]);

  return (
    <Section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Explainable candidate matching
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            Every match comes with evidence. See exactly why a candidate scored high —
            and what skills are missing.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Score Card */}
          <motion.div variants={scaleIn} className="rounded-xl border border-[#1a1d26] bg-[#0f1117] p-6 flex flex-col items-center justify-center">
            <p className="text-xs text-[#6b7194] uppercase tracking-wider mb-2">Match Score</p>
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1d26" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#5c7cfa" strokeWidth="6"
                  strokeDasharray={`${(animatedScore / 100) * 264} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-[#e2e4ed]">{animatedScore}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#e2e4ed] mt-3">{candidateMatchData.name}</p>
            <p className="text-xs text-[#6b7194]">{candidateMatchData.role}</p>
          </motion.div>

          {/* Matched Skills */}
          <motion.div variants={fadeUp} className="rounded-xl border border-[#1a1d26] bg-[#0f1117] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e2e4ed]">Matched Skills</h3>
              <span className="text-xs text-[#10b981] font-medium">{candidateMatchData.matchedSkills.length} matched</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {candidateMatchData.matchedSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  <CheckCircle2 className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                <AlertTriangle className="h-3 w-3" />
                {candidateMatchData.missingSkills[0]} — Gap
              </span>
            </div>
            <h4 className="text-xs font-semibold text-[#b4b8cc] uppercase tracking-wider mb-2">Evidence</h4>
            <ul className="space-y-1.5">
              {candidateMatchData.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#6b7194] leading-relaxed">
                  <span className="h-1 w-1 rounded-full bg-[#5c7cfa] mt-1.5 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Experience + Education */}
          <motion.div variants={fadeUp} className="rounded-xl border border-[#1a1d26] bg-[#0f1117] p-6">
            <h3 className="text-sm font-semibold text-[#e2e4ed] mb-4">Profile Summary</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#0a0b0f] border border-[#1a1d26]">
                <p className="text-[10px] text-[#6b7194] uppercase tracking-wider mb-1">Experience</p>
                <p className="text-sm font-semibold text-[#e2e4ed]">{candidateMatchData.experience}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0b0f] border border-[#1a1d26]">
                <p className="text-[10px] text-[#6b7194] uppercase tracking-wider mb-1">Education</p>
                <p className="text-sm font-semibold text-[#e2e4ed]">{candidateMatchData.education}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0b0f] border border-[#1a1d26]">
                <p className="text-[10px] text-[#6b7194] uppercase tracking-wider mb-1">Scoring Weights</p>
                <div className="space-y-2 mt-2">
                  {[
                    { label: 'Skills', pct: 40, color: '#5c7cfa' },
                    { label: 'Experience', pct: 20, color: '#748ffc' },
                    { label: 'Projects', pct: 20, color: '#10b981' },
                    { label: 'Education', pct: 10, color: '#f59e0b' },
                    { label: 'Semantic', pct: 10, color: '#6b7194' },
                  ].map((w) => (
                    <div key={w.label} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6b7194] w-16">{w.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#1a1d26] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${w.pct}%` } : { width: 0 }}
                          transition={{ delay: 0.5, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: w.color }}
                        />
                      </div>
                      <span className="text-[11px] text-[#6b7194] w-8 text-right">{w.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Recruiter Copilot
// ────────────────────────────────────────────

function RecruiterCopilot() {
  return (
    <Section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/20 bg-[#10b981]/5 px-4 py-1.5 mb-6">
            <Bot className="h-4 w-4 text-[#10b981]" />
            <span className="text-xs font-medium text-[#10b981]">AI Assistant</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Your AI recruiting copilot
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            Ask questions in natural language. Get evidence-backed answers from your candidate data.
          </p>
        </div>

        <motion.div variants={scaleIn} className="max-w-3xl mx-auto rounded-xl border border-[#1a1d26] bg-[#0f1117] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1d26]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5c7cfa]/10">
              <Bot className="h-4 w-4 text-[#5c7cfa]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e2e4ed]">TalentIQ Assistant</p>
              <p className="text-[11px] text-[#6b7194]">Powered by your candidate database</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4">
            {copilotMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.3, duration: 0.4 }}
                className={`flex ${msg.role === 'recruiter' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'recruiter'
                      ? 'bg-[#5c7cfa]/15 border border-[#5c7cfa]/20'
                      : 'bg-[#0a0b0f] border border-[#1a1d26]'
                  }`}
                >
                  {msg.role === 'recruiter' && (
                    <p className="text-[10px] text-[#5c7cfa] font-medium uppercase tracking-wider mb-1">Recruiter</p>
                  )}
                  {msg.role === 'ai' && (
                    <p className="text-[10px] text-[#10b981] font-medium uppercase tracking-wider mb-1">AI Assistant</p>
                  )}
                  <p className="text-sm text-[#b4b8cc] leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex justify-end"
            >
              <div className="bg-[#5c7cfa]/15 border border-[#5c7cfa]/20 rounded-xl px-4 py-2 flex items-center gap-1.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5c7cfa] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5c7cfa] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5c7cfa] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────

function AnalyticsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const funnelData = [
    { label: 'Applied', value: 147, pct: 100 },
    { label: 'Screened', value: 89, pct: 61 },
    { label: 'Shortlisted', value: 34, pct: 23 },
    { label: 'Interviewed', value: 12, pct: 8 },
    { label: 'Hired', value: 4, pct: 3 },
  ];

  return (
    <Section className="py-24 px-6" id="analytics">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Recruitment analytics that drive decisions
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            Track every metric that matters — from application volume to time-to-hire.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Funnel */}
          <motion.div variants={fadeUp} className="rounded-xl border border-[#1a1d26] bg-[#0f1117] p-6">
            <h3 className="text-sm font-semibold text-[#e2e4ed] mb-5">Candidate Funnel</h3>
            <div className="space-y-3">
              {funnelData.map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7194] w-20 text-right">{stage.label}</span>
                  <div className="flex-1 h-6 rounded bg-[#0a0b0f] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${stage.pct}%` } : { width: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full rounded bg-[#5c7cfa]/60 flex items-center justify-end pr-2"
                    >
                      <span className="text-[10px] font-semibold text-white">{stage.value}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* KPI Cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {[
              { label: 'Screening Rate', value: '60.5%', icon: Activity, color: '#5c7cfa' },
              { label: 'Interview Rate', value: '13.5%', icon: Users, color: '#10b981' },
              { label: 'Avg. Time-to-Hire', value: '13.9d', icon: Zap, color: '#f59e0b' },
              { label: 'Hiring Rate', value: '2.7%', icon: Target, color: '#748ffc' },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 rounded-xl border border-[#1a1d26] bg-[#0f1117]">
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  <ArrowUpRight className="h-3 w-3 text-[#6b7194]" />
                </div>
                <p className="text-2xl font-extrabold text-[#e2e4ed]">{kpi.value}</p>
                <p className="text-xs text-[#6b7194] mt-1">{kpi.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Fairness
// ────────────────────────────────────────────

function FairnessSection() {
  return (
    <Section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-4 py-1.5 mb-6">
            <Scale className="h-4 w-4 text-[#f59e0b]" />
            <span className="text-xs font-medium text-[#f59e0b]">Responsible AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Fairness and transparency by design
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            Proactive bias monitoring, protected feature testing, and transparent scoring — so you can hire with confidence.
          </p>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fairnessItems.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="p-6 rounded-xl border border-[#1a1d26] bg-[#0f1117] hover:border-[#2c3046] transition-all duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 mb-4">
                <f.icon className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <h3 className="text-lg font-semibold text-[#e2e4ed] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6b7194] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Security
// ────────────────────────────────────────────

function SecuritySection() {
  return (
    <Section className="py-24 px-6" id="security">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/20 bg-[#10b981]/5 px-4 py-1.5 mb-6">
            <ShieldCheck className="h-4 w-4 text-[#10b981]" />
            <span className="text-xs font-medium text-[#10b981]">Enterprise Security</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Security built into every layer
          </h2>
          <p className="text-lg text-[#6b7194] max-w-2xl mx-auto">
            RBAC, input sanitization, prompt injection prevention, audit logging, and multi-tenant isolation.
          </p>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {securityItems.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="p-6 rounded-xl border border-[#1a1d26] bg-[#0f1117] hover:border-[#2c3046] transition-all duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 mb-4">
                <f.icon className="h-5 w-5 text-[#10b981]" />
              </div>
              <h3 className="text-lg font-semibold text-[#e2e4ed] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6b7194] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Final CTA
// ────────────────────────────────────────────

function FinalCTA() {
  return (
    <Section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div variants={scaleIn} className="rounded-2xl border border-[#1a1d26] bg-[#0f1117] p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#e2e4ed] mb-4">
            Build a smarter hiring workflow
          </h2>
          <p className="text-lg text-[#6b7194] mb-8 max-w-lg mx-auto">
            Start using AI-powered recruitment intelligence today.
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="min-w-[200px] h-12 px-8 text-base font-semibold">
              <Link to="/register">
                Explore TalentIQ
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 px-8 text-base">
              <Link to="/login">Sign in to demo</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-[#111318]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-brand">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gradient">TalentIQ</span>
          </div>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-[#6b7194] hover:text-[#b4b8cc] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#111318]">
          <p className="text-xs text-[#6b7194]">
            © 2024 TalentIQ. AI Recruitment Intelligence Platform.
          </p>
          <p className="text-[10px] text-[#6b7194]/60">
            Product metrics shown are illustrative. AI provides recommendations — recruiters make final decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────
// Main Export
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// Demo Animation Sequence
// ────────────────────────────────────────────

// Node IDs and their appearance timing in the demo sequence
// Each entry: [nodeId, startProgress 0→1]
const DEMO_SEQUENCE: [string, number][] = [
  // Core activates first (handled by AICore)
  // Candidates appear
  ['c1', 0.15], ['c2', 0.20], ['c3', 0.25], ['c4', 0.22], ['c5', 0.28], ['c6', 0.30],
  // Skills connect
  ['s1', 0.35], ['s2', 0.38], ['s3', 0.42], ['s4', 0.40], ['s5', 0.45], ['s6', 0.43],
  // Jobs appear
  ['j1', 0.55], ['j2', 0.58], ['j3', 0.62], ['j4', 0.60],
];

function useDemoAnimation() {
  const demoProgress = useRef(0);
  const demoNodeVisibility = useRef<{ [key: string]: number }>({});
  const demoAnimRef = useRef(0);
  const isPlaying = useRef(false);

  const startDemo = useCallback(() => {
    if (isPlaying.current) return;
    isPlaying.current = true;
    demoProgress.current = 0;
    // Reset all node visibility
    const vis: { [key: string]: number } = {};
    DEMO_SEQUENCE.forEach(([id]) => { vis[id] = 0; });
    demoNodeVisibility.current = vis;

    const DURATION = 3500; // 3.5 seconds
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      demoProgress.current = progress;

      // Update each node's visibility based on timing
      DEMO_SEQUENCE.forEach(([id, at]) => {
        const nodeProgress = Math.max(0, Math.min(1, (progress - at) / 0.12));
        demoNodeVisibility.current[id] = nodeProgress;
      });

      if (progress < 1) {
        demoAnimRef.current = requestAnimationFrame(tick);
      } else {
        // Hold for a beat, then fade out
        setTimeout(() => {
          const fadeOut = (now2: number) => {
            const fadeElapsed = now2 - (startTime + DURATION + 600);
            const fade = Math.max(0, 1 - fadeElapsed / 800);
            demoProgress.current = fade;
            if (fade > 0) {
              demoAnimRef.current = requestAnimationFrame(fadeOut);
            } else {
              demoProgress.current = 0;
              isPlaying.current = false;
            }
          };
          demoAnimRef.current = requestAnimationFrame(fadeOut);
        }, 600);
      }
    };

    demoAnimRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(demoAnimRef.current);
  }, []);

  return { demoProgress, demoNodeVisibility, startDemo };
}

export default function LandingPage() {
  const scrollProgress = useRef(0);
  const rafRef = useRef(0);
  const { demoProgress, demoNodeVisibility, startDemo } = useDemoAnimation();

  useEffect(() => {
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <Nav />
      <Hero
        scrollProgress={scrollProgress}
        demoProgress={demoProgress}
        demoNodeVisibility={demoNodeVisibility}
        onDemo={startDemo}
      />
      <MetricsBar />
      <PlatformSection />
      <AIIntelligence />
      <CandidateMatching />
      <RecruiterCopilot />
      <AnalyticsSection />
      <FairnessSection />
      <SecuritySection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
