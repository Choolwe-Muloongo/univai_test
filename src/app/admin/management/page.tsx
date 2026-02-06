'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { type School, type Course } from '@/lib/data';
import { createCourse, createSchool, deleteCourse, deleteSchool, getCourses, getSchools } from '@/lib/api';

export default function AdminManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const schoolOptions = useMemo(() => schools, [schools]);

  useEffect(() => {
    const loadCatalog = async () => {
      const [schools, courses] = await Promise.all([getSchools(), getCourses()]);
      setSchools(schools);
      setCourses(courses);
    };
    loadCatalog();
  }, []);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolName.trim().length < 3) {
      setError('School name must be at least 3 characters long.');
      return;
    }
    const created = await createSchool(schoolName.trim());
    setSchools((prev) => [...prev, created]);
    setSchoolName('');
    setError(null);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDescription || !selectedSchoolId) {
      setError('All program fields are required.');
      return;
    }
    const created = await createCourse({
      id: courseTitle.toLowerCase().replace(/\s+/g, '-'),
      title: courseTitle,
      description: courseDescription,
      schoolId: selectedSchoolId,
      imageId: '1',
    });
    setCourses((prev) => [...prev, created]);
    setCourseTitle('');
    setCourseDescription('');
    setSelectedSchoolId('');
    setError(null);
  };

  const handleRemoveSchool = async (id: string) => {
    await deleteSchool(id);
    setSchools((prev) => prev.filter((school) => school.id !== id));
    setCourses((prev) => prev.filter((course) => course.schoolId !== id));
  };

  const handleRemoveCourse = async (id: string) => {
    await deleteCourse(id);
    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Manage schools and programs while the backend is offline.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Schools</CardTitle>
            <CardDescription>Add or remove schools from the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddSchool} className="flex gap-2">
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="New school name"
                required
              />
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </form>
            <div className="space-y-2 rounded-lg border p-2 min-h-48">
              {schools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{school.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSchool(school.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Programs</CardTitle>
            <CardDescription>Add new programs to a selected school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="space-y-2">
                <Label>Select School</Label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program Title</Label>
                <Input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Bachelor of Arts in History"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Program Description</Label>
                <Input
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="A brief description of the program"
                  required
                />
              </div>
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Program
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schools.map((school) => (
            <div key={school.id}>
              <h3 className="font-semibold text-lg mb-2">{school.name}</h3>
              <div className="space-y-2">
                {courses
                  .filter((course) => course.schoolId === school.id)
                  .map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {courses.filter((course) => course.schoolId === school.id).length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">No programs in this school yet.</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
