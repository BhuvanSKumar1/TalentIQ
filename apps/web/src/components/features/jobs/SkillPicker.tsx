import { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SkillPickerProps {
  label: string;
  selected: string[];
  onChange: (skills: string[]) => void;
  suggestions?: string[];
  maxSkills?: number;
  placeholder?: string;
}

export function SkillPicker({ label, selected, onChange, suggestions = [], maxSkills = 20, placeholder = 'Type to add skills...' }: SkillPickerProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !selected.includes(s)
  ).slice(0, 10);

  const addSkill = (skill: string) => {
    if (skill && !selected.includes(skill) && selected.length < maxSkills) {
      onChange([...selected, skill]);
      setInput('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skill: string) => {
    onChange(selected.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addSkill(input.trim());
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-surface-900">{label}</label>

      {/* Selected skills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map(skill => (
            <Badge key={skill} variant="default" className="gap-1 pr-1">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-brand-700 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
        <Input
          placeholder={selected.length >= maxSkills ? `Max ${maxSkills} skills` : placeholder}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          disabled={selected.length >= maxSkills}
        />
        {input.trim() && !suggestions.includes(input.trim()) && selected.length < maxSkills && (
          <button type="button" onClick={() => addSkill(input.trim())}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-300 text-xs font-medium">
            Add custom
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="mt-1 rounded-lg border border-surface-400 bg-surface-100 shadow-elevated max-h-48 overflow-y-auto">
          {filtered.map(skill => (
            <button
              key={skill}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addSkill(skill); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200 transition-colors text-left"
            >
              <Plus className="h-3.5 w-3.5 text-surface-600" />
              {skill}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-2xs text-surface-600">
        {selected.length}/{maxSkills} skills selected
      </p>
    </div>
  );
}
