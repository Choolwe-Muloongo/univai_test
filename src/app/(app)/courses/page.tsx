import Image from 'next/image';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { courses, schools } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Explore programs from all our schools.
        </p>
      </div>

      {schools.map((school) => (
        <section key={school.id}>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{school.name}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((course) => course.schoolId === school.id)
              .map((course) => {
                const placeholder = PlaceHolderImages.find(
                  (p) => p.id === course.imageId
                );
                return (
                  <Link
                    href={`/courses/${course.id}`}
                    key={course.id}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden transition-all group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                          <Image
                            src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/600/400`}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            data-ai-hint={placeholder?.imageHint || 'education'}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <CardTitle className="mb-2 text-xl">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </CardContent>
                      <CardFooter className="p-6 pt-0">
                        <div className="w-full">
                          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
