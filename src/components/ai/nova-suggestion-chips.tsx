'use client';

import { Badge } from '@/components/ui/badge';
import type { NovaMode } from './nova-mode-selector';

const suggestionsByMode: Record<NovaMode, string[]> = {
  tutor: [
    'Teach this like I am new to it.',
    'Walk me through the next step.',
    'What should I understand before moving on?',
    'Give me a real-world example.',
  ],
  explain: [
    'Explain this in simple words.',
    'Use an analogy I can remember.',
    'Break down the hard terms.',
    'Show me the common mistake here.',
  ],
  quiz: [
    'Quiz me on this lesson.',
    'Ask 5 checkpoint questions.',
    'Give me one question at a time.',
    'Test my weak area.',
  ],
  summarize: [
    'Summarize this mission.',
    'Make revision notes for me.',
    'Give me the key points only.',
    'Create a quick memory sheet.',
  ],
  exam_prep: [
    'Prepare me for the final trial.',
    'Give me likely exam questions.',
    'Make a last-minute revision plan.',
    'Show what I must revise first.',
  ],
  code_help: [
    'Explain my error.',
    'Give me a hint, not the answer.',
    'Check my code structure.',
    'Show the expected approach.',
  ],
  study_plan: [
    'Create today’s study plan.',
    'Help me catch up quickly.',
    'Plan my next 30 minutes.',
    'Tell me what to study first.',
  ],
};

type NovaSuggestionChipsProps = {
  mode: NovaMode;
  onSelect: (value: string) => void;
  disabled?: boolean;
};

export function getNovaSuggestions(mode: NovaMode) {
  return suggestionsByMode[mode];
}

export function NovaSuggestionChips({ mode, onSelect, disabled = false }: NovaSuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestionsByMode[mode].map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Badge variant="secondary" className="cursor-pointer border border-primary/10 bg-primary/8 px-3 py-1.5 text-xs hover:bg-primary/12">
            {suggestion}
          </Badge>
        </button>
      ))}
    </div>
  );
}
