import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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
  Mic,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Search, text: "Find the best candidates for this job", color: "text-blue-400" },
  { icon: Users, text: "Show me all available candidates", color: "text-emerald-400" },
  { icon: Briefcase, text: "What jobs are open right now?", color: "text-amber-400" },
  { icon: GitCompareArrows, text: "Compare two candidates side by side", color: "text-purple-400" },
  { icon: BarChart3, text: "Show me our recruitment analytics", color: "text-red-400" },
  { icon: Zap, text: "Generate interview questions for a role", color: "text-cyan-400" },
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
    searchCandidates: 'Searching candidates',
    getCandidate: 'Fetching candidate profile',
    getJob: 'Loading job details',
    listJobs: 'Listing jobs',
    listCandidates: 'Listing candidates',
    compareCandidates: 'Comparing candidates',
    getMatchScore: 'Analyzing match score',
    getSkillGap: 'Analyzing skill gaps',
    getAnalytics: 'Computing analytics',
    generateInterviewQuestions: 'Generating questions',
  };

  const Icon = icons[toolName] || Zap;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 mb-2">
      <Loader2 className="w-3 h-3 animate-spin" />
      <Icon className="w-3 h-3" />
      <span>{labels[toolName] || toolName}</span>
    </div>
  );
}

function renderMarkdown(text: string) {
  // Simple markdown: **bold**, bullet points, headers, tables, horizontal rules
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold text-white mt-3 mb-1">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>');
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-gray-700 my-3" />');
  // Tables
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    if (cells.some(c => /^[\s-]+$/.test(c))) return '';
    const row = cells.map(c => `<td class="px-3 py-1 border border-gray-700 text-gray-300 text-sm">${c.trim()}</td>`).join('');
    return `<tr>${row}</tr>`;
  });
  // Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 text-sm mb-0.5">$1</li>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-800 rounded text-blue-300 text-xs font-mono">$1</code>');
  // Wrap lists
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-1">${match}</ul>`);

  // Line breaks
  html = html.replace(/\n/g, '<br />');
  return html;
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [streamingText, setStreamingText] = useState('');

  // Fetch conversations
  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/ai/conversations');
      return res.data?.data || [];
    },
  });

  // Fetch conversation messages
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: async () => {
      if (!activeConvId) return null;
      const res = await api.get(`/ai/conversations/${activeConvId}`);
      return res.data?.data;
    },
    enabled: !!activeConvId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      const res = await api.post('/ai/chat', { message, conversationId });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data?.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConvId || data?.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setStreamingText('');
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
  const messages: ChatMessage[] = convData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

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
    setActiveConvId(null);
  };

  const showWelcome = messages.length === 0 && !sendMutation.isPending;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-hidden flex-shrink-0`}>
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                activeConvId === conv.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate flex-1">{conv.title || 'New Chat'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            {showSidebar ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Recruiter</h2>
              <p className="text-xs text-gray-500">Enterprise Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">AI Recruiter Assistant</h1>
                <p className="text-gray-400 text-sm max-w-md">Ask me anything about your candidates, jobs, or recruitment pipeline. I&apos;ll search, analyze, and provide insights with evidence.</p>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => handleSend(prompt.text)}
                    className="text-left p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-900 transition-all group"
                  >
                    <prompt.icon className={`w-4 h-4 ${prompt.color} mb-2`} />
                    <p className="text-sm text-gray-400 group-hover:text-white transition-colors">{prompt.text}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/80 border border-gray-700/50 text-gray-300'
                    }`}>
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
                          className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {/* Timestamp */}
                      <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-600'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {sendMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-blue-400"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 rounded-full bg-purple-400"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 rounded-full bg-blue-400"
                        />
                      </div>
                      <span className="text-xs text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggested follow-ups */}
              {messages.length > 0 && !sendMutation.isPending && messages[messages.length - 1]?.role === 'assistant' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2 ml-11"
                >
                  {["Show me the best Python developers", "What skills are missing?", "Analyze our recruitment funnel"].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-full text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-all"
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

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl p-3 focus-within:border-blue-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about candidates, jobs, or recruitment..."
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none max-h-32"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sendMutation.isPending}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
              AI Recruiter can make mistakes. Always verify important hiring decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
