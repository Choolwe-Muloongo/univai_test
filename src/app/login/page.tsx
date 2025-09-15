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

type Role = 'student' | 'admin' | 'lecturer' | 'employer';
type StudentType = 'student-ict' | 'student-business';

const testUsers = {
    'student-ict': { email: 'student.ict@univai.edu', password: 'password123', schoolId: 'ict' },
    'student-business': { email: 'student.business@univai.edu', password: 'password123', schoolId: 'business' },
    admin: { email: 'admin@univai.edu', password: 'password123' },
    lecturer: { email: 'lecturer@univai.edu', password: 'password123' },
    employer: { email: 'employer@univai.edu', password: 'password123' },
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [studentType, setStudentType] = useState<StudentType>('student-ict');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if(activeTab === 'student') {
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('userSchoolId', testUsers[studentType].schoolId);
        router.push('/dashboard');
    } else {
        localStorage.setItem('userRole', activeTab);
        localStorage.removeItem('userSchoolId'); // Non-students don't have a school
        
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
                  <SelectItem value="student-ict">ICT Student (BSc CompSci)</SelectItem>
                  <SelectItem value="student-business">Business Student (MBA)</SelectItem>
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
        <CardFooter>
            <Button className="w-full" type="submit">Login as Student</Button>
        </CardFooter>
    </form>
  )

  const renderGenericLoginForm = (role: Exclude<Role, 'student'>) => (
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
