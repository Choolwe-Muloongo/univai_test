'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCourseById, getLecturerAssignments, getCourseSessions, createCourseSession } from '@/lib/api';
import type { CourseSession, LecturerAssignment } from '@/lib/api/types';
import type { Course } from '@/lib/api/types';

export default function LecturerCourseSessionsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<LecturerAssignment[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);

  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState('lecture');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      const [courseData, lecturerAssignments] = await Promise.all([
        getCourseById(courseId),
        getLecturerAssignments(),
      ]);
      setCourse(courseData);
      setAssignments(lecturerAssignments.filter((assignment) => assignment.courseId === courseId));
      const defaultAssignment = lecturerAssignments.find((assignment) => assignment.courseId === courseId);
      if (defaultAssignment) {
        setSelectedAssignment(defaultAssignment.id.toString());
      }
    };
    load();
  }, [courseId]);

  useEffect(() => {
    const loadSessions = async () => {
      const assignment = assignments.find((item) => item.id.toString() === selectedAssignment);
      if (!assignment?.intakeId) {
        setSessions([]);
        return;
      }
      const data = await getCourseSessions(courseId, assignment.intakeId);
      setSessions(data);
    };
    loadSessions();
  }, [assignments, selectedAssignment, courseId]);

  const handleCreate = async () => {
    const assignment = assignments.find((item) => item.id.toString() === selectedAssignment);
    if (!assignment?.intakeId || !title) return;
    const created = await createCourseSession(courseId, {
      intakeId: assignment.intakeId,
      title,
      sessionType,
      dayOfWeek,
      startTime,
      endTime,
      location,
      meetingUrl,
    });
    setSessions((prev) => [created, ...prev]);
    setTitle('');
    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setMeetingUrl('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Sessions</h1>
        <p className="text-muted-foreground">
          {course?.title ?? 'Course'} - manage class sessions and attendance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Session</CardTitle>
          <CardDescription>Schedule lectures, labs, or tutorials.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Intake</Label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.intakeName ?? assignment.intakeId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Session Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lecture 1 - Intro" />
          </div>
          <div className="space-y-2">
            <Label>Session Type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Input value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)} placeholder="Wednesday" />
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input value={startTime} onChange={(event) => setStartTime(event.target.value)} placeholder="10:00" />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input value={endTime} onChange={(event) => setEndTime(event.target.value)} placeholder="11:30" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Room A1" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Meeting URL</Label>
            <Input value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://meet..." />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreate}>Add Session</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions</CardTitle>
          <CardDescription>Manage attendance for each session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {session.dayOfWeek ?? ''} {session.startTime ?? ''} - {session.endTime ?? ''}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/lecturer/courses/${courseId}/sessions/${session.id}`}>Mark Attendance</Link>
              </Button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

