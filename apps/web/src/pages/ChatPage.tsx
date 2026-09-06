import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  ChevronLeft,
  Zap,
  Search,
  Briefcase,
  Users,
  GitCompareArrows,
  BarChart3,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DEMO_CANDIDATES, COPILOT_KNOWLEDGE_BASE } from '@/lib/demoData';
import { cn } from '@/lib/cn';
import type { LayoutContext } from '@/types/layout';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  timestamp: string;
  detectedCandidates?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Search, title: "Find Python Engineers", text: "Find the best Python and distributed systems candidates", color: "text-brand-400" },
  { icon: GitCompareArrows, title: "Compare Top Candidates", text: "Compare Priya Sharma and Marcus Chen side by side", color: "text-purple-400" },
  { icon: Briefcase, title: "Pipeline Overview", text: "What jobs are open right now and what is the candidate pipeline status?", color: "text-amber-400" },
  { icon: Zap, title: "Interview Synthesis", text: "Generate interview questions for Senior Full-Stack Engineer", color: "text-cyan-400" },
  { icon: Users, title: "Review Top Matches", text: "Show me all available candidates with high AI confidence scores", color: "text-emerald-400" },
  { icon: BarChart3, title: "Fairness & Compliance", text: "Is our recruitment funnel passing EEOC 4/5ths fairness rules?", color: "text-rose-400" },
];

function ToolIndicator({ toolName }: { toolName: string }) {
  const icons: Record<string, typeof Search> = {
    searchCandidates: Search,
    getCandidate: Users,
    getJob: Briefcase,
    listJobs: Briefcase,
    listCandidates: Users,
    compareCandidates: GitCompareArrows,
    getMatchScore: BarChart3,
    getSkillGap: Zap,
    getAnalytics: BarChart3,
    generateInterviewQuestions: Zap,
  };
  const labels: Record<string, string> = {
    searchCandidates: 'Searching candidates database',
    getCandidate: 'Retrieving candidate record',
    getJob: 'Loading job profile',
    listJobs: 'Scanning open requisitions',
    listCandidates: 'Filtering applicant pool',
    compareCandidates: 'Computing multidimensional delta',
    getMatchScore: 'Calculating neural cosine score',
    getSkillGap: 'Evaluating required competencies',
    getAnalytics: 'Compiling recruitment telemetry',
    generateInterviewQuestions: 'Synthesizing role questions',
  };

  const Icon = icons[toolName] || Zap;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg text-xs text-brand-400 mb-2">
      <Loader2 className="w-3 h-3 animate-spin" />
      <Icon className="w-3 h-3" />
      <span>{labels[toolName] || toolName}</span>
    </div>
  );
}

function detectCandidatesInText(text: string): any[] {
  const detected: any[] = [];
  DEMO_CANDIDATES.forEach(cand => {
    const fullName = `${cand.firstName} ${cand.lastName}`.toLowerCase();
    if (text.toLowerCase().includes(fullName) || text.toLowerCase().includes(cand.firstName.toLowerCase())) {
      if (!detected.some(d => d.id === cand.id)) {
        detected.push(cand);
      }
    }
  });
  return detected;
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-surface-950 font-semibold">$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="text-surface-800">$1</em>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-xs font-bold text-surface-950 uppercase tracking-wider mt-3 mb-1">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold text-surface-950 mt-4 mb-2">$1</h3>');
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-surface-300 my-3" />');
  // Tables
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    if (cells.some(c => /^[\s-]+$/.test(c))) return '';
    const row = cells.map(c => `<td class="px-2.5 py-1.5 border border-surface-300 text-surface-700 text-xs">${c.trim()}</td>`).join('');
    return `<tr>${row}</tr>`;
  });
  // Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-surface-700 text-xs mb-1">$1</li>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-surface-200 rounded text-brand-400 text-xs font-mono">$1</code>');
  // Wrap lists
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-1 space-y-0.5">${match}</ul>`);
  // Line breaks
  html = html.replace(/\n/g, '<br />');
  return html;
}

export function ChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [activeConvId, setActiveConvId] = useState<string | null>('conv-1');
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  // Fetch conversations
  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/ai/conversations');
      return res.data?.data || res.data || [];
    },
  });

  // Fetch conversation messages
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: async () => {
      if (!activeConvId) return null;
      const res = await api.get(`/ai/conversations/${activeConvId}`);
      return res.data?.data || res.data;
    },
    enabled: !!activeConvId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      const res = await api.post('/ai/chat', { message, conversationId });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      if (data?.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConvId || data?.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Delete conversation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai/conversations/${id}`);
    },
    onSuccess: () => {
      setActiveConvId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const conversations: Conversation[] = convsData || [];
  const rawMessages: ChatMessage[] = convData?.messages || [];

  // Enhance messages with detected candidates
  const messages: ChatMessage[] = rawMessages.map(msg => ({
    ...msg,
    detectedCandidates: msg.role === 'assistant' ? detectCandidatesInText(msg.content) : []
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sendMutation.isPending) return;
    sendMutation.mutate({ message: msg, conversationId: activeConvId || undefined });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveConvId(`conv-${Date.now()}`);
  };

  const showWelcome = messages.length === 0 && !sendMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-0 overflow-hidden">
      <TopBar
        title="AI Recruiter Copilot"
        subtitle="Semantic candidate search, interview question synthesis & hiring recommendations"
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'transition-all duration-300 bg-surface-50/70 backdrop-blur-md border-r border-surface-300 flex flex-col overflow-hidden shrink-0',
            showSidebar ? 'w-72' : 'w-0'
          )}
        >
          <div className="p-3 border-b border-surface-300 flex items-center justify-between">
            <Button
              onClick={handleNewChat}
              size="sm"
              className="w-full gap-2 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Conversation
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-surface-500">
              Recent Threads
            </div>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  'group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs font-medium',
                  activeConvId === conv.id
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-950 border border-transparent'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1">{conv.title || 'Recruitment Chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-200 text-surface-400 hover:text-danger-500 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick AI tips */}
          <div className="p-3 border-t border-surface-300 bg-surface-100/40">
            <div className="flex items-center gap-1.5 text-2xs font-semibold text-surface-600 mb-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Multi-Vector Intelligence</span>
            </div>
            <p className="text-2xs text-surface-500 leading-relaxed">
              Query by language, match scores, or ask for cross-candidate comparisons.
            </p>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-0">
          {/* Chat Sub-Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-300 bg-surface-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-950 transition-colors"
                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-surface-950 flex items-center gap-1.5">
                    TalentIQ Copilot
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-2xs text-surface-500">Autonomous Reasoning Agent</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-2xs font-medium border-brand-500/20 text-brand-400 hidden sm:inline-flex">
                Gemini 2.5 Flash Connected
              </Badge>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {showWelcome ? (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20 glow-brand">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-surface-950">
                    How can I assist your talent acquisition today?
                  </h1>
                  <p className="text-surface-600 text-xs max-w-md mx-auto leading-relaxed">
                    Search candidate profiles by technical signals, compare candidates head-to-head, or generate tailored interview guides with one click.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      onClick={() => handleSend(prompt.text)}
                      className="text-left p-3.5 rounded-xl border border-surface-300 hover:border-brand-500/50 hover:bg-surface-100/60 glass-card transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <prompt.icon className={cn('w-4 h-4', prompt.color)} />
                        <span className="text-xs font-semibold text-surface-950 group-hover:text-brand-400 transition-colors">
                          {prompt.title}
                        </span>
                      </div>
                      <p className="text-2xs text-surface-500 line-clamp-2">{prompt.text}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-3',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl p-4 space-y-3',
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-sm shadow-md'
                            : 'glass-card border border-surface-300 rounded-tl-sm text-surface-800'
                        )}
                      >
                        {/* Tool calls */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mb-2">
                            {msg.toolCalls.map((tc, i) => (
                              <ToolIndicator key={i} toolName={tc.name} />
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        {msg.role === 'assistant' ? (
                          <div
                            className="text-xs leading-relaxed space-y-2"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                        ) : (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {/* Interactive Candidate Cards */}
                        {msg.detectedCandidates && msg.detectedCandidates.length > 0 && (
                          <div className="pt-2 border-t border-surface-300/60 space-y-2">
                            <span className="text-2xs font-semibold uppercase tracking-wider text-surface-500 block">
                              Detected Candidate Profiles
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.detectedCandidates.map(cand => (
                                <div
                                  key={cand.id}
                                  className="p-2.5 rounded-xl border border-surface-300 bg-surface-100/80 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarFallback className="text-2xs font-bold text-brand-400">
                                        {cand.firstName[0]}{cand.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-semibold text-surface-950 truncate">
                                        {cand.firstName} {cand.lastName}
                                      </h4>
                                      <p className="text-2xs text-surface-500 truncate">
                                        {cand.location || 'Remote'}
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/candidates/${cand.id}`)}
                                    className="text-2xs h-7 px-2 shrink-0 gap-1"
                                  >
                                    <span>Profile</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div
                          className={cn(
                            'text-3xs text-right',
                            msg.role === 'user' ? 'text-white/70' : 'text-surface-400'
                          )}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-surface-300 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-surface-700" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* AI Thinking Animation */}
                {sendMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass-card border border-surface-300 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-1.5 h-1.5 rounded-full bg-brand-400"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-1.5 h-1.5 rounded-full bg-brand-400"
                        />
                      </div>
                      <span className="text-xs text-surface-500 font-mono">Analyzing candidate corpus...</span>
                    </div>
                  </motion.div>
                )}

                {/* Follow-up suggestion pills */}
                {messages.length > 0 && !sendMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-wrap gap-2 pt-2 ml-10"
                  >
                    {["Who has the strongest Kubernetes experience?", "Compare Priya Sharma with David Kim", "Draft interview questions"].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(suggestion)}
                        className="px-2.5 py-1 bg-surface-100/70 border border-surface-300 hover:border-brand-500/40 rounded-full text-2xs text-surface-600 hover:text-surface-950 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="border-t border-surface-300 bg-surface-50/80 backdrop-blur-md p-3 sm:p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2.5 bg-surface-100 border border-surface-300 rounded-2xl p-2.5 focus-within:border-brand-500 transition-colors shadow-inner">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about candidates, skills benchmarks, job requisitions, or EEOC metrics..."
                  rows={1}
                  className="flex-1 bg-transparent text-surface-950 placeholder-surface-400 text-xs resize-none outline-none max-h-32"
                  style={{ minHeight: '22px' }}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sendMutation.isPending}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-xl shrink-0"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-center text-3xs text-surface-500 mt-1.5">
                TalentIQ Copilot synthesizes insights from verified resume evidence and enterprise ATS data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
