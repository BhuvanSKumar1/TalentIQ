import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Save, Eye, Send, Sparkles, Briefcase, FileText,
  Wrench, Star, GraduationCap, CheckCircle, Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SkillPicker } from './SkillPicker';
import { AiAnalysisPanel } from './AiAnalysisPanel';
import { jobSchema, defaultJobValues, type JobFormData } from './jobSchemas';
import { employmentTypes, experienceLevels, departments, commonSkills, educationOptions } from './data';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/components/ui/toast';

const steps = [
  { label: 'Basic Info', icon: Briefcase },
  { label: 'Description', icon: FileText },
  { label: 'Required Skills', icon: Wrench },
  { label: 'Preferred Skills', icon: Star },
  { label: 'Experience', icon: GraduationCap },
  { label: 'Preview', icon: Eye },
  { label: 'Publish', icon: Send },
];

interface JobWizardProps {
  initialData?: Partial<JobFormData>;
  jobId?: string;
  isEditing?: boolean;
}

export function JobWizard({ initialData, jobId, isEditing }: JobWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { ...defaultJobValues, ...initialData },
    mode: 'onChange',
  });

  const { watch, setValue, formState: { errors } } = form;
  const formData = watch();

  const canGoNext = () => {
    if (step === 0) return !!formData.title;
    return true;
  };

  const goNext = () => { if (canGoNext() && step < steps.length - 1) setStep(step + 1); };
  const goPrev = () => { if (step > 0) setStep(step - 1); };

  const handleAnalyze = async () => {
    if (!formData.description) return;
    setIsAnalyzing(true);
    try {
      const { data } = await api.post('/jobs/analyze', { description: formData.description });
      setAnalysis(data);
    } catch {
      toast.error('Failed to analyze job description');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAnalysis = (data: any) => {
    if (data.requiredSkills?.length) setValue('requiredSkills', data.requiredSkills, { shouldValidate: true });
    if (data.preferredSkills?.length) setValue('preferredSkills', data.preferredSkills, { shouldValidate: true });
    if (data.experienceLevel) setValue('experienceLevel', data.experienceLevel, { shouldValidate: true });
    if (data.education?.length) setValue('education', data.education, { shouldValidate: true });
    toast.success('Analysis applied to form');
    setStep(2); // Go to required skills step
  };

  const onSubmit = async (data: JobFormData, status?: string) => {
    setIsSaving(true);
    try {
      const payload = { ...data, status: status || data.status };
      if (isEditing && jobId) {
        await api.put(`/jobs/${jobId}`, payload);
        toast.success('Job updated successfully');
      } else {
        const { data: created } = await api.post('/jobs', payload);
        toast.success('Job created successfully');
        navigate(`/jobs/${created.id}`);
        return;
      }
      navigate('/jobs');
    } catch {
      toast.error('Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Basic Info
        return (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">Job Title *</label>
              <Input placeholder="e.g. Senior Full-Stack Engineer" {...form.register('title')} />
              {errors.title && <p className="mt-1 text-xs text-danger-500">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Department</label>
                <Select value={formData.department || ''} onValueChange={v => setValue('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Location</label>
                <Input placeholder="e.g. San Francisco, CA or Remote" {...form.register('location')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Employment Type</label>
                <Select value={formData.employmentType} onValueChange={v => setValue('employmentType', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Experience Level</label>
                <Select value={formData.experienceLevel || ''} onValueChange={v => setValue('experienceLevel', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Salary Min ($)</label>
                <Input type="number" placeholder="e.g. 120000" {...form.register('salaryMin')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-900">Salary Max ($)</label>
                <Input type="number" placeholder="e.g. 180000" {...form.register('salaryMax')} />
              </div>
            </div>
          </div>
        );

      case 1: // Description
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-surface-900">Job Description</label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAnalyze} disabled={isAnalyzing || !formData.description}>
                  {isAnalyzing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
              </div>
              <Textarea
                placeholder="Paste the full job description here..."
                className="min-h-[200px] font-mono text-sm"
                {...form.register('description')}
              />
              <p className="mt-1 text-2xs text-surface-600">
                AI will extract skills, responsibilities, and requirements from this text.
              </p>
            </div>
            <AiAnalysisPanel
              analysis={analysis}
              onApply={handleApplyAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </div>
        );

      case 2: // Required Skills
        return (
          <SkillPicker
            label="Required Skills"
            selected={formData.requiredSkills}
            onChange={v => setValue('requiredSkills', v, { shouldValidate: true })}
            suggestions={commonSkills}
            maxSkills={15}
            placeholder="Add required skills..."
          />
        );

      case 3: // Preferred Skills
        return (
          <SkillPicker
            label="Preferred Skills"
            selected={formData.preferredSkills}
            onChange={v => setValue('preferredSkills', v, { shouldValidate: true })}
            suggestions={commonSkills.filter(s => !formData.requiredSkills.includes(s))}
            maxSkills={10}
            placeholder="Add preferred skills..."
          />
        );

      case 4: // Experience & Education
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-surface-900">Education Requirements</label>
              <div className="space-y-2">
                {educationOptions.map(edu => (
                  <label key={edu} className="flex items-center gap-3 p-3 rounded-lg border border-surface-400 hover:bg-surface-200 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.education.includes(edu)}
                      onChange={(e) => {
                        const current = formData.education;
                        if (e.target.checked) {
                          setValue('education', [...current, edu], { shouldValidate: true });
                        } else {
                          setValue('education', current.filter(e => e !== edu), { shouldValidate: true });
                        }
                      }}
                      className="h-4 w-4 rounded border-surface-400 bg-surface-200 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-surface-900">{edu}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Preview
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-surface-400 bg-surface-200/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-surface-950">{formData.title || 'Untitled Job'}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {formData.department && <span className="text-sm text-surface-600">{formData.department}</span>}
                    {formData.location && <span className="text-sm text-surface-600">• {formData.location}</span>}
                    {formData.employmentType && (
                      <span className="text-sm text-surface-600">• {employmentTypes.find(t => t.value === formData.employmentType)?.label}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-brand-400">
                  {formData.salaryMin && formData.salaryMax
                    ? `$${(formData.salaryMin / 1000).toFixed(0)}k - $${(formData.salaryMax / 1000).toFixed(0)}k`
                    : 'Salary not specified'}
                </span>
              </div>

              {formData.description && (
                <p className="text-sm text-surface-700 whitespace-pre-wrap mb-4">{formData.description}</p>
              )}

              {formData.requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-surface-800 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.requiredSkills.map(s => (
                      <span key={s} className="inline-flex items-center rounded-full bg-brand-600/10 px-2.5 py-0.5 text-2xs font-medium text-brand-400 border border-brand-600/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.preferredSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-surface-800 mb-2">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.preferredSkills.map(s => (
                      <span key={s} className="inline-flex items-center rounded-full bg-success-500/10 px-2.5 py-0.5 text-2xs font-medium text-success-500 border border-success-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.education.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-800 mb-2">Education</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.education.map(e => (
                      <span key={e} className="inline-flex items-center rounded-full bg-surface-300 px-2.5 py-0.5 text-2xs font-medium text-surface-800">{e}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Publish
        return (
          <div className="space-y-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-500/10 border border-success-500/20 mx-auto">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-950 mb-1">Ready to publish?</h3>
              <p className="text-sm text-surface-600">
                Your job &quot;{formData.title}&quot; will be visible to candidates.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" variant="secondary" onClick={() => onSubmit(formData, 'DRAFT')} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save as Draft
              </Button>
              <Button type="button" onClick={() => onSubmit(formData, 'PUBLISHED')} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Publish Job
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      {/* Step sidebar */}
      <nav className="hidden lg:block">
        <div className="sticky top-24 space-y-1">
          {steps.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                i === step
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                  : i < step
                    ? 'text-surface-600 hover:text-surface-950 border border-transparent'
                    : 'text-surface-500 border border-transparent'
              )}
            >
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-success-500/10 text-success-500 border border-success-500/20' : 'bg-surface-300 text-surface-600'
              )}>
                {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile step indicator */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button key={s.label} type="button" onClick={() => setStep(i)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all shrink-0',
              i === step ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                : i < step ? 'bg-success-500/10 text-success-500 border border-success-500/20'
                  : 'bg-surface-200 text-surface-600 border border-surface-300'
            )}>
            {i < step ? <CheckCircle className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
            {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              {(() => { const StepIcon = steps[step].icon; return <StepIcon className="h-5 w-5 text-brand-400" />; })()}
              {steps[step].label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {step < steps.length - 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-300">
                <Button type="button" variant="ghost" onClick={goPrev} disabled={step === 0}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={goNext} disabled={!canGoNext()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
