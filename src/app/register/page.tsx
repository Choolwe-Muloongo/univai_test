// src/app/register/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/icons/logo';
import { schools, courses, type Course } from '@/lib/data';
import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [coursesForSchool, setCoursesForSchool] = useState<Course[]>([]);

  useEffect(() => {
    if (schoolId) {
      setCoursesForSchool(courses.filter(course => course.schoolId === schoolId));
      setProgramId(''); // Reset program selection when school changes
    } else {
      setCoursesForSchool([]);
    }
  }, [schoolId]);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, you would handle user creation and document upload here.
    // For this simulation, we generate a student number and redirect.
    const studentNumber = `UNIVAI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    alert(`Registration successful! Your new student number is ${studentNumber}. You can now log in.`);
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <div className='absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary'>
        <Logo className="size-8" />
        <Link href="/">UnivAI</Link>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Enroll at UnivAI</CardTitle>
          <CardDescription>Create your student account to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="Enter your full name" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Choose a password" required />
                </div>
                <div className="space-y-2">
                    <Label>Select your School</Label>
                    <Select value={schoolId} onValueChange={setSchoolId} required>
                        <SelectTrigger>
                        <SelectValue placeholder="Choose a school to enroll in" />
                        </SelectTrigger>
                        <SelectContent>
                            {schools.map(school => (
                                <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Program of Choice</Label>
                    <Select value={programId} onValueChange={setProgramId} required disabled={!schoolId}>
                        <SelectTrigger>
                        <SelectValue placeholder={schoolId ? "Select a program" : "Select a school first"} />
                        </SelectTrigger>
                        <SelectContent>
                            {coursesForSchool.map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="national-id">National ID</Label>
                  <div className="flex items-center gap-4">
                    <Input id="national-id" type="file" className="flex-1" required/>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a scan of your national ID card (PDF, JPG, or PNG).</p>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="certificate">High School Certificate</Label>
                  <div className="flex items-center gap-4">
                    <Input id="certificate" type="file" className="flex-1" required/>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a scan of your high school certificate (PDF, JPG, or PNG).</p>
                </div>
            </CardContent>
            <CardFooter className='flex-col gap-4'>
                <Button className="w-full" type="submit">Create Account</Button>
                 <p className="text-sm text-muted-foreground">
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
