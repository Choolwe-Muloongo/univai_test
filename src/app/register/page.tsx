// src/app/register/page.tsx
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
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/icons/logo';
import { schools } from '@/lib/data';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState('');

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, you would handle user creation here.
    // For this simulation, we just redirect to the login page.
    alert('Registration successful! You can now log in.');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className='absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary'>
        <Logo className="size-8" />
        <Link href="/login">UnivAI</Link>
      </div>
      <Card className="w-full max-w-md">
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
