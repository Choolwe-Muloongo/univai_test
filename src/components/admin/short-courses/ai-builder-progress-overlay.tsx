'use client';

import { useEffect, useMemo, useState } from 'react';

const stages = [
  'Preparing prompt and source material',
  'Sending request to AI',
  'Generating modules, lessons and cards',
  'Checking JSON blueprint',
  'Preparing student preview',
];

type Activity = 'idle' | 'reading' | 'generating' | 'saving';

export function AiBuilderProgressOverlay() {
  const [activity, setActivity] = useState<Activity>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function scanBuilderActivity() {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inputs = Array.from(document.querySelectorAll('input'));
      const text = buttons.map((button) => button.textContent?.trim().toLowerCase() || '').join(' | ');
      const hasDisabledFileInput = inputs.some((input) => input.type === 'file' && input.disabled);

      if (text.includes('generating')) {
        setActivity('generating');
        return;
      }

      if (text.includes('saving draft') || text.includes('saving...')) {
        setActivity('saving');
        return;
      }

      if (hasDisabledFileInput) {
        setActivity('reading');
        return;
      }

      setActivity('idle');
    }

    scanBuilderActivity();
    const observer = new MutationObserver(scanBuilderActivity);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    const interval = window.setInterval(scanBuilderActivity, 600);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activity === 'idle') {
      const timeout = window.setTimeout(() => setProgress(0), 500);
      return () => window.clearTimeout(timeout);
    }

    setProgress((current) => Math.max(current, activity === 'reading' ? 12 : activity === 'saving' ? 72 : 8));
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const ceiling = activity === 'reading' ? 72 : activity === 'saving' ? 92 : 86;
        if (current >= ceiling) return current;
        const increment = activity === 'generating' ? 3 : 5;
        return Math.min(ceiling, current + increment);
      });
    }, activity === 'generating' ? 900 : 500);

    return () => window.clearInterval(interval);
  }, [activity]);

  const status = useMemo(() => {
    if (activity === 'reading') return { title: 'Reading document', detail: 'Loading your source material so AI can use it.' };
    if (activity === 'saving') return { title: 'Saving draft', detail: 'Writing the course blueprint, lessons and cards to the database.' };
    return { title: 'AI is building your course', detail: 'Keep this page open. The system is generating and validating the short-course draft.' };
  }, [activity]);

  if (activity === 'idle') return null;

  const stageIndex = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));

  return (
    <div className="sticky top-4 z-30 rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">{status.title}</p>
          <p className="text-sm text-muted-foreground">{status.detail}</p>
        </div>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
        {stages.map((stage, index) => (
          <div key={stage} className={`rounded-lg border px-2 py-1 ${index <= stageIndex ? 'border-primary/40 bg-primary/5 text-foreground' : 'border-border'}`}>
            {stage}
          </div>
        ))}
      </div>
    </div>
  );
}
