import {
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  HeartPulse,
  School as SchoolIcon,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

import type { Program, School } from '@/lib/api/types';

/**
 * Schools come from the database, so this only decorates whatever ids are there.
 * Anything unmapped falls back to a generic icon rather than disappearing.
 */
const SCHOOL_ICONS: Record<string, LucideIcon> = {
  ict: Code2,
  business: BriefcaseBusiness,
  eng: Settings2,
  engineering: Settings2,
  edu: GraduationCap,
  education: GraduationCap,
  nursing: HeartPulse,
  health: HeartPulse,
  ai: BrainCircuit,
};

export function schoolIcon(schoolId: unknown): LucideIcon {
  const key = typeof schoolId === 'string' ? schoolId.toLowerCase() : '';
  return SCHOOL_ICONS[key] ?? SchoolIcon;
}

export type SchoolWithPrograms = {
  id: string;
  name: string;
  icon: LucideIcon;
  programs: Program[];
};

/** Group the programme catalogue under the schools that own it. */
export function schoolsWithPrograms(schools: School[], programs: Program[]): SchoolWithPrograms[] {
  return schools
    .filter((school) => school && school.id)
    .map((school) => ({
      id: String(school.id),
      name: String(school.name ?? school.title ?? school.id),
      icon: schoolIcon(school.id),
      programs: programs.filter((program) => program.schoolId === school.id),
    }));
}

/** A description built from the school's real catalogue, so nothing is invented. */
export function describeSchool(school: SchoolWithPrograms): string {
  if (!school.programs.length) return 'Programmes for this school are being prepared.';

  const titles = school.programs
    .map((program) => program.title)
    .filter(Boolean)
    .slice(0, 3);

  const remaining = school.programs.length - titles.length;
  return remaining > 0 ? `${titles.join(', ')} and ${remaining} more.` : `${titles.join(', ')}.`;
}

export function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}
