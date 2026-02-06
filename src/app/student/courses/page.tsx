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
import { type School, type Course } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CourseCardSkeleton } from '@/components/ui/course-card-skeleton';
import { getSchools, getCourses } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

export default function CoursesPage() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      const role = session?.user?.role ?? null;
      const schoolId = session?.user?.schoolId ?? null;
      setUserRole(role);
      setUserSchoolId(schoolId);

      const [schools, courses] = await Promise.all([getSchools(), getCourses()]);
      setAllSchools(schools);
      setAllCourses(courses);

      const isStudent = role === 'student' || role === 'premium-student';
      if (isStudent && schoolId) {
        setFilteredSchools(schools.filter((school) => school.id === schoolId));
      } else {
        setFilteredSchools(schools);
      }
      setLoading(false);
    };
    loadCatalog();
  }, [session]);


  const isStudent = userRole === 'student' || userRole === 'premium-student';
  const pageTitle = isStudent ? 'My School' : 'All Schools';
  const pageDescription = isStudent 
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

       {loading ? (
        <section>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                  <CourseCardSkeleton key={i} />
              ))}
          </div>
        </section>
      ) : (
        filteredSchools.map((school) => {
          const schoolCourses = allCourses.filter((course) => course.schoolId === school.id);
          return (
            <section key={school.id}>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">{school.name}</h2>
              {schoolCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {schoolCourses.map((course) => {
                    const placeholder = PlaceHolderImages.find(
                      (p) => p.id === course.imageId
                    );
                    return (
                      <Card key={course.id} className="group flex h-full flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                        <Link href={`/student/courses/${course.id}`} className="flex h-full flex-col">
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
                                <span>{course.progress || 0}%</span>
                              </div>
                              <Progress value={course.progress || 0} className="h-2" />
                            </div>
                          </CardFooter>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <h3 className="text-xl font-semibold">No Programs Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are no programs available for this school at the moment. Please check back later.
                  </p>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
