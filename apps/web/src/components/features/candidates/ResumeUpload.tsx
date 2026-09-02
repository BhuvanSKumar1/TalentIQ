import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSearch, Scan, Brain, User, Dna, CheckCircle, AlertCircle,
  X, RotateCw, FileText, File, Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { PIPELINE_STAGES, getStageIndex, getStatusColor, FILE_TYPE_INFO } from './data';

const ICON_MAP: Record<string, React.ElementType> = {
  Upload, FileSearch, Scan, Brain, User, Dna, CheckCircle, AlertCircle,
};

interface UploadEntry {
  id: string;
  file: File;
  resumeId?: string;
  candidateId?: string;
  status: string;
  error?: string;
  progress: number;
}

interface ResumeUploadProps {
  onUploadComplete?: (resumeId: string, candidateId: string) => void;
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploads: UploadEntry[] = fileArray.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: 'UPLOADED',
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading each file
    newUploads.forEach(entry => uploadFile(entry));
  }, []);

  const uploadFile = async (entry: UploadEntry) => {
    const formData = new FormData();
    formData.append('resume', entry.file);

    try {
      updateUpload(entry.id, { status: 'PARSING', progress: 10 });

      const response = await fetch('/api/v1/resumes/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Upload failed');
      }

      const data = await response.json();
      updateUpload(entry.id, {
        resumeId: data.resume.id,
        candidateId: data.candidate.id,
        status: data.resume.processingStatus,
        progress: 20,
      });

      // Poll for processing status
      pollStatus(entry.id, data.resume.id);
    } catch (error) {
      updateUpload(entry.id, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Upload failed',
        progress: 0,
      });
    }
  };

  const pollStatus = async (entryId: string, resumeId: string) => {
    const maxAttempts = 30;
    let attempt = 0;

    const poll = async () => {
      attempt++;
      if (attempt > maxAttempts) return;

      try {
        const response = await fetch(`/api/v1/resumes/${resumeId}/status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const stageIndex = getStageIndex(data.status);
        const progress = Math.min(95, (stageIndex / (PIPELINE_STAGES.length - 1)) * 100);

        updateUpload(entryId, {
          status: data.status,
          error: data.error,
          progress,
        });

        if (data.status === 'READY') {
          updateUpload(entryId, { progress: 100 });
          onUploadComplete?.(resumeId, data.candidate.id);
          return;
        }

        if (data.status === 'FAILED') {
          return;
        }

        setTimeout(poll, 1000);
      } catch {
        setTimeout(poll, 2000);
      }
    };

    setTimeout(poll, 500);
  };

  const updateUpload = (id: string, updates: Partial<UploadEntry>) => {
    setUploads(prev =>
      prev.map(u => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const retryUpload = (id: string) => {
    const entry = uploads.find(u => u.id === id);
    if (entry?.resumeId) {
      updateUpload(id, { status: 'UPLOADED', progress: 0, error: undefined });
      fetch(`/api/v1/resumes/${entry.resumeId}/retry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }).then(() => {
        if (entry.resumeId) pollStatus(id, entry.resumeId);
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-danger-500" />;
    if (ext === 'docx') return <File className="h-5 w-5 text-brand-400" />;
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <Image className="h-5 w-5 text-warning-500" />;
    return <FileText className="h-5 w-5 text-surface-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-brand-500 bg-brand-600/5 scale-[1.02]'
            : 'border-surface-400 bg-surface-100 hover:border-brand-400 hover:bg-brand-600/5',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <motion.div
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl mb-4 transition-colors',
            isDragging ? 'bg-brand-600/20' : 'bg-surface-200',
          )}
        >
          <Upload className={cn('h-7 w-7', isDragging ? 'text-brand-400' : 'text-surface-600')} />
        </motion.div>

        <p className="text-sm font-medium text-surface-950 mb-1">
          {isDragging ? 'Drop resumes here' : 'Drag & drop resumes'}
        </p>
        <p className="text-xs text-surface-600">
          PDF, DOCX, TXT, PNG, JPG — up to 10MB each
        </p>
        <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
          Browse Files
        </Button>
      </div>

      {/* Upload queue */}
      <AnimatePresence mode="popLayout">
        {uploads.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                {/* File header */}
                <div className="flex items-center gap-3 mb-3">
                  {getFileIcon(entry.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-950 truncate">
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-surface-600">
                      {(entry.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {entry.status === 'FAILED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => retryUpload(entry.id)}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeUpload(entry.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                {entry.status !== 'FAILED' && entry.status !== 'READY' && (
                  <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full bg-brand-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                )}

                {/* Processing timeline */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {PIPELINE_STAGES.filter(s => s.key !== 'FAILED').map((stage, i) => {
                    const currentIdx = getStageIndex(entry.status);
                    const stageIdx = i;
                    const isComplete = stageIdx < currentIdx;
                    const isCurrent = stage.key === entry.status;
                    const isFailed = entry.status === 'FAILED' && stage.key === 'GENERATING_EMBEDDING';
                    const Icon = ICON_MAP[stage.icon] || CheckCircle;

                    return (
                      <React.Fragment key={stage.key}>
                        <div className="flex flex-col items-center gap-1 min-w-[52px]">
                          <motion.div
                            initial={false}
                            animate={{
                              scale: isCurrent ? 1.1 : 1,
                            }}
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                              isComplete && 'bg-success-500/10 border-success-500/30 text-success-500',
                              isCurrent && !isFailed && 'bg-brand-600/10 border-brand-500 text-brand-400 animate-pulse',
                              isFailed && 'bg-danger-500/10 border-danger-500/30 text-danger-500',
                              !isComplete && !isCurrent && !isFailed && 'bg-surface-100 border-surface-300 text-surface-500',
                            )}
                          >
                            {isComplete ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Icon className="h-3.5 w-3.5" />
                            )}
                          </motion.div>
                          <span className={cn(
                            'text-2xs font-medium whitespace-nowrap',
                            isComplete && 'text-success-500',
                            isCurrent && !isFailed && 'text-brand-400',
                            isFailed && 'text-danger-500',
                            !isComplete && !isCurrent && !isFailed && 'text-surface-500',
                          )}>
                            {stage.label}
                          </span>
                        </div>
                        {i < PIPELINE_STAGES.filter(s => s.key !== 'FAILED').length - 1 && (
                          <div className={cn(
                            'h-px w-4 mt-[-12px]',
                            isComplete ? 'bg-success-500/30' : 'bg-surface-300',
                          )} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Status text */}
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium',
                    getStatusColor(entry.status),
                  )}>
                    {entry.status === 'READY' ? '✓ Complete' :
                     entry.status === 'FAILED' ? '✗ Failed' :
                     `Processing... ${Math.round(entry.progress)}%`}
                  </span>
                  {entry.error && (
                    <span className="text-2xs text-danger-500 truncate">{entry.error}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
