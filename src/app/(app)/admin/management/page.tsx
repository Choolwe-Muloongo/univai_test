// src/app/(app)/admin/management/page.tsx
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { type School, type Course } from '@/lib/data';
import { getSchoolsAndCourses, addSchool, addCourse, removeSchool, removeCourse } from './actions';
import { useFormStatus } from 'react-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton({ text }: { text: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} {text}
        </Button>
    )
}

function RemoveButton({ action, id, children }: { action: (id: string) => Promise<any>, id: string, children: React.ReactNode }) {
    const [isPending, setIsPending] = useState(false);
    
    const handleClick = async () => {
        setIsPending(true);
        await action(id);
        setIsPending(false);
    };

    return (
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleClick} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        </Button>
    )
}


export default function AdminManagementPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form States
    const [addSchoolState, addSchoolAction] = useActionState(addSchool, null);
    const [addCourseState, addCourseAction] = useActionState(addCourse, null);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { schools, courses } = await getSchoolsAndCourses();
            setSchools(schools);
            setCourses(courses);
            setLoading(false);
        }
        fetchData();
    }, [addSchoolState, addCourseState]); // Refetch when new items are added

    const handleRemoveSchool = async (id: string) => {
        await removeSchool(id);
        setSchools(schools.filter(school => school.id !== id));
        setCourses(courses.filter(course => course.schoolId !== id));
    };

    const handleRemoveCourse = async (id: string) => {
        await removeCourse(id);
        setCourses(courses.filter(course => course.id !== id));
    };

    if (loading) {
        return <div>Loading content...</div>
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                <p className="text-muted-foreground">Manage schools, programs, and other platform content.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* SCHOOL MANAGEMENT */}
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Schools</CardTitle>
                        <CardDescription>Add or remove schools from the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form action={addSchoolAction} className="flex gap-2">
                            <Input name="schoolName" placeholder="New school name" required/>
                            <SubmitButton text="Add School" />
                        </form>
                         {addSchoolState?.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{addSchoolState.error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2 rounded-lg border p-2 min-h-48">
                            {schools.map(school => (
                                <div key={school.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <span>{school.name}</span>
                                    <RemoveButton action={handleRemoveSchool} id={school.id}>
                                         <Trash2 className="h-4 w-4" />
                                    </RemoveButton>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* PROGRAM MANAGEMENT */}
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Programs</CardTitle>
                        <CardDescription>Add new programs to a selected school.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <form action={addCourseAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select School</Label>
                                <Select name="schoolId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a school" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map(school => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Program Title</Label>
                                <Input name="courseTitle" placeholder="e.g., Bachelor of Arts in History" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Program Description</Label>
                                <Input name="courseDescription" placeholder="A brief description of the program" required />
                            </div>
                             {addCourseState?.error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{addCourseState.error}</AlertDescription>
                                </Alert>
                            )}
                            <SubmitButton text="Add Program" />
                        </form>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Existing Programs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {schools.map(school => (
                        <div key={school.id}>
                            <h3 className="font-semibold text-lg mb-2">{school.name}</h3>
                            <div className="space-y-2">
                                {courses.filter(c => c.schoolId === school.id).map(course => (
                                     <div key={course.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted">
                                        <div>
                                            <p className='font-medium'>{course.title}</p>
                                            <p className='text-sm text-muted-foreground'>{course.description}</p>
                                        </div>
                                         <RemoveButton action={handleRemoveCourse} id={course.id}>
                                            <Trash2 className="h-4 w-4" />
                                        </RemoveButton>
                                    </div>
                                ))}
                                {courses.filter(c => c.schoolId === school.id).length === 0 && (
                                    <p className='text-sm text-muted-foreground p-2'>No programs in this school yet.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
