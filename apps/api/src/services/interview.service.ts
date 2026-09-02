import { PrismaClient, InterviewType, InterviewStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface InterviewCreate {
  candidateId: string;
  jobId: string;
  type?: InterviewType;
  scheduledAt: string | Date;
  duration?: number;
  location?: string;
  notes?: string;
  interviewerId?: string;
}

interface FeedbackCreate {
  interviewId: string;
  rating: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation?: 'advance' | 'reject' | 'maybe';
}

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  context: string;
  expectedPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
}

interface InterviewSummary {
  interviewId: string;
  candidateName: string;
  jobTitle: string;
  type: string;
  status: string;
  scheduledAt: Date;
  interviewer?: string;
  feedback?: {
    rating: number;
    strengths: string;
    weaknesses: string;
    recommendation: string;
  };
  generatedQuestions: InterviewQuestion[];
  aiSummary?: string;
}

// ============================================================
// CRUD Operations
// ============================================================

export async function createInterview(data: InterviewCreate, userId?: string) {
  const interview = await prisma.interview.create({
    data: {
      candidateId: data.candidateId,
      jobId: data.jobId,
      type: (data.type || 'TECHNICAL') as InterviewType,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 60,
      location: data.location,
      notes: data.notes,
      interviewerId: data.interviewerId,
    },
    include: {
      candidate: true,
      job: true,
      interviewer: true,
    },
  });

  // Audit log (skip if no valid userId)
  if (userId) {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: interview.job.organizationId,
        action: 'INTERVIEW_SCHEDULED',
        entityType: 'Interview',
        entityId: interview.id,
        metadata: {
          candidateId: data.candidateId,
          jobId: data.jobId,
          type: interview.type,
          scheduledAt: interview.scheduledAt,
        },
      },
    });
  }

  return interview;
}

export async function getInterviews(organizationId: string, filters?: {
  jobId?: string;
  candidateId?: string;
  status?: string;
  upcoming?: boolean;
}) {
  const where: any = {
    job: { organizationId },
  };

  if (filters?.jobId) where.jobId = filters.jobId;
  if (filters?.candidateId) where.candidateId = filters.candidateId;
  if (filters?.status) where.status = filters.status;
  if (filters?.upcoming) where.scheduledAt = { gte: new Date() };

  const interviews = await prisma.interview.findMany({
    where,
    include: {
      candidate: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      job: {
        select: { id: true, title: true, department: true }
      },
      interviewer: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      feedback: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });

  return interviews;
}

export async function getInterviewById(id: string) {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      candidate: {
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
          projects: true,
        }
      },
      job: {
        include: {
          skills: { include: { skill: true } }
        }
      },
      interviewer: true,
      feedback: true,
    },
  });

  return interview;
}

export async function updateInterviewStatus(id: string, status: InterviewStatus, userId: string) {
  const interview = await prisma.interview.update({
    where: { id },
    data: { status },
    include: {
      candidate: true,
      job: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      organizationId: interview.job.organizationId,
      action: `INTERVIEW_${status}`,
      entityType: 'Interview',
      entityId: id,
      metadata: { previousStatus: 'unknown', newStatus: status },
    },
  });

  return interview;
}

export async function submitFeedback(data: FeedbackCreate, userId: string) {
  const feedback = await prisma.interviewFeedback.create({
    data: {
      interviewId: data.interviewId,
      rating: data.rating,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      notes: data.notes,
      recommendation: data.recommendation,
    },
  });

  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    include: { job: true },
  });

  // Audit log
  if (interview) {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: interview.job.organizationId,
        action: 'INTERVIEW_FEEDBACK_SUBMITTED',
        entityType: 'InterviewFeedback',
        entityId: feedback.id,
        metadata: {
          interviewId: data.interviewId,
          rating: data.rating,
          recommendation: data.recommendation,
        },
      },
    });
  }

  return feedback;
}

// ============================================================
// AI Question Generation
// ============================================================

export async function generateInterviewQuestions(
  interviewId: string,
  categories?: string[]
): Promise<InterviewQuestion[]> {
  const interviewRaw = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      candidate: {
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
          projects: true,
        }
      },
      job: {
        include: {
          skills: { include: { skill: true } }
        }
      },
      interviewer: true,
      feedback: true,
    },
  });
  if (!interviewRaw) throw new Error('Interview not found');

  const candidate = interviewRaw.candidate;
  const job = interviewRaw.job;
  const selectedCategories = categories || ['technical', 'behavioral', 'system_design', 'project'];

  const questions: InterviewQuestion[] = [];
  let questionId = 1;

  for (const category of selectedCategories) {
    const categoryQuestions = generateQuestionsForCategory(
      category,
      candidate,
      job,
      questionId
    );
    questions.push(...categoryQuestions);
    questionId += categoryQuestions.length;
  }

  // Audit log
  if (interviewRaw.interviewerId) {
    await prisma.auditLog.create({
      data: {
        actorId: interviewRaw.interviewerId,
        organizationId: job.organizationId,
        action: 'INTERVIEW_QUESTIONS_GENERATED',
        entityType: 'Interview',
        entityId: interviewId,
        metadata: {
          categories: selectedCategories,
          questionCount: questions.length,
        },
      },
    });
  }

  return questions;
}

function generateQuestionsForCategory(
  category: string,
  candidate: any,
  job: any,
  startId: number
): InterviewQuestion[] {
  const candidateSkills = candidate.skills?.map((s: any) => s.skill.name) || [];
  const jobSkills = job.skills?.map((s: any) => s.skill.name) || [];
  const commonSkills = candidateSkills.filter((s: string) => jobSkills.includes(s));
  const candidateProjects = candidate.projects?.map((p: any) => p.name || 'project') || [];
  const candidateExperience = candidate.experiences?.map((e: any) => ({
    title: e.title,
    company: e.company,
  })) || [];

  const questions: InterviewQuestion[] = [];

  switch (category) {
    case 'technical':
      // Generate technical questions based on common skills
      if (commonSkills.length > 0) {
        questions.push({
          id: `q-${startId}`,
          category: 'Technical',
          question: `Can you walk me through how you would design a scalable ${commonSkills[0]} application?`,
          context: `Based on candidate's ${commonSkills[0]} experience and job requirement`,
          expectedPoints: ['Architecture decisions', 'Scalability patterns', 'Performance considerations'],
          difficulty: 'hard',
          timeEstimate: '15 min',
        });
        if (commonSkills.length > 1) {
          questions.push({
            id: `q-${startId + 1}`,
            category: 'Technical',
            question: `How do you handle error handling and edge cases when working with ${commonSkills[1]}?`,
            context: `Testing depth of ${commonSkills[1]} knowledge`,
            expectedPoints: ['Error patterns', 'Edge case identification', 'Testing strategies'],
            difficulty: 'medium',
            timeEstimate: '10 min',
          });
        }
      }
      // Generic technical questions
      questions.push({
        id: `q-${startId + questions.length}`,
        category: 'Technical',
        question: 'Describe a time when you had to optimize code for performance. What was the bottleneck and how did you fix it?',
        context: 'Assessing problem-solving and optimization skills',
        expectedPoints: ['Problem identification', 'Optimization approach', 'Measurable results'],
        difficulty: 'medium',
        timeEstimate: '10 min',
      });
      break;

    case 'behavioral':
      questions.push({
        id: `q-${startId}`,
        category: 'Behavioral',
        question: 'Tell me about a time you had a disagreement with a team member. How did you resolve it?',
        context: 'Assessing conflict resolution and teamwork',
        expectedPoints: ['Situation description', 'Resolution approach', 'Learning outcome'],
        difficulty: 'easy',
        timeEstimate: '8 min',
      });
      questions.push({
        id: `q-${startId + 1}`,
        category: 'Behavioral',
        question: 'Describe a project where you had to learn a new technology quickly. How did you approach it?',
        context: 'Assessing learning ability and adaptability',
        expectedPoints: ['Learning strategy', 'Time management', 'Application of new knowledge'],
        difficulty: 'easy',
        timeEstimate: '8 min',
      });
      questions.push({
        id: `q-${startId + 2}`,
        category: 'Behavioral',
        question: 'How do you prioritize tasks when working on multiple projects with tight deadlines?',
        context: 'Assessing time management and prioritization',
        expectedPoints: ['Prioritization framework', 'Communication', 'Delivery focus'],
        difficulty: 'easy',
        timeEstimate: '6 min',
      });
      break;

    case 'system_design':
      questions.push({
        id: `q-${startId}`,
        category: 'System Design',
        question: `Design a real-time collaboration feature for a ${job.department || 'software'} application. How would you handle concurrent edits?`,
        context: 'Testing system design and distributed systems knowledge',
        expectedPoints: ['Architecture overview', 'Conflict resolution', 'Scalability plan'],
        difficulty: 'hard',
        timeEstimate: '20 min',
      });
      questions.push({
        id: `q-${startId + 1}`,
        category: 'System Design',
        question: 'How would you design a notification system that handles millions of users?',
        context: 'Testing scalability and message queue knowledge',
        expectedPoints: ['Message queuing', 'Delivery guarantees', 'Performance optimization'],
        difficulty: 'hard',
        timeEstimate: '15 min',
      });
      break;

    case 'project':
      if (candidateProjects.length > 0) {
        questions.push({
          id: `q-${startId}`,
          category: 'Project',
          question: `Tell me about the "${candidateProjects[0]}" project. What was your role and what challenges did you face?`,
          context: `Based on candidate's project: ${candidateProjects[0]}`,
          expectedPoints: ['Role clarity', 'Technical challenges', 'Solution approach'],
          difficulty: 'medium',
          timeEstimate: '10 min',
        });
      }
      if (candidateExperience.length > 0) {
        questions.push({
          id: `q-${startId + 1}`,
          category: 'Project',
          question: `At ${candidateExperience[0].company}, what was the most impactful feature you built? How did you measure its success?`,
          context: `Based on candidate's experience at ${candidateExperience[0].company}`,
          expectedPoints: ['Impact description', 'Metrics used', 'Technical decisions'],
          difficulty: 'medium',
          timeEstimate: '10 min',
        });
      }
      questions.push({
        id: `q-${startId + 2}`,
        category: 'Project',
        question: 'Describe a project where the requirements changed significantly mid-development. How did you adapt?',
        context: 'Testing adaptability and project management skills',
        expectedPoints: ['Adaptation strategy', 'Communication', 'Delivery outcome'],
        difficulty: 'medium',
        timeEstimate: '8 min',
      });
      break;
  }

  return questions;
}

// ============================================================
// Interview Summary
// ============================================================

export async function getInterviewSummary(interviewId: string): Promise<InterviewSummary> {
  const interviewData = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      candidate: {
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
          projects: true,
        }
      },
      job: {
        include: {
          skills: { include: { skill: true } }
        }
      },
      interviewer: true,
      feedback: true,
    },
  });
  if (!interviewData) throw new Error('Interview not found');

  // Generate questions for summary
  const questions = await generateInterviewQuestions(interviewId);

  // Build summary
  const feedback = interviewData.feedback?.[0];
  const summary: InterviewSummary = {
    interviewId,
    candidateName: `${interviewData.candidate.firstName} ${interviewData.candidate.lastName}`,
    jobTitle: interviewData.job.title,
    type: interviewData.type,
    status: interviewData.status,
    scheduledAt: interviewData.scheduledAt,
    interviewer: interviewData.interviewer
      ? `${interviewData.interviewer.firstName} ${interviewData.interviewer.lastName}`
      : undefined,
    feedback: feedback ? {
      rating: feedback.rating || 0,
      strengths: feedback.strengths || '',
      weaknesses: feedback.weaknesses || '',
      recommendation: feedback.recommendation || 'pending',
    } : undefined,
    generatedQuestions: questions,
    aiSummary: generateAISummary(interviewData, questions, feedback),
  };

  return summary;
}

function generateAISummary(interview: any, questions: InterviewQuestion[], feedback: any): string {
  const candidate = interview.candidate;
  const job = interview.job;
  const candidateSkills = candidate.skills?.map((s: any) => s.skill.name) || [];
  const jobSkills = job.skills?.map((s: any) => s.skill.name) || [];
  const matchingSkills = candidateSkills.filter((s: string) => jobSkills.includes(s));

  let summary = `Interview Summary for ${candidate.firstName} ${candidate.lastName} for the ${job.title} position.\n\n`;

  summary += `Scheduled: ${interview.scheduledAt.toLocaleDateString()} | Type: ${interview.type} | Status: ${interview.status}\n\n`;

  if (matchingSkills.length > 0) {
    summary += `Key Skills to Assess: ${matchingSkills.join(', ')}\n`;
  }

  summary += `\nGenerated ${questions.length} questions across ${new Set(questions.map(q => q.category)).size} categories.\n`;

  if (feedback) {
    summary += `\nFeedback: Rating ${feedback.rating}/5\n`;
    if (feedback.recommendation) {
      summary += `Recommendation: ${feedback.recommendation.toUpperCase()}\n`;
    }
    if (feedback.strengths) {
      summary += `Strengths: ${feedback.strengths}\n`;
    }
    if (feedback.weaknesses) {
      summary += `Areas for improvement: ${feedback.weaknesses}\n`;
    }
  } else {
    summary += `\nNo feedback submitted yet.\n`;
  }

  summary += `\nNote: This summary is for interview preparation purposes only. Final hiring decisions should be made by the hiring team based on complete evaluation.`;

  return summary;
}
