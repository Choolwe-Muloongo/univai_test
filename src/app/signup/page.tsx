import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-6 px-4 py-10">
      <section className="rounded-3xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI signup</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Choose your learning path</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Short courses are quick and self-paced. Formal programmes use the admissions flow when admissions are open.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-primary/30">
          <CardHeader><CardTitle>Short courses</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Create a learner account, enrol in short courses, practise with quizzes, and earn certificates after passing.</p>
            <Button asChild className="w-full"><Link href="/register/short-courses">Register for short courses</Link></Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Formal programmes</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Use this for diploma, degree, intake, admission, and official programme study.</p>
            <Button asChild variant="outline" className="w-full"><Link href="/register">Apply for a formal programme</Link></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
