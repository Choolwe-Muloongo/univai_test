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

export default function GraduationChecklistPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Graduation Checklist</h1>
        <p className="text-muted-foreground">
          Track every clearance item required for graduation approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
          <CardDescription>Items are updated by registrar and finance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Checklist items will appear once the registrar begins your clearance review.
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/graduation">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/support">Request Help</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
