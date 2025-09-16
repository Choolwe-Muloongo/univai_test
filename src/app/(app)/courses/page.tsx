'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { courses, schools, type School } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CoursesPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const schoolId = localStorage.getItem('userSchoolId');
    setUserRole(role);
    setUserSchoolId(schoolId);

    if (role === 'student' && schoolId) {
      setFilteredSchools(schools.filter((school) => school.id === schoolId));
    } else {
      setFilteredSchools(schools);
    }
  }, []);

  const pageTitle = userRole === 'student' ? 'My School' : 'Courses';
  const pageDescription = userRole === 'student' 
    ? 'Explore the program offered by your school.'
    : 'Explore programs from all our schools.';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      {filteredSchools.map((school) => (
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
                  <Card key={course.id} className="group flex h-full flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <Link href={`/courses/${course.id}`} className="flex h-full flex-col">
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
                      <CardContent className="flex-1">
                        <CardTitle className="mb-2 text-xl">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </CardContent>
                      <CardFooter>
                        <div className="w-full">
                          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </CardFooter>
                    </Link>
                  </Card>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
