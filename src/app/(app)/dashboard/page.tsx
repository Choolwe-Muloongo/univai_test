// src/app/(app)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { program, type Program } from '@/lib/data';
import { GraduationCap, Wallet, ArrowRight, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  if (!isClient) {
    // You can add a loading state here
    return <div>Loading...</div>;
  }

  const isFreemium = userRole === 'freemium-student';

  if (isFreemium) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Welcome to UnivAI!</CardTitle>
                        <CardDescription>
                            Your journey to higher education starts here. Upgrade to Premium to enroll in a program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Explore Our Programs</p>
                                <p className="text-sm text-muted-foreground">
                                    Browse our available schools and programs to find your fit.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/courses">
                            View All Courses <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="lg:col-span-1 space-y-6">
                <QuickLinks />
            </div>
        </div>
    );
  }


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>My Program</CardTitle>
                 <CardDescription>
                    Your central hub for course materials, progress, and modules.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{program.title}</p>
                        <p className="text-sm text-muted-foreground">
                            School of ICT
                        </p>
                    </div>
                </div>
                <div className='space-y-2'>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Overall Progress</span>
                        <span>{program.progress}%</span>
                    </div>
                    <Progress value={program.progress} className="h-4" />
                </div>
            </CardContent>
             <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/program">
                    Go to My Program <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Here's a breakdown of your progress by module.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <QuickLinks />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Wallet</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">925 AFTA</div>
                <p className="text-xs text-muted-foreground">AFTACOIN Balance</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/wallet">
                    View Wallet <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
