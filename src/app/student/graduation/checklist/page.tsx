import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const checklist = [
  {
    id: "credits",
    label: "Complete required credits (120)",
    checked: true,
  },
  {
    id: "fees",
    label: "Clear all tuition and library fees",
    checked: false,
  },
  {
    id: "conduct",
    label: "No outstanding conduct holds",
    checked: true,
  },
  {
    id: "capstone",
    label: "Submit capstone project and defense",
    checked: false,
  },
  {
    id: "exit",
    label: "Complete exit survey",
    checked: false,
  },
];

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
          {checklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox id={item.id} defaultChecked={item.checked} />
              <label htmlFor={item.id} className="text-sm leading-relaxed">
                {item.label}
              </label>
            </div>
          ))}
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
