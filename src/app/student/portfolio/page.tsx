import Link from "next/link";
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
import { Award, Briefcase, FileText } from "lucide-react";

const skills = ["Python", "UI Design", "Data Analysis", "Presentation", "SQL"];
const projects = [
  {
    title: "AI Tutor Dashboard",
    role: "Team Lead",
    status: "Published",
  },
  {
    title: "Smart Campus Access",
    role: "Research Assistant",
    status: "Draft",
  },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          Showcase verified projects, skills, and credentials to employers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Strength</CardTitle>
            <CardDescription>Complete more items to unlock job matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Profile completeness</span>
              <span className="text-muted-foreground">78%</span>
            </div>
            <Progress value={78} className="h-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Credentials</p>
                </div>
                <p className="text-sm text-muted-foreground">3 verified badges</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Experience</p>
                </div>
                <p className="text-sm text-muted-foreground">2 projects published</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/student/jobs">Explore Job Matches</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Skills verified by lecturers and AI.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects & Evidence</CardTitle>
          <CardDescription>Keep your work organized and shareable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project) => (
            <div key={project.title} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{project.title}</p>
                <p className="text-sm text-muted-foreground">{project.role}</p>
              </div>
              <Badge variant={project.status === "Published" ? "secondary" : "outline"}>
                {project.status}
              </Badge>
            </div>
          ))}
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Upload project files, reports, or demo links to strengthen your profile.
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Add New Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
