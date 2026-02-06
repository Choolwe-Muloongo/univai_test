import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getConsultantApplicationById } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText } from 'lucide-react';

export default async function ConsultantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getConsultantApplicationById(id);
  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={application.avatar} alt={application.name} />
            <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.name}</h1>
            <p className="text-muted-foreground">{application.department}</p>
          </div>
        </div>
        <Badge variant={application.status === 'Approved' ? 'default' : application.status === 'Rejected' ? 'destructive' : 'secondary'}>
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>Review documents and verify credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This applicant has submitted required documentation for lecturer verification. Use the actions to review
              documents, request additional information, or finalize approval.
            </p>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Curriculum Vitae</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Identification Document</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Finalize the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">Approve Lecturer</Button>
            <Button variant="outline" className="w-full">Request More Info</Button>
            <Button variant="destructive" className="w-full">Reject</Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/consultants">Back to Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
