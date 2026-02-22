'use client';

import { useEffect, useState } from 'react';
import { getProgram, getStudentDashboard, getStudentGrades } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

export function useAiContext() {
  const { session } = useSession();
  const [context, setContext] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [programResult, dashboardResult, gradesResult] = await Promise.allSettled([
          getProgram(),
          getStudentDashboard(),
          getStudentGrades(),
        ]);
        const program = programResult.status === 'fulfilled' ? programResult.value : null;
        const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
        const grades = gradesResult.status === 'fulfilled' ? gradesResult.value : null;
        const modulesCount = program?.modules?.length ?? 0;
        const name = session?.user?.name ?? 'Student';
        const role = session?.user?.role ?? 'student';
        const actionsSummary = dashboard?.actions
          ?.slice(0, 3)
          .map((action) => `${action.title} (${action.description})`)
          .join('; ');
        const deadlinesSummary = dashboard?.deadlines
          ?.slice(0, 3)
          .map((deadline) => `${deadline.title} (${deadline.type} due ${deadline.date})`)
          .join('; ');

        const summary = [
          `Student name: ${name}`,
          `Role: ${role}`,
          program?.title ? `Program: ${program.title}` : null,
          program?.schoolName ? `School: ${program.schoolName}` : null,
          program?.intakeId ? `Intake: ${program.intakeId}` : null,
          typeof program?.progress === 'number' ? `Program progress: ${program.progress}%` : null,
          `Modules: ${modulesCount}`,
          typeof grades?.gpa === 'number' ? `GPA: ${grades.gpa}` : null,
          grades?.standing ? `Standing: ${grades.standing}` : null,
          actionsSummary ? `Next actions: ${actionsSummary}` : null,
          deadlinesSummary ? `Upcoming deadlines: ${deadlinesSummary}` : null,
        ]
          .filter(Boolean)
          .join('. ');
        if (active) {
          setContext(summary);
        }
      } catch (error) {
        console.error('Failed to load AI context', error);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [session]);

  return context;
}
