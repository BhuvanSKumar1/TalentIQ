import { useState, useEffect } from 'react';
import { Moon, Sparkles, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const THEMES = [
  { id: 'obsidian', name: 'Dark Obsidian', icon: Moon },
  { id: 'sapphire', name: 'Midnight Sapphire', icon: Sparkles },
  { id: 'cyber', name: 'Cyber Emerald', icon: Sun },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('taliq-theme') || 'obsidian';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('taliq-theme', currentTheme);
  }, [currentTheme]);

  const cycleTheme = () => {
    const nextIdx = (THEMES.findIndex((t) => t.id === currentTheme) + 1) % THEMES.length;
    setCurrentTheme(THEMES[nextIdx].id);
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const Icon = activeThemeObj.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="text-surface-600 hover:text-surface-950 h-9 w-9 relative group"
        >
          <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Theme: {activeThemeObj.name} (Click to switch)</TooltipContent>
    </Tooltip>
  );
}
