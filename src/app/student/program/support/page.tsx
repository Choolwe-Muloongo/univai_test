import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, PhoneCall, UserRound } from 'lucide-react';

export default function ProgramSupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Support</h1>
        <p className="text-muted-foreground">
          Reach your advisor, registrar, and support services in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advisor Directory</CardTitle>
            <CardDescription>Advisor details will appear once assignments are published.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Assigned advisors will show here.
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              support@univai.edu
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" className="flex-1" disabled>
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button className="flex-1" disabled>
              <PhoneCall className="mr-2 h-4 w-4" />
              Call
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Help Fast?</CardTitle>
          <CardDescription>Open a ticket or view support history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Academic Guidance</p>
            <p className="text-sm text-muted-foreground">
              Request help with modules, pacing, or eligibility concerns.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Finance & Billing</p>
            <p className="text-sm text-muted-foreground">
              Resolve invoices, scholarships, or reward locks.
            </p>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href="/student/support">Open Support Desk</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/support">View Tickets</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
