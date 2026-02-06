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

const progressItems = [
  { label: "Semester 2 Completion", value: 72, note: "On track" },
  { label: "Assignments Submitted", value: 84, note: "3 pending" },
  { label: "Lab Attendance", value: 90, note: "Excellent" },
  { label: "AI Mastery Checks", value: 65, note: "Needs review" },
];

const modules = [
  { name: "CS101", status: "On Track", progress: 78 },
  { name: "ICT104", status: "On Track", progress: 70 },
  { name: "MTH110", status: "Needs Help", progress: 54 },
  { name: "CS120", status: "Ahead", progress: 92 },
];

export default function ProgressPage() {
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
          {modules.map((module) => (
            <div key={module.name} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{module.name}</p>
                <Badge variant={module.status === "Needs Help" ? "destructive" : "secondary"}>
                  {module.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={module.progress} className="h-2" />
                <span className="text-sm text-muted-foreground">{module.progress}%</span>
              </div>
            </div>
          ))}
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
