import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function ThemeSwitcher() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-surface-600 hover:text-surface-950 h-9 w-9"
        >
          <Moon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Dark mode</TooltipContent>
    </Tooltip>
  );
}
