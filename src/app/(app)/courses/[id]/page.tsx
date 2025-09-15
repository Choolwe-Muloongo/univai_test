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

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  const courseLessons = lessons[params.id] || [];
  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);

  if (!course) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-lg">
          <Image
            src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/800/400`}
            alt={course.title}
            fill
            className="object-cover"
            data-ai-hint={placeholder?.imageHint || 'education'}
          />
        </div>
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight">{course.title}</h1>
        <p className="mb-6 text-lg text-muted-foreground">{course.description}</p>
        
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {courseLessons.map((lesson) => (
                <AccordionItem value={lesson.id} key={lesson.id}>
                  <AccordionTrigger className="text-base">{lesson.title}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {lesson.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Ready to test your knowledge?</CardTitle>
            <CardDescription>
              Take the final exam to complete the course and earn your certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full" asChild>
              <Link href={`/courses/${course.id}/exam`}>Start Exam</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
