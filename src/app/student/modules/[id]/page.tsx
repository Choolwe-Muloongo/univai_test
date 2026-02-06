import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getLessonsByCourse, getProgram } from "@/lib/api";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
} from "lucide-react";

const outcomes = [
  "Understand core concepts and vocabulary.",
  "Complete practice exercises and checkpoints.",
  "Prepare for module assessments with AI guidance.",
];

const resources = [
  { label: "Module syllabus (PDF)", type: "PDF" },
  { label: "Lecture slides", type: "Slides" },
  { label: "Reading pack", type: "Doc" },
];

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram();
  const module = program.modules.find((item) => item.id === id);

  if (!module) {
    notFound();
  }

  const moduleLessons = await getLessonsByCourse(program.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
        <p className="text-muted-foreground">{module.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Module Progress</CardTitle>
            <CardDescription>Track your mastery and next actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Completion</span>
              <span className="text-muted-foreground">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Semester {module.semester}</p>
                </div>
                <p className="text-sm text-muted-foreground">Weekly pacing active</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Assessments</p>
                </div>
                <p className="text-sm text-muted-foreground">2 pending tasks</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button asChild>
              <Link href="/student/assignments">View Assignments</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/ai">Ask AI Tutor</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module Status</CardTitle>
            <CardDescription>Keep your workload on track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Availability</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exam</span>
              <Badge variant={module.isExamAvailable ? "secondary" : "outline"}>
                {module.isExamAvailable ? "Available" : "Locked"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credit weight</span>
              <span className="text-sm font-semibold">6 credits</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program">Back to Program</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
          <CardDescription>What you will achieve in this module.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {outcomes.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border p-4">
              <GraduationCap className="mt-1 h-5 w-5 text-primary" />
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Resume learning from where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {moduleLessons.slice(0, 3).map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{lesson.content}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/lessons/${lesson.id}`}>Open</Link>
                </Button>
              </div>
            ))}
            {moduleLessons.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Lessons for this module will appear here once published.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/student/lessons/l1-cs101">Continue Lesson</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Downloadable materials for this module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/student/ai/lesson-companion/l1-cs101">
                <Lightbulb className="mr-2 h-4 w-4" />
                AI Lesson Companion
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
