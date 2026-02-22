import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
          <CardDescription>Awaiting registrar updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No graduation status updates yet. The registrar will publish updates once your clearance review begins.
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
