import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { getProgram } from "@/lib/api";

export default async function ProgressPage() {
  const program = await getProgram();
  const modules = program.modules ?? [];
  const totalModules = modules.length;
  const completedModules = modules.filter((module) => (module.progress ?? 0) >= 100).length;
  const atRiskModules = modules.filter((module) => (module.progress ?? 0) < 50).length;
  const inProgressModules = totalModules - completedModules;
  const totalProgress = modules.reduce((sum, module) => sum + (module.progress ?? 0), 0);
  const averageProgress = totalModules ? Math.round(totalProgress / totalModules) : 0;

  const percent = (value: number) =>
    totalModules ? Math.round((value / totalModules) * 100) : 0;

  const progressItems = [
    { label: "Overall Program Progress", value: program.progress ?? averageProgress, note: "Credits completed" },
    { label: "Modules Completed", value: percent(completedModules), note: `${completedModules} of ${totalModules}` },
    { label: "Modules In Progress", value: percent(inProgressModules), note: `${inProgressModules} active` },
    { label: "Modules At Risk", value: percent(atRiskModules), note: `${atRiskModules} need attention` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">
          Monitor learning milestones, AI mastery checks, and module pacing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {progressItems.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <CardDescription>{item.note}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{item.value}%</span>
                <span className="text-muted-foreground">Target 100%</span>
              </div>
              <Progress value={item.value} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Status</CardTitle>
          <CardDescription>AI signals highlight where to focus next.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules available yet.</p>
          ) : (
            modules.map((module) => {
              const progress = module.progress ?? 0;
              const status = progress >= 75 ? "On Track" : progress >= 50 ? "Needs Attention" : "Needs Help";
              return (
                <div key={module.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{module.title ?? module.id}</p>
                    <Badge variant={status === "Needs Help" ? "destructive" : "secondary"}>
                      {status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={progress} className="h-2" />
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Study Coach</CardTitle>
            <CardDescription>
              Get a personalized plan based on your progress data.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/student/ai">Open AI Coach</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
