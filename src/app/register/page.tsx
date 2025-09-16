'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [coursesForSchool, setCoursesForSchool] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolId) {
      // In a real app, you'd fetch this from Firestore
      const schoolCourses = courses.filter(course => course.schoolId === schoolId);
      setCoursesForSchool(schoolCourses);
      setProgramId('');
    } else {
      setCoursesForSchool([]);
    }
  }, [schoolId]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        role: 'premium-student', // Default role for new signups
        schoolId: schoolId,
        programId: programId,
        createdAt: new Date(),
      });
      
      // 3. In a real app, you would handle file uploads to Firebase Storage here.
      
      alert(`Registration successful for ${email}! You can now log in.`);
      router.push('/login');

    } catch (error: any) {
      console.error("Registration error:", error);
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        setError(<>This email address is already in use. <Link href="/login" className="font-semibold underline">Login here.</Link></>);
      } else if (errorCode === 'auth/weak-password') {
        setError('The password is too weak. It must be at least 6 characters long.');
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-8">
      <div className='absolute left-4 top-4 md:left-8 md:top-8'>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Enroll at UnivAI</CardTitle>
          <CardDescription>Create your student account to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Registration Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" placeholder="Enter your full name" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="Enter your email" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Choose a password (min. 6 characters)" required />
                </div>
                <div className="space-y-2">
                    <Label>Select your School</Label>
                    <Select name="schoolId" value={schoolId} onValueChange={setSchoolId} required>
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
                    <Select name="programId" value={programId} onValueChange={setProgramId} required disabled={!schoolId}>
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
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
                 <p className="text-sm text-muted-foreground">
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
