// src/app/(app)/admin/management/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { schools as initialSchools, courses as initialCourses, type School, type Course } from '@/lib/data';

export default function AdminManagementPage() {
    const [schools, setSchools] = useState<School[]>(initialSchools);
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    
    // State for forms
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseSchoolId, setNewCourseSchoolId] = useState('');
    const [newCourseDescription, setNewCourseDescription] = useState('');

    const handleAddSchool = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSchoolName.trim()) return;

        const newSchool: School = {
            id: newSchoolName.toLowerCase().replace(/\s+/g, '-'),
            name: newSchoolName,
        };

        setSchools([...schools, newSchool]);
        setNewSchoolName('');
    };

    const handleAddCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseTitle.trim() || !newCourseSchoolId || !newCourseDescription.trim()) return;

        const newCourse: Course = {
            id: `${newCourseSchoolId}-${Math.floor(100 + Math.random() * 900)}`,
            title: newCourseTitle,
            description: newCourseDescription,
            schoolId: newCourseSchoolId,
            progress: 0,
            imageId: `${Math.floor(1 + Math.random() * 5)}`, // Random image
        };

        setCourses([...courses, newCourse]);
        setNewCourseTitle('');
        setNewCourseDescription('');
        setNewCourseSchoolId('');
    };

    const handleRemoveSchool = (id: string) => {
        setSchools(schools.filter(school => school.id !== id));
        // Also remove courses associated with that school
        setCourses(courses.filter(course => course.schoolId !== id));
    };

    const handleRemoveCourse = (id: string) => {
        setCourses(courses.filter(course => course.id !== id));
    };


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
                        <form onSubmit={handleAddSchool} className="flex gap-2">
                            <Input
                                placeholder="New school name"
                                value={newSchoolName}
                                onChange={(e) => setNewSchoolName(e.target.value)}
                            />
                            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add School</Button>
                        </form>
                        <div className="space-y-2 rounded-lg border p-2">
                            {schools.map(school => (
                                <div key={school.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <span>{school.name}</span>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveSchool(school.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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
                        <form onSubmit={handleAddCourse} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select School</Label>
                                <Select onValueChange={setNewCourseSchoolId} value={newCourseSchoolId}>
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
                                <Input 
                                    placeholder="e.g., Bachelor of Arts in History"
                                    value={newCourseTitle}
                                    onChange={(e) => setNewCourseTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Program Description</Label>
                                <Input 
                                    placeholder="A brief description of the program"
                                    value={newCourseDescription}
                                    onChange={(e) => setNewCourseDescription(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/> Add Program</Button>
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
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveCourse(course.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
