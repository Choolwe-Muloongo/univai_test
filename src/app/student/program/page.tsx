// src/app/(app)/program/page.tsx

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type ProgramModule } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Clock, BookOpen, ArrowRight, FileText } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { getProgram } from '@/lib/api';

export default async function ProgramPage() {
  const program = await getProgram();
  const placeholder = PlaceHolderImages.find((p) => p.id === program.imageId);

  // Group modules by semester
  const modulesBySemester = program.modules.reduce((acc, module) => {
    const semester = module.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(module);
    return acc;
  }, {} as Record<number, ProgramModule[]>);

  return (
    <div className="space-y-8">
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Image
          src={placeholder?.imageUrl || `https://picsum.photos/seed/${program.id}/1200/400`}
          alt={program.title}
          fill
          className="object-cover"
          data-ai-hint={placeholder?.imageHint || 'education'}
        />
        <div className="absolute inset-0 bg-black/50 flex items-end p-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{program.title}</h1>
            <p className="text-lg text-white/90">{program.description}</p>
          </div>
        </div>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle className="font-semibold">Kickstart Your Journey!</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Let our AI create a personalized study plan to guide you through your program.</span>
          <Button asChild>
            <Link href="/student/study-plan">Generate Study Plan <ArrowRight className="ml-2 h-4 w-4"/></Link>
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Program Toolkit</CardTitle>
          <CardDescription>Jump to the most-used academic tools.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/program/plan">Program Plan</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/program/grades">Grades</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/program/attendance">Attendance</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/program/assessments">Assessments</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modules</CardTitle>
            <CardDescription>Track each module and resume lessons.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program/modules">Open Modules</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessments</CardTitle>
            <CardDescription>Assignments and upcoming exams.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program/assessments">View Assessments</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
            <CardDescription>AI mastery and semester pace.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program/progress">See Progress</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support</CardTitle>
            <CardDescription>Advisor, registrar, and helpdesk.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program/support">Get Support</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Overall Program Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Your Progress</span>
              <span>{program.progress}%</span>
            </div>
            <Progress value={program.progress} className="h-4" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {Object.entries(modulesBySemester).map(([semester, modules]) => {
          const isExamAvailable = modules.some(m => m.isExamAvailable);
          return (
            <Card key={semester}>
              <CardHeader>
                <CardTitle>Semester {semester}</CardTitle>
                <CardDescription>
                  Here are the modules for semester {semester}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.map((module) => (
                  <Card key={module.id}>
                      <CardHeader>
                          <div className='flex justify-between items-start'>
                              <div>
                                  <CardTitle className='text-xl'>{module.title}</CardTitle>
                                  <CardDescription>{module.description}</CardDescription>
                              </div>
                              {module.progress === 100 ? (
                                  <div className='flex items-center gap-2 text-green-500'>
                                      <CheckCircle className='w-5 h-5'/>
                                      <span className='font-semibold'>Completed</span>
                                  </div>
                              ) : (
                                  <div className='flex items-center gap-2 text-muted-foreground'>
                                      <Clock className='w-5 h-5'/>
                                      <span className='font-semibold'>In Progress</span>
                                  </div>
                              )}
                          </div>
                      </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Module Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                      <Button asChild className='mt-4'>
                          <Link href={`/student/modules/${module.id}`}>Go to Module</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
              {isExamAvailable && (
                <CardFooter>
                    <Button asChild size="lg" className="w-full">
                        <Link href={`/student/program/semester/${semester}/exam`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Take Semester {semester} Exam
                        </Link>
                    </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
