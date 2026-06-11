'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, List, Settings, Type, X } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';

type LessonPlayerProps = React.ComponentProps<typeof LessonPlayer>;

type TextSize = 'normal' | 'large' | 'xl';
type HelpMode = 'hidden' | 'inline';

type LessonSettings = {
  focusMode: boolean;
  textSize: TextSize;
  helpMode: HelpMode;
  reduceMotion: boolean;
};

const STORAGE_KEY = 'univai.lesson-player.settings.v1';

const defaultSettings: LessonSettings = {
  focusMode: false,
  textSize: 'normal',
  helpMode: 'hidden',
  reduceMotion: false,
};

export function EnhancedLessonPlayer(props: LessonPlayerProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<LessonSettings>(defaultSettings);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LessonSettings>;
      setSettings({ ...defaultSettings, ...parsed });
    } catch {
      // Ignore invalid settings.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore unavailable local storage.
    }
  }, [settings]);

  const wrapperClass = useMemo(() => {
    const classes = ['univai-enhanced-lesson-player'];
    classes.push(`univai-lesson-text-${settings.textSize}`);
    classes.push(settings.focusMode ? 'univai-lesson-focus-mode' : '');
    classes.push(settings.helpMode === 'hidden' ? 'univai-lesson-hide-help' : '');
    classes.push(settings.reduceMotion ? 'univai-lesson-reduce-motion' : '');
    return classes.filter(Boolean).join(' ');
  }, [settings]);

  function patch(patch: Partial<LessonSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  return (
    <div className={wrapperClass}>
      <div className="fixed right-3 top-3 z-50 flex gap-2 sm:right-4 sm:top-4">
        <Button type="button" size="sm" variant="secondary" className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <Settings className="mr-2 size-4" />
          Settings
        </Button>
      </div>

      <LessonPlayer {...props} />

      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-3xl bg-background p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Lesson Settings</p>
                <h2 className="text-xl font-bold">Control how you learn</h2>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}><X className="size-4" /></Button>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border p-3">
                <div className="mb-3 flex items-center gap-2 font-semibold"><Eye className="size-4 text-primary" /> Reading mode</div>
                <div className="grid gap-2">
                  <ToggleRow label="Focus mode" description="Hide extra side help and make the card feel cleaner." active={settings.focusMode} onClick={() => patch({ focusMode: !settings.focusMode })} />
                  <ToggleRow label="Reduce animations" description="Useful on slower phones or when the lesson feels jumpy." active={settings.reduceMotion} onClick={() => patch({ reduceMotion: !settings.reduceMotion })} />
                </div>
              </section>

              <section className="rounded-2xl border p-3">
                <div className="mb-3 flex items-center gap-2 font-semibold"><Type className="size-4 text-primary" /> Text size</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'large', 'xl'] as TextSize[]).map((size) => (
                    <Button key={size} type="button" variant={settings.textSize === size ? 'default' : 'outline'} onClick={() => patch({ textSize: size })} className="capitalize">
                      {size === 'xl' ? 'XL' : size}
                    </Button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border p-3">
                <div className="mb-3 flex items-center gap-2 font-semibold"><List className="size-4 text-primary" /> Help panel</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={settings.helpMode === 'hidden' ? 'default' : 'outline'} onClick={() => patch({ helpMode: 'hidden' })}>Hidden</Button>
                  <Button type="button" variant={settings.helpMode === 'inline' ? 'default' : 'outline'} onClick={() => patch({ helpMode: 'inline' })}>Show</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">On phones, hiding help keeps the lesson fast and clean. You can turn it back on anytime.</p>
              </section>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                Lessons already load their cards into the player once. These settings make card-to-card movement feel lighter on phones by reducing visible side content and heavy layout work.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-3 text-left transition ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className={`rounded-full px-2 py-1 text-xs ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{active ? 'On' : 'Off'}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </button>
  );
}
