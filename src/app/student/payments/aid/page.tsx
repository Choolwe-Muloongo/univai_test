import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const scholarships = [
  { id: 'aid-01', title: 'STEM Excellence Scholarship', amount: '$1,200', status: 'Approved' },
  { id: 'aid-02', title: 'Community Impact Grant', amount: '$500', status: 'Pending' },
];

export default function StudentFinancialAidPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scholarships & Aid</h1>
          <p className="text-muted-foreground">Track financial aid awards and scholarship applications.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/payments">Back to Billing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Awards</CardTitle>
          <CardDescription>These awards reduce your tuition balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scholarships.map((award) => (
            <div key={award.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{award.title}</p>
                <p className="text-sm text-muted-foreground">{award.amount}</p>
              </div>
              <Badge variant={award.status === 'Approved' ? 'secondary' : 'outline'}>{award.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Apply for New Aid</CardTitle>
          <CardDescription>Share your story and submit supporting documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Start Application</Button>
        </CardContent>
      </Card>
    </div>
  );
}
