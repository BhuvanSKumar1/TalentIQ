import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Briefcase, CheckCircle2, AlertCircle,
  Plus, ChevronDown, ChevronRight, MessageSquare, Star, Brain,
  Video, MapPin, Play, Send, X, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SCHEDULED: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Scheduled' },
  IN_PROGRESS: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'In Progress' },
  COMPLETED: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Cancelled' },
  NO_SHOW: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'No Show' },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  TECHNICAL: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
  BEHAVIORAL: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  SYSTEM_DESIGN: { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  CULTURAL: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
  FINAL: { color: 'text-pink-400', bg: 'bg-pink-500/20' },
};

const RECOMMENDATION_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  advance: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Advance' },
  reject: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Reject' },
  maybe: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Maybe' },
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'schedule' | 'detail'>('timeline');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 4,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: 'advance',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // New interview form
  const [newInterview, setNewInterview] = useState({
    candidateId: '',
    jobId: '',
    type: 'TECHNICAL',
    scheduledAt: '',
    duration: 60,
    location: '',
    notes: '',
    interviewerId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [intRes, cRes, jRes, uRes] = await Promise.all([
        api.get('/interviews'),
        api.get('/candidates?limit=100'),
        api.get('/jobs?limit=100'),
        api.get('/auth/me').catch(() => ({ data: null })),
      ]);
      setInterviews(intRes.data?.data || []);
      setCandidates(cRes.data?.data || []);
      setJobs(jRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async () => {
    try {
      await api.post('/interviews', newInterview);
      setShowScheduleForm(false);
      setNewInterview({
        candidateId: '', jobId: '', type: 'TECHNICAL',
        scheduledAt: '', duration: 60, location: '', notes: '', interviewerId: '',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    }
  };

  const viewInterview = async (id: string) => {
    try {
      const res = await api.get(`/interviews/${id}`);
      setSelectedInterview(res.data?.data || null);
      setActiveTab('detail');
      setGeneratedQuestions([]);
      setSummary(null);
    } catch (err) {
      console.error('Failed to load interview:', err);
    }
  };

  const generateQuestions = async (interviewId: string) => {
    setQuestionLoading(true);
    try {
      const res = await api.post(`/interviews/${interviewId}/questions`, {
        categories: ['technical', 'behavioral', 'system_design', 'project'],
      });
      setGeneratedQuestions(res.data?.data || []);
    } catch (err) {
      console.error('Failed to generate questions:', err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const getSummary = async (interviewId: string) => {
    try {
      const res = await api.get(`/interviews/${interviewId}/summary`);
      setSummary(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const submitFeedback = async (interviewId: string) => {
    setFeedbackSubmitting(true);
    try {
      await api.post('/interviews/feedback', {
        interviewId,
        ...feedbackForm,
      });
      setFeedbackForm({ rating: 4, strengths: '', weaknesses: '', notes: '', recommendation: 'advance' });
      viewInterview(interviewId);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/interviews/${id}/status`, { status });
      fetchData();
      if (selectedInterview?.id === id) {
        viewInterview(id);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Interview Intelligence</h1>
          </div>
          <p className="text-sm text-gray-400 ml-13">Schedule, manage, and analyze candidate interviews</p>
        </div>
        <button
          onClick={() => setShowScheduleForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Interview Timeline
        </button>
        {selectedInterview && (
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'detail' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Interview Detail
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Interviews Scheduled</h3>
                  <p className="text-sm text-gray-400 mb-4">Start scheduling interviews for your candidates.</p>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Schedule First Interview
                  </button>
                </div>
              ) : (
                interviews.map((interview, i) => {
                  const statusConfig = STATUS_CONFIG[interview.status] || STATUS_CONFIG.SCHEDULED;
                  const typeConfig = TYPE_CONFIG[interview.type] || TYPE_CONFIG.TECHNICAL;

                  return (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => viewInterview(interview.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {interview.candidate?.firstName?.[0]}{interview.candidate?.lastName?.[0]}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {interview.candidate?.firstName} {interview.candidate?.lastName}
                            </h3>
                            <p className="text-sm text-gray-400">{interview.job?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDate(interview.scheduledAt)}
                            </div>
                            {interview.interviewer && (
                              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <User className="w-4 h-4" />
                                {interview.interviewer.firstName} {interview.interviewer.lastName}
                              </div>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                            {interview.type?.replace('_', ' ')}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {interview.feedback?.length > 0 && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= (interview.feedback[0]?.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                />
                              ))}
                            </div>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* Detail Tab */}
          {activeTab === 'detail' && selectedInterview && (
            <div className="space-y-6">
              {/* Interview Header */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {selectedInterview.candidate?.firstName?.[0]}{selectedInterview.candidate?.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedInterview.candidate?.firstName} {selectedInterview.candidate?.lastName}
                      </h2>
                      <p className="text-gray-400">{selectedInterview.job?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => (
                      <button
                        key={status}
                        onClick={(e) => { e.stopPropagation(); updateStatus(selectedInterview.id, status); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedInterview.status === status
                            ? `${STATUS_CONFIG[status]?.bg} ${STATUS_CONFIG[status]?.color}`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {STATUS_CONFIG[status]?.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedInterview.scheduledAt)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    {selectedInterview.duration || 60} min
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {selectedInterview.location || 'Video Call'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    {selectedInterview.interviewer?.firstName || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => generateQuestions(selectedInterview.id)}
                  disabled={questionLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {questionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  Generate Questions
                </button>
                <button
                  onClick={() => getSummary(selectedInterview.id)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Interview Summary
                </button>
              </div>

              {/* Generated Questions */}
              {generatedQuestions.length > 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Generated Interview Questions ({generatedQuestions.length})
                  </h3>
                  <div className="space-y-3">
                    {generatedQuestions.map((q, i) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-xs text-gray-500 uppercase">{q.category}</span>
                              <p className="text-white text-sm">{q.question}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                              q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{q.timeEstimate}</span>
                            {expandedQuestion === q.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedQuestion === q.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-700"
                            >
                              <div className="p-4 space-y-3">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-400 mb-1">Context</h5>
                                  <p className="text-sm text-gray-300">{q.context}</p>
                                </div>
                                <div>
                                  <h5 className="text-xs font-medium text-gray-400 mb-1">Expected Answer Points</h5>
                                  <ul className="space-y-1">
                                    {q.expectedPoints.map((point: string, j: number) => (
                                      <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                        {point}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Summary */}
              {summary && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Interview Summary</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{summary.aiSummary}</pre>
                  </div>
                </div>
              )}

              {/* Feedback Form */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Submit Feedback</h3>
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= feedbackForm.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600 hover:text-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Recommendation</label>
                    <div className="flex gap-2">
                      {Object.entries(RECOMMENDATION_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setFeedbackForm({ ...feedbackForm, recommendation: key })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            feedbackForm.recommendation === key
                              ? `${config.bg} ${config.color}`
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Strengths</label>
                    <textarea
                      value={feedbackForm.strengths}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                      placeholder="What did the candidate do well?"
                    />
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Areas for Improvement</label>
                    <textarea
                      value={feedbackForm.weaknesses}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, weaknesses: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                      placeholder="What areas could the candidate improve?"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Additional Notes</label>
                    <textarea
                      value={feedbackForm.notes}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                      placeholder="Any other observations?"
                    />
                  </div>

                  <button
                    onClick={() => submitFeedback(selectedInterview.id)}
                    disabled={feedbackSubmitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {feedbackSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Feedback
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">Important Note</h4>
                    <p className="text-xs text-gray-400">
                      Interview feedback and AI-generated questions are for decision support only.
                      Final hiring decisions must be made by the hiring team. Questions are generated based on
                      job requirements and candidate skills — not protected characteristics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowScheduleForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Schedule Interview</h3>
                <button onClick={() => setShowScheduleForm(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Candidate</label>
                  <select
                    value={newInterview.candidateId}
                    onChange={(e) => setNewInterview({ ...newInterview, candidateId: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select candidate...</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Job Position</label>
                  <select
                    value={newInterview.jobId}
                    onChange={(e) => setNewInterview({ ...newInterview, jobId: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select job...</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type</label>
                    <select
                      value={newInterview.type}
                      onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="TECHNICAL">Technical</option>
                      <option value="BEHAVIORAL">Behavioral</option>
                      <option value="SYSTEM_DESIGN">System Design</option>
                      <option value="CULTURAL">Cultural</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={newInterview.duration}
                      onChange={(e) => setNewInterview({ ...newInterview, duration: parseInt(e.target.value) || 60 })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newInterview.scheduledAt}
                    onChange={(e) => setNewInterview({ ...newInterview, scheduledAt: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    value={newInterview.location}
                    onChange={(e) => setNewInterview({ ...newInterview, location: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Video call link or office location"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={scheduleInterview}
                    disabled={!newInterview.candidateId || !newInterview.jobId || !newInterview.scheduledAt}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
