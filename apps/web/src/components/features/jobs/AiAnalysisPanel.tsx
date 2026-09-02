import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Lightbulb, GraduationCap, Briefcase, Tag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface AiAnalysis {
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  experienceYears: string;
  education: string[];
  technicalKeywords: string[];
  softSkills: string[];
  confidence: number;
}

interface AiAnalysisPanelProps {
  analysis: AiAnalysis | null;
  onApply?: (data: Partial<AiAnalysis>) => void;
  isAnalyzing?: boolean;
}

export function AiAnalysisPanel({ analysis, onApply, isAnalyzing }: AiAnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <Card className="border-brand-600/20">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="h-12 w-12 rounded-full border-4 border-surface-300 border-t-brand-500 animate-spin" />
            <Brain className="absolute inset-0 m-auto h-5 w-5 text-brand-400" />
          </div>
          <p className="text-sm font-medium text-surface-950">Analyzing job description...</p>
          <p className="text-xs text-surface-600 mt-1">Extracting skills, requirements, and insights</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-dashed border-surface-400">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 border border-brand-600/20 mb-3">
            <Brain className="h-6 w-6 text-brand-400" />
          </div>
          <p className="text-sm font-medium text-surface-950 mb-1">AI Job Analysis</p>
          <p className="text-xs text-surface-600 max-w-xs">
            Paste a job description and click &quot;Analyze&quot; to extract skills, responsibilities, and requirements automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    {
      title: 'Required Skills',
      icon: Briefcase,
      items: analysis.requiredSkills,
      color: 'text-brand-400',
      bg: 'bg-brand-600/10 border-brand-600/20',
      badgeVariant: 'default' as const,
    },
    {
      title: 'Preferred Skills',
      icon: Lightbulb,
      items: analysis.preferredSkills,
      color: 'text-success-500',
      bg: 'bg-success-500/10 border-success-500/20',
      badgeVariant: 'success' as const,
    },
    {
      title: 'Technical Keywords',
      icon: Tag,
      items: analysis.technicalKeywords,
      color: 'text-info-500',
      bg: 'bg-info-500/10 border-info-500/20',
      badgeVariant: 'outline' as const,
    },
    {
      title: 'Soft Skills',
      icon: Users,
      items: analysis.softSkills,
      color: 'text-warning-500',
      bg: 'bg-warning-500/10 border-warning-500/20',
      badgeVariant: 'warning' as const,
    },
  ];

  return (
    <Card className="border-brand-600/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600/10 border border-brand-600/20">
              <Brain className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <CardTitle className="text-base">AI Analysis</CardTitle>
          </div>
          <Badge variant="outline" className="text-2xs">
            {Math.round(analysis.confidence * 100)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Experience & Education */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-surface-400 bg-surface-200/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="h-3.5 w-3.5 text-surface-600" />
              <span className="text-2xs font-medium text-surface-600">Experience</span>
            </div>
            <p className="text-sm font-semibold text-surface-950">{analysis.experienceLevel}</p>
            <p className="text-2xs text-surface-600">{analysis.experienceYears} years</p>
          </div>
          <div className="rounded-lg border border-surface-400 bg-surface-200/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <GraduationCap className="h-3.5 w-3.5 text-surface-600" />
              <span className="text-2xs font-medium text-surface-600">Education</span>
            </div>
            {analysis.education.map((edu, i) => (
              <p key={i} className="text-sm font-semibold text-surface-950">{edu}</p>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        {analysis.responsibilities.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-surface-800 mb-2">Key Responsibilities</h4>
            <ul className="space-y-1.5">
              {analysis.responsibilities.slice(0, 5).map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-xs text-surface-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mt-0.5 shrink-0" />
                  <span>{r}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Skill badges */}
        {sections.map((section) => section.items.length > 0 && (
          <div key={section.title}>
            <div className="flex items-center gap-1.5 mb-2">
              <section.icon className={cn('h-3.5 w-3.5', section.color)} />
              <h4 className="text-xs font-semibold text-surface-800">{section.title}</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {section.items.map(skill => (
                <Badge key={skill} variant={section.badgeVariant} className="text-2xs">{skill}</Badge>
              ))}
            </div>
          </div>
        ))}

        {/* Apply button */}
        {onApply && (
          <button
            onClick={() => onApply(analysis)}
            className="w-full rounded-lg border border-brand-600/30 bg-brand-600/5 p-2.5 text-sm font-medium text-brand-400 hover:bg-brand-600/10 transition-colors"
          >
            Apply to job form
          </button>
        )}
      </CardContent>
    </Card>
  );
}
