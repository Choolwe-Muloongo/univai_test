'use client';

import { useEffect, useRef, useState } from 'react';

import { useCountUp } from '@/components/marketing/use-count-up';

const stats = [
  { value: 10000, suffix: '+', label: 'Learners' },
  { value: 500, suffix: '+', label: 'Courses' },
  { value: 100, suffix: '+', label: 'Instructors' },
  { value: 20, suffix: '+', label: 'Partner Organizations' },
  { value: 95, suffix: '%', label: 'Completion Rate' },
];

export function Stats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-brand-dark py-16 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
        {stats.map((stat) => (
          <StatItem key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} active={active} />
        ))}
      </div>
    </section>
  );
}

function StatItem({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const count = useCountUp(value, active);

  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold tracking-tight text-brand-green sm:text-4xl">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-white/70">{label}</p>
    </div>
  );
}
