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
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/icons/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

type Role = 'student' | 'admin' | 'lecturer' | 'employer';
type StudentType = 'student-premium' | 'student-freemium';

const testUsers = {
    'student-premium': { email: 'student.premium@univai.edu', password: 'password123', schoolId: 'ict', role: 'premium-student' },
    'student-freemium': { email: 'student.freemium@univai.edu', password: 'password123', schoolId: null, role: 'freemium-student' },
    admin: { email: 'admin@univai.edu', password: 'password123', role: 'admin' },
    lecturer: { email: 'lecturer@univai.edu', password: 'password123', role: 'lecturer' },
    employer: { email: 'employer@univai.edu', password: 'password123', role: 'employer' },
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [studentType, setStudentType] = useState<StudentType>('student-premium');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if(activeTab === 'student') {
        const user = testUsers[studentType];
        localStorage.setItem('userRole', user.role);
        if (user.schoolId) {
            localStorage.setItem('userSchoolId', user.schoolId);
        } else {
            localStorage.removeItem('userSchoolId');
        }
        router.push('/dashboard');
    } else {
        const user = testUsers[activeTab as Exclude<Role, 'student'>];
        localStorage.setItem('userRole', user.role);
        localStorage.removeItem('userSchoolId');
        
        switch (activeTab) {
            case 'admin':
                router.push('/admin/dashboard');
                break;
            case 'lecturer':
                router.push('/lecturer/dashboard');
                break;
            case 'employer':
                router.push('/employer/dashboard');
                break;
            default:
                router.push('/dashboard');
                break;
        }
    }
  };

  const renderStudentLoginForm = () => (
    <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Student Profile</Label>
              <Select value={studentType} onValueChange={(value) => setStudentType(value as StudentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student-premium">Premium Student (Full Access)</SelectItem>
                  <SelectItem value="student-freemium">Freemium Student (Limited Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${studentType}-email`}>Email</Label>
                <Input id={`${studentType}-email`} type="email" value={testUsers[studentType].email} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${studentType}-password`}>Password</Label>
                <Input id={`${studentType}-password`} type="password" value={testUsers[studentType].password} readOnly />
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit">Login as Student</Button>
            <p className="text-sm text-muted-foreground">
                New student? <Link href="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
            </p>
        </CardFooter>
    </form>
  )

  const renderGenericLoginForm = (role: Exclude<Role, 'student'>) => {
    let footerText;
    switch(role) {
        case 'lecturer':
            footerText = <p className="text-sm text-muted-foreground">Not a consultant yet? <Link href="/lecturer/profile" className="font-semibold text-primary hover:underline">Apply here</Link></p>;
            break;
        case 'employer':
            footerText = <p className="text-sm text-muted-foreground">New employer? <Link href="/register" className="font-semibold text-primary hover:underline">Register here</Link></p>;
            break;
        case 'admin':
            footertext = null;
            break;
    }
    
    return (
    <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`${role}-email`}>Email</Label>
                <Input id={`${role}-email`} type="email" value={testUsers[role].email} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${role}-password`}>Password</Label>
                <Input id={`${role}-password`} type="password" value={testUsers[role].password} readOnly />
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit">Login as {role.charAt(0).toUpperCase() + role.slice(1)}</Button>
            {footerText}
        </CardFooter>
    </form>
  )};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className='absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary'>
        <Logo className="size-8" />
        <Link href="/">UnivAI</Link>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Role)} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="lecturer">Lecturer</TabsTrigger>
          <TabsTrigger value="employer">Employer</TabsTrigger>
        </TabsList>
        
        <Card className='mt-4'>
            <CardHeader className='text-center'>
                <CardTitle>Welcome to UnivAI</CardTitle>
                <CardDescription>Login to your account as a {activeTab}</CardDescription>
            </CardHeader>
            <TabsContent value="student" forceMount className={activeTab === 'student' ? '' : 'hidden'}>
                {renderStudentLoginForm()}
            </TabsContent>
            <TabsContent value="admin" forceMount className={activeTab === 'admin' ? '' : 'hidden'}>
                {renderGenericLoginForm('admin')}
            </TabsContent>
            <TabsContent value="lecturer" forceMount className={activeTab === 'lecturer' ? '' : 'hidden'}>
                {renderGenericLoginForm('lecturer')}
            </TabsContent>
            <TabsContent value="employer" forceMount className={activeTab === 'employer' ? '' : 'hidden'}>
                {renderGenericLoginForm('employer')}
            </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
