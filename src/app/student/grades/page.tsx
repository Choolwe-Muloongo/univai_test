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

const summary = [
  { label: "Current GPA", value: "3.62", note: "Semester 2" },
  { label: "Credits Earned", value: "48", note: "Out of 120" },
  { label: "Academic Standing", value: "Good", note: "No holds" },
];

const gradeRows = [
  {
    course: "CS101 - Foundations of Computing",
    credits: 6,
    grade: "A-",
    status: "Published",
  },
  {
    course: "ICT104 - Digital Systems",
    credits: 6,
    grade: "B+",
    status: "Published",
  },
  {
    course: "MTH110 - Discrete Math",
    credits: 6,
    grade: "B",
    status: "Published",
  },
  {
    course: "COM201 - Technical Writing",
    credits: 3,
    grade: "A",
    status: "Published",
  },
  {
    course: "CS120 - Programming Lab",
    credits: 3,
    grade: "Pending",
    status: "In Review",
  },
];

export default function GradesPage() {
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
              {gradeRows.map((row) => (
                <TableRow key={row.course}>
                  <TableCell className="font-medium">{row.course}</TableCell>
                  <TableCell>{row.credits}</TableCell>
                  <TableCell>
                    {row.grade === "Pending" ? (
                      <Badge variant="outline">Pending</Badge>
                    ) : (
                      <Badge variant="secondary">{row.grade}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Published" ? "secondary" : "outline"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
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
