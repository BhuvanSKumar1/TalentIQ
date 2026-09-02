export const employmentTypes = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
] as const;

export const experienceLevels = [
  { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
  { value: 'MID', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR', label: 'Senior (5-8 years)' },
  { value: 'LEAD', label: 'Lead (8+ years)' },
  { value: 'EXECUTIVE', label: 'Executive' },
] as const;

export const departments = [
  'Engineering', 'AI/ML', 'Infrastructure', 'Design',
  'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations',
];

export const commonSkills = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
  'Node.js', 'Express', 'Django', 'Spring Boot', 'Ruby on Rails',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'GraphQL', 'REST', 'gRPC', 'HTML', 'CSS', 'Tailwind CSS',
  'Vue.js', 'Angular', 'Svelte', 'Next.js',
  'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch',
  'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'SQL', 'Data Analysis', 'Tableau', 'Power BI',
  'Agile', 'Scrum', 'JIRA', 'Figma', 'Sketch',
];

export const educationOptions = [
  "Bachelor's degree",
  "Master's degree",
  'PhD',
  'Associate degree',
  'Bootcamp certification',
  'No degree required',
];
