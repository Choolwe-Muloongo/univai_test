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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, TrendingUp, ShieldCheck } from "lucide-react";
import { getStudentGrades } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const gradeData = await getStudentGrades();
  const grades = gradeData.grades ?? [];
  const summary = [
    { label: "Current GPA", value: gradeData.gpa.toFixed(2), note: "Current term" },
    { label: "Credits Earned", value: `${gradeData.creditsEarned}`, note: "Completed credits" },
    { label: "Academic Standing", value: gradeData.standing, note: "Policy-based standing" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">
          Track published results, GPA, and academic standing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <CardDescription>{item.note}</CardDescription>
              </div>
              {item.label === "Current GPA" ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : item.label === "Credits Earned" ? (
                <GraduationCap className="h-5 w-5 text-primary" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Results</CardTitle>
          <CardDescription>Updated after lecturer and registrar sign-off.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No grades recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((row) => (
                  <TableRow key={`${row.moduleId}-${row.attempt}`}>
                    <TableCell className="font-medium">{row.moduleTitle ?? row.moduleId}</TableCell>
                    <TableCell>{row.credits ?? "-"}</TableCell>
                    <TableCell>
                      {row.letterGrade ? (
                        <Badge variant="secondary">{row.letterGrade}</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.resultStatus === "published" ? "secondary" : "outline"}>
                        {row.resultStatus ?? "draft"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/appeals">Request Appeal</Link>
          </Button>
          <Button asChild>
            <Link href="/student/progress">View Progress</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
