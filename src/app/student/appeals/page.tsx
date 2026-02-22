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
import { FileText, AlertCircle, Clock } from "lucide-react";

export default function AppealsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appeals</h1>
        <p className="text-muted-foreground">
          Submit and track academic appeals with full audit trail.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Start a New Appeal</CardTitle>
            <CardDescription>
              Appeals are reviewed by the academic council within 5 working days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <FileText className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Choose assessment</p>
                <p className="text-sm text-muted-foreground">
                  Select the course and assessment you want reviewed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertCircle className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Explain the issue</p>
                <p className="text-sm text-muted-foreground">
                  Provide a clear summary and attach supporting evidence.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Clock className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Track the decision</p>
                <p className="text-sm text-muted-foreground">
                  You will receive updates at each review stage.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/student/support">Submit Appeal Request</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Appeals</CardTitle>
            <CardDescription>Status updates for your requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No appeal requests yet. Submit an appeal to see updates here.
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/student/grades">Back to Grades</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
