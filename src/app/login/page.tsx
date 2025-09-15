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

type Role = 'student' | 'admin' | 'lecturer' | 'employer';

const testUsers = {
    student: { email: 'student@univai.edu', password: 'password123' },
    admin: { email: 'admin@univai.edu', password: 'password123' },
    lecturer: { email: 'lecturer@univai.edu', password: 'password123' },
    employer: { email: 'employer@univai.edu', password: 'password123' },
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Role>('student');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem('userRole', activeTab);
    
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
        case 'student':
        default:
            router.push('/dashboard');
            break;
    }
  };

  const renderLoginForm = (role: Role) => (
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
        <CardFooter>
            <Button className="w-full" type="submit">Login as {role.charAt(0).toUpperCase() + role.slice(1)}</Button>
        </CardFooter>
    </form>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className='absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary'>
        <Logo className="size-8" />
        UnivAI
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
                {renderLoginForm('student')}
            </TabsContent>
            <TabsContent value="admin" forceMount className={activeTab === 'admin' ? '' : 'hidden'}>
                {renderLoginForm('admin')}
            </TabsContent>
            <TabsContent value="lecturer" forceMount className={activeTab === 'lecturer' ? '' : 'hidden'}>
                {renderLoginForm('lecturer')}
            </TabsContent>
            <TabsContent value="employer" forceMount className={activeTab === 'employer' ? '' : 'hidden'}>
                {renderLoginForm('employer')}
            </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
