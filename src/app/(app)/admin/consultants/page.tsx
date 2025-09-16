// src/app/(app)/admin/consultants/page.tsx
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileText } from 'lucide-react';
import { consultantApplications as initialApplications } from '@/lib/data';

export default function ConsultantsApprovalPage() {
  const [applications, setApplications] = useState(initialApplications);

  const handleApprove = (id: string) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
  };

  const handleDeny = (id: string) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'Rejected' } : app));
  };

  const pendingApplications = applications.filter(app => app.status === 'Pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultant Applications</h1>
        <p className="text-muted-foreground">Review and approve new consultant (lecturer) applications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications ({pendingApplications.length})</CardTitle>
          <CardDescription>The following applications are awaiting your review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {pendingApplications.length > 0 ? (
            pendingApplications.map(app => (
              <Card key={app.id}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={app.avatar} alt={app.name} />
                    <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{app.name}</CardTitle>
                    <CardDescription>{app.department}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.documents.cv} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" /> View CV
                    </a>
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDeny(app.id)}><X className="mr-2 h-4 w-4" /> Deny</Button>
                  <Button size="sm" onClick={() => handleApprove(app.id)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground md:col-span-2">No pending applications.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Reviewed Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {applications.filter(app => app.status !== 'Pending').map(app => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={app.avatar} alt={app.name} />
                            <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{app.name}</p>
                            <p className="text-sm text-muted-foreground">{app.department}</p>
                        </div>
                    </div>
                    <Badge variant={app.status === 'Approved' ? 'default' : 'destructive'}>{app.status}</Badge>
                </div>
            ))}
        </CardContent>
      </Card>

    </div>
  );
}
