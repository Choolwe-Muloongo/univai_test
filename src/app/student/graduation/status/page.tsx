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

const stages = [
  { name: "Academic review", status: "Completed" },
  { name: "Financial clearance", status: "Pending" },
  { name: "Registrar approval", status: "Pending" },
  { name: "Certificate issuance", status: "Locked" },
];

export default function GraduationStatusPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Graduation Status</h1>
        <p className="text-muted-foreground">
          Monitor clearance and approval milestones in real time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
          <CardDescription>Awaiting financial clearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted-foreground">45%</span>
          </div>
          <Progress value={45} className="h-2" />
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{stage.name}</span>
                <Badge variant={stage.status === "Completed" ? "secondary" : "outline"}>
                  {stage.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/graduation">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/support">Contact Registrar</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
