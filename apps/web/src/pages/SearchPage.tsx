import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Clock,
  ArrowUpDown,
  Loader2,
  Users,
  Filter,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  User,
} from 'lucide-react';

// ============================================================
// Types
interface SearchResult {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  location: string | null;
  summary: string | null;
  overallScore: number;
  skillScore: number;
  matchReasons: MatchReason[];
  matchedSkills: string[];
  missingSkills: string[];
  relatedSkills: string[];
  experienceYears: number;
  skillCount: number;
}

interface MatchReason {
  type: string;
  detail: string;
  matched: boolean;
  weight: number;
}

interface SearchSuggestion {
  text: string;
  category: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  resultCount: number;
  createdAt: string;
}

interface ParsedQuery {
  skills: string[];
  desiredSkills: string[];
  avoidedSkills: string[];
  experienceLevel: string | null;
  locationKeywords: string[];
  sentiment: Record<string, string>;
}

// ============================================================
// Helpers
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    skill_match: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    skill_related: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    experience: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    location: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    keyword: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    project: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    education: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return colors[category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

const SUGGESTION_QUERIES = [
  'Find freshers with Python and machine learning',
  'Find senior React developers',
  'Find backend engineers with Java and Spring Boot',
  'Find candidates with healthcare projects',
  'Find strong SQL but weak cloud experience',
  'Find DevOps engineers with Kubernetes',
  'Find machine learning engineers with PyTorch',
  'Find full-stack developers with TypeScript',
  'Find remote candidates with Go experience',
];

// ============================================================
// AnimatedScoreBar
const AnimatedScoreBar: React.FC<{ score: number; delay?: number }> = ({ score, delay = 0 }) => {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${
          score >= 80 ? 'bg-emerald-500' :
          score >= 60 ? 'bg-blue-500' :
          score >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay: delay * 0.1, ease: 'easeOut' }}
      />
    </div>
  );
};

// ============================================================
// FilterChip
const FilterChip: React.FC<{
  label: string;
  onRemove: () => void;
  color?: string;
}> = ({ label, onRemove, color = 'bg-blue-500/10 text-blue-400 border-blue-500/20' }) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
  >
    {label}
    <button onClick={onRemove} className="hover:text-white transition-colors">
      <X className="w-3 h-3" />
    </button>
  </motion.span>
);

// ============================================================
// MatchReasonTag
const MatchReasonTag: React.FC<{ reason: MatchReason }> = ({ reason }) => {
  const isPositive = reason.matched;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(reason.type)}`}>
      {isPositive ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : reason.detail.startsWith('○') ? (
        <AlertCircle className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {reason.detail}
    </span>
  );
};

// ============================================================
// SearchSuggestionDropdown
const SearchSuggestionDropdown: React.FC<{
  suggestions: SearchSuggestion[];
  onSelect: (text: string) => void;
  visible: boolean;
}> = ({ suggestions, onSelect, visible }) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-2 max-h-80 overflow-y-auto">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            {s.category === 'skill' && <Zap className="w-4 h-4 text-blue-400" />}
            {s.category === 'role' && <Sparkles className="w-4 h-4 text-purple-400" />}
            {s.category === 'location' && <MapPin className="w-4 h-4 text-amber-400" />}
            {!['skill', 'role', 'location'].includes(s.category) && <Search className="w-4 h-4 text-gray-500" />}
            <span>{s.text}</span>
            <span className="ml-auto text-xs text-gray-600 capitalize">{s.category}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================
// CandidateCard
const CandidateCard: React.FC<{
  result: SearchResult;
  index: number;
  onSelect: () => void;
  isExpanded: boolean;
}> = ({ result, index, onSelect, isExpanded }) => {
  const initials = `${result.firstName[0]}${result.lastName[0]}`.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`bg-gray-900/50 border rounded-xl overflow-hidden transition-all cursor-pointer ${
        isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-gray-800 hover:border-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-base">
                  {result.firstName} {result.lastName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  {result.email && <span>{result.email}</span>}
                  {result.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.experienceYears.toFixed(1)} yrs
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border ${getScoreBg(result.overallScore)}`}>
                <span className={`text-xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}%
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mt-3">
              <AnimatedScoreBar score={result.overallScore} delay={index} />
            </div>

            {/* Summary */}
            {result.summary && (
              <p className="mt-3 text-sm text-gray-400 line-clamp-2">{result.summary}</p>
            )}

            {/* Skills chips */}
            {result.matchedSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.matchedSkills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    ✓ {skill}
                  </span>
                ))}
                {result.relatedSkills.slice(0, 3).map((skill, i) => (
                  <span key={`rel-${i}`} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
                    ~ {skill}
                  </span>
                ))}
                {result.missingSkills.slice(0, 3).map((skill, i) => (
                  <span key={`mis-${i}`} className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                    ○ {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expanded: Match Reasons */}
        <AnimatePresence>
          {isExpanded && result.matchReasons.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Match Analysis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.matchReasons.map((reason, i) => (
                    <MatchReasonTag key={i} reason={reason} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============================================================
// Main SearchPage
const SearchPage: React.FC = () => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Fetch suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['searchSuggestions', searchQuery],
    queryFn: async () => {
      const res = await api.get('/search/suggestions', { params: { q: searchQuery } });
      return res.data?.data || [];
    },
    enabled: showSuggestions && searchQuery.length >= 0,
  });

  // Execute search
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', activeQuery, sortBy],
    queryFn: async () => {
      if (!activeQuery) return null;
      const res = await api.get('/search', { params: { q: activeQuery, sortBy, limit: 50 } });
      return res.data;
    },
    enabled: !!activeQuery,
  });

  // Fetch saved searches
  const { data: savedData } = useQuery({
    queryKey: ['savedSearches'],
    queryFn: async () => {
      const res = await api.get('/search/saved');
      return res.data?.data || [];
    },
    enabled: showSavedSearches,
  });

  // Save search mutation
  const saveMutation = useMutation({
    mutationFn: async ({ name, query, resultCount }: { name: string; query: string; resultCount: number }) => {
      const res = await api.post('/search/saved', { name, query, filters: {}, resultCount });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      setSaveDialogOpen(false);
      setSaveName('');
    },
  });

  // Delete saved search
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/search/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });

  const results: SearchResult[] = searchData?.data || [];
  const parsedQuery: ParsedQuery | null = searchData?.parsedQuery || null;
  const savedSearches: SavedSearch[] = savedData || [];
  const suggestions: SearchSuggestion[] = suggestionsData || [];

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSuggestionSelect = useCallback((text: string) => {
    setSearchQuery(text);
    setActiveQuery(text);
    setShowSuggestions(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Filter chips from parsed query
  const filterChips: Array<{ label: string; type: string; color?: string }> = [];
  if (parsedQuery) {
    for (const skill of parsedQuery.desiredSkills) {
      const isWeak = parsedQuery.sentiment[skill] === 'weak';
      filterChips.push({
        label: isWeak ? `Weak: ${skill}` : skill,
        type: 'skill',
        color: isWeak ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      });
    }
    if (parsedQuery.experienceLevel) {
      filterChips.push({
        label: parsedQuery.experienceLevel,
        type: 'experience',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      });
    }
    for (const loc of parsedQuery.locationKeywords) {
      filterChips.push({
        label: loc,
        type: 'location',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Search className="w-6 h-6 text-blue-400" />
                Semantic Search
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Search candidates using natural language
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showSavedSearches ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </button>
              {activeQuery && (
                <button
                  onClick={() => setSaveDialogOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder='Try "Find senior React developers with TypeScript"...'
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveQuery(''); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              <SearchSuggestionDropdown
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                visible={showSuggestions}
              />
            </AnimatePresence>
          </div>

          {/* Filter Chips */}
          {filterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence>
                {filterChips.map((chip, i) => (
                  <FilterChip
                    key={`${chip.type}-${chip.label}`}
                    label={chip.label}
                    color={chip.color}
                    onRemove={() => {}} // Would remove filter
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Saved Searches Panel */}
        <AnimatePresence>
          {showSavedSearches && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Saved Searches</h3>
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved searches yet.</p>
                ) : (
                  <div className="space-y-2">
                    {savedSearches.map(search => (
                      <div key={search.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800">
                        <button
                          onClick={() => { setSearchQuery(search.query); setActiveQuery(search.query); setShowSavedSearches(false); }}
                          className="flex-1 text-left"
                        >
                          <span className="text-sm text-white font-medium">{search.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({search.resultCount} results)</span>
                          <p className="text-xs text-gray-500 mt-0.5">{search.query}</p>
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(search.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Suggestions (when no search) */}
        {!activeQuery && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Try searching for...
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUGGESTION_QUERIES.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setSearchQuery(q); setActiveQuery(q); }}
                  className="text-left p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-900 transition-all text-sm text-gray-400 hover:text-white"
                >
                  <Search className="w-4 h-4 text-gray-500 mb-2" />
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {activeQuery && (
          <>
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-400">
                {searchLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <span>
                    <span className="font-medium text-white">{results.length}</span> candidates found
                    {parsedQuery?.skills && parsedQuery.skills.length > 0 && (
                      <span className="ml-2 text-gray-500">
                        for {parsedQuery.skills.slice(0, 3).join(', ')}
                        {parsedQuery.skills.length > 3 && ` +${parsedQuery.skills.length - 3}`}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="matchScore">Match Score</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-400">Searching candidates...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-400">No candidates found</h3>
                <p className="text-sm text-gray-500 mt-1">Try different search terms or filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <CandidateCard
                    key={result.candidateId}
                    result={result}
                    index={index}
                    isExpanded={expandedCard === result.candidateId}
                    onSelect={() => setExpandedCard(
                      expandedCard === result.candidateId ? null : result.candidateId
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Search Dialog */}
      <AnimatePresence>
        {saveDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSaveDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 z-50"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Save Search</h3>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Search name..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <p className="text-sm text-gray-500 mb-4">Query: &quot;{activeQuery}&quot;</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate({ name: saveName || activeQuery, query: activeQuery, resultCount: results.length })}
                  disabled={!saveName.trim() || saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
