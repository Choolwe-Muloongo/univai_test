import { Handshake } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const placeholderSlots = Array.from({ length: 6 });

export function Partners() {
  return (
    <section className="bg-white py-16 dark:bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Strategic Partners</p>
          <h2 className="mt-2 text-2xl font-bold text-brand-ink dark:text-foreground">Building Africa&apos;s opportunity network</h2>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {placeholderSlots.map((_, index) => (
              <div
                key={index}
                className="flex h-20 items-center justify-center rounded-xl border border-dashed border-black/10 bg-brand-surface text-brand-mutedink dark:border-white/10 dark:bg-background"
              >
                <Handshake className="h-6 w-6" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-brand-mutedink dark:text-muted-foreground">
            Partner logos will appear here as institutional and industry partnerships are confirmed.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
