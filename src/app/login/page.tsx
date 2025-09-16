// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

type StudentType = 'premium-student' | 'freemium-student';

const testUsers = {
  'premium-student': {
    email: 'student.premium@univai.edu',
    password: 'password123',
    schoolId: 'ict',
    role: 'premium-student',
  },
  'freemium-student': {
    email: 'student.freemium@univai.edu',
    password: 'password123',
    schoolId: null,
    role: 'freemium-student',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [studentType, setStudentType] =
    useState<StudentType>('premium-student');

  const handleStudentLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = testUsers[studentType];
    localStorage.setItem('userRole', user.role);
    if (user.schoolId) {
      localStorage.setItem('userSchoolId', user.schoolId);
    } else {
      localStorage.removeItem('userSchoolId');
    }
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute left-8 top-8 flex items-center gap-2 text-lg font-semibold text-primary">
        <Logo className="size-8" />
        <Link href="/">UnivAI</Link>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Student Login</CardTitle>
            <CardDescription>
              Welcome back! Please log in to your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStudentLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Student Profile</Label>
                <Select
                  value={studentType}
                  onValueChange={value => setStudentType(value as StudentType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium-student">
                      Premium Student (Full Access)
                    </SelectItem>
                    <SelectItem value="freemium-student">
                      Freemium Student (Limited Access)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${studentType}-email`}>Email</Label>
                <Input
                  id={`${studentType}-email`}
                  type="email"
                  value={testUsers[studentType].email}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${studentType}-password`}>Password</Label>
                <Input
                  id={`${studentType}-password`}
                  type="password"
                  value={testUsers[studentType].password}
                  readOnly
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit">
                Login as Student
              </Button>
              <p className="text-sm text-muted-foreground">
                New student?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
