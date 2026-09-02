/**
 * Processing pipeline stages for resume intelligence
 */
export const PIPELINE_STAGES = [
  { key: 'UPLOADED', label: 'Uploaded', icon: 'Upload', description: 'File received successfully' },
  { key: 'PARSING', label: 'Parsing', icon: 'FileSearch', description: 'Extracting text from document' },
  { key: 'EXTRACTING', label: 'Extracting', icon: 'Scan', description: 'Identifying sections and entities' },
  { key: 'DETECTING_SKILLS', label: 'Detecting Skills', icon: 'Brain', description: 'Matching technical and soft skills' },
  { key: 'BUILDING_PROFILE', label: 'Building Profile', icon: 'User', description: 'Structuring candidate data' },
  { key: 'GENERATING_EMBEDDING', label: 'Generating Embedding', icon: 'Dna', description: 'Creating semantic vector for search' },
  { key: 'READY', label: 'Ready', icon: 'CheckCircle', description: 'Profile ready for matching' },
  { key: 'FAILED', label: 'Failed', icon: 'AlertCircle', description: 'Processing failed' },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]['key'];

/**
 * Get the index of a pipeline stage
 */
export function getStageIndex(status: string): number {
  return PIPELINE_STAGES.findIndex(s => s.key === status);
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'READY':
      return 'text-success-500 bg-success-500/10 border-success-500/20';
    case 'FAILED':
      return 'text-danger-500 bg-danger-500/10 border-danger-500/20';
    case 'UPLOADED':
      return 'text-surface-600 bg-surface-200 border-surface-300';
    default:
      return 'text-brand-400 bg-brand-600/10 border-brand-600/20';
  }
}

/**
 * File type display info
 */
export const FILE_TYPE_INFO: Record<string, { label: string; color: string }> = {
  pdf: { label: 'PDF', color: 'text-danger-500 bg-danger-500/10' },
  docx: { label: 'DOCX', color: 'text-brand-400 bg-brand-600/10' },
  txt: { label: 'TXT', color: 'text-surface-600 bg-surface-200' },
  image: { label: 'IMG', color: 'text-warning-500 bg-warning-500/10' },
};
