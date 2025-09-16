import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { courses, lessons } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, Code, FileDown, Rocket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  const courseLessons = lessons[params.id] || [];
  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);

  if (!course) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card className='overflow-hidden'>
            <CardContent className='p-0'>
                 <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <PlayCircle className="w-16 h-16 text-muted-foreground/50" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                     <div className="absolute bottom-4 left-4 text-white">
                        <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
                        <p className="text-lg text-white/90">Module Overview</p>
                    </div>
                </div>
            </CardContent>
        </Card>
       
        <div>
            <h2 className="text-2xl font-bold mb-4">Module Content</h2>
            <div className="space-y-6">
                {courseLessons.map((lesson, index) => (
                    <Card key={lesson.id} className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>
                                <span className='text-primary font-bold mr-2'>0{index + 1}</span>
                                {lesson.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="video" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="video"><PlayCircle className='mr-2'/> Video Lecture</TabsTrigger>
                                    <TabsTrigger value="exercise"><Code className='mr-2'/> Coding Exercise</TabsTrigger>
                                    <TabsTrigger value="resources"><FileDown className='mr-2'/> Resources</TabsTrigger>
                                </TabsList>
                                <TabsContent value="video" className="pt-4">
                                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                        <p className="text-muted-foreground">Video player for "{lesson.title}"</p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="exercise" className='pt-4'>
                                    <Card className='bg-muted/40 font-mono text-sm'>
                                        <CardHeader>
                                            <CardDescription className='font-sans'>
                                                Complete the exercise below to test your understanding.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className='bg-black p-4 rounded-md text-green-400'>
                                                <pre><code>{`# Python exercise for: ${lesson.title}\ndef hello_world():\n  # Your code here\n  print("Hello, World!")`}</code></pre>
                                            </div>
                                            <Button className='mt-4'>Run Code</Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="resources" className='pt-4 space-y-3'>
                                    <h3 className='font-semibold'>Downloadable Notes</h3>
                                    <p className='text-muted-foreground'>{lesson.content}</p>
                                    <Button variant='outline'><FileDown className='mr-2'/> Download Notes (PDF)</Button>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Rocket /> Get Started</CardTitle>
            <CardDescription>
              Begin your learning journey by enrolling or jump straight to the exam if you're ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button size="lg" className="w-full" asChild>
              <Link href={`/courses/${course.id}/exam`}>Enroll in Module</Link>
            </Button>
            <Separator className='my-4'/>
            <p className='text-sm text-center text-muted-foreground'>Ready to test your knowledge?</p>
            <Button size="lg" variant='secondary' className="w-full" asChild>
                <Link href={`/courses/${course.id}/exam`}>Start Final Exam</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
