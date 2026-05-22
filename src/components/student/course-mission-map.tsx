'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type LessonChildNode = { id: string; title: string; summary?: string | null };

export type MissionLessonNode = {
  id: string;
  title: string;
  summary?: string | null;
  moduleTitle?: string | null;
  moduleIndex?: number;
  lessonIndex?: number;
  isSubLesson?: boolean;
  parentLessonTitle?: string | null;
  parentLessonIndex?: number | null;
  subLessons: LessonChildNode[];
};

export type MissionStageGroup = {
  title: string;
  items: MissionLessonNode[];
  index: number;
};

export function CourseMissionMap({
  courseId,
  moduleGroups,
  completedLessonIds,
  hasActiveAccess,
  nextLessonId,
}: {
  courseId: string;
  moduleGroups: MissionStageGroup[];
  completedLessonIds: Set<string>;
  hasActiveAccess: boolean;
  nextLessonId: string | null;
}) {
  return (
    <Card className="rounded-3xl border-primary/20 shadow-sm">
      <CardHeader>
        <CardTitle>Learning Path</CardTitle>
        <CardDescription>
          Follow the next mission first. Details stay tucked away until you need them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {moduleGroups.length ? (
          moduleGroups.map((module, moduleIdx) => {
            const stageTotal = module.items.reduce((total, lesson) => total + 1 + lesson.subLessons.length, 0);
            const stageCompleted = module.items.reduce((total, lesson) => {
              const parentDone = completedLessonIds.has(String(lesson.id)) ? 1 : 0;
              const childDone = lesson.subLessons.filter((sub) => completedLessonIds.has(String(sub.id))).length;
              return total + parentDone + childDone;
            }, 0);
            const stageProgress = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;
            const stageStatus = stageProgress >= 100 ? 'Completed' : stageProgress > 0 ? 'In progress' : 'Ready';
            const hasNextLesson = module.items.some((lesson) => {
              if (lesson.id === nextLessonId) return true;
              return lesson.subLessons.some((sub) => sub.id === nextLessonId);
            });
            const shouldOpenStage = hasNextLesson || moduleIdx === 0;

            return (
              <details key={`${module.title}-${moduleIdx}`} open={shouldOpenStage} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                <summary className="cursor-pointer list-none border-b bg-primary/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module {moduleIdx + 1}</p>
                      <h3 className="mt-1 text-xl font-bold">{module.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {stageCompleted} of {stageTotal} activities complete
                      </p>
                    </div>
                    <span className="w-fit rounded-full border bg-background px-3 py-1 text-xs font-semibold text-primary">
                      {stageStatus}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Module progress</span>
                      <strong>{stageProgress}%</strong>
                    </div>
                    <Progress value={stageProgress} className="h-2" />
                  </div>
                </summary>

                <div className="space-y-3 p-4">
                  {module.items.map((lesson, index) => {
                    const parentDone = completedLessonIds.has(String(lesson.id));
                    const completedChildren = lesson.subLessons.filter((sub) => completedLessonIds.has(String(sub.id))).length;
                    const totalInGroup = 1 + lesson.subLessons.length;
                    const completedInGroup = (parentDone ? 1 : 0) + completedChildren;
                    const missionProgress = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;
                    const missionState = completedInGroup === totalInGroup ? 'Done' : completedInGroup > 0 ? 'Continue' : 'Ready';
                    const isNextMission = nextLessonId === lesson.id || lesson.subLessons.some((sub) => sub.id === nextLessonId);

                    return (
                      <div key={lesson.id} className={`rounded-2xl border bg-background p-4 transition ${isNextMission ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">
                              {moduleIdx + 1}.{index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">{lesson.title}</h4>
                                <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                                  {isNextMission && !parentDone ? 'Next' : missionState}
                                </span>
                              </div>
                              {lesson.summary ? (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{lesson.summary}</p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-muted px-2 py-1">
                                  {completedInGroup} / {totalInGroup} done
                                </span>
                                {lesson.subLessons.length ? (
                                  <span className="rounded-full bg-muted px-2 py-1">
                                    {lesson.subLessons.length} sub-lesson{lesson.subLessons.length === 1 ? '' : 's'}
                                  </span>
                                ) : null}
                              </div>
                              {totalInGroup > 1 ? (
                                <div className="mt-3 max-w-xs">
                                  <Progress value={missionProgress} className="h-2" />
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {hasActiveAccess ? (
                            <Button asChild variant={parentDone ? 'outline' : 'default'} className="w-full sm:w-auto">
                              <Link href={`/student/courses/${courseId}/lessons/${lesson.id}`}>
                                {parentDone ? 'Replay' : nextLessonId === lesson.id ? 'Continue' : 'Start'}
                              </Link>
                            </Button>
                          ) : (
                            <Button disabled className="w-full sm:w-auto">Locked</Button>
                          )}
                        </div>

                        {lesson.subLessons.length ? (
                          <details className="mt-4 border-t pt-4">
                            <summary className="cursor-pointer list-none text-sm font-medium text-primary">
                              View sub-lessons
                            </summary>
                            <div className="mt-3 space-y-2">
                              {lesson.subLessons.map((sub, subIndex) => {
                                const subDone = completedLessonIds.has(String(sub.id));
                                return (
                                  <div key={`${lesson.id}-${sub.id}-${subIndex}`} className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">{subIndex + 1}. {sub.title}</p>
                                      {sub.summary ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{sub.summary}</p> : null}
                                    </div>
                                    {hasActiveAccess ? (
                                      <Button asChild size="sm" variant={subDone ? 'outline' : 'secondary'}>
                                        <Link href={`/student/courses/${courseId}/lessons/${sub.id}`}>
                                          {subDone ? 'Replay' : nextLessonId === sub.id ? 'Continue' : 'Open'}
                                        </Link>
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Locked</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })
        ) : (
          <EmptyMissionMap title="No lessons have been published for this Journey yet." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMissionMap({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      <BookOpen className="mx-auto mb-3 h-8 w-8 text-primary" />
      {title}
    </div>
  );
}
