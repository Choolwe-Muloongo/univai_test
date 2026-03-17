'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAi, getLecturerAssignments, getLecturerStudents, getProgramModulesByProgram, recordGrade } from '@/lib/api';
import type { LecturerAssignment, LecturerStudent } from '@/lib/api/types';
import type { ProgramModule } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export default function LecturerProgressPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<LecturerAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [students, setStudents] = useState<LecturerStudent[]>([]);
  const [modules, setModules] = useState<ProgramModule[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [finalPercentage, setFinalPercentage] = useState('');
  const [examScore, setExamScore] = useState('');
  const [resultStatus, setResultStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id.toString() === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );
  const selectedStudent = useMemo(
    () => students.find((student) => student.id.toString() === selectedStudentId),
    [students, selectedStudentId]
  );
  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId),
    [modules, selectedModuleId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getLecturerAssignments();
      setAssignments(data);
      const first = data[0];
      if (first) {
        setSelectedAssignmentId(first.id.toString());
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedAssignment?.intakeId) {
        setStudents([]);
        return;
      }
      const programId = selectedAssignment.programId ?? selectedAssignment.courseId;
      const [studentList, moduleList] = await Promise.all([
        getLecturerStudents(selectedAssignment.intakeId),
        getProgramModulesByProgram(programId),
      ]);
      setStudents(studentList);
      const filteredModules = selectedAssignment.moduleId
        ? moduleList.filter((module) => module.id === selectedAssignment.moduleId)
        : moduleList;
      setModules(filteredModules);
      setSelectedStudentId(studentList[0]?.id?.toString() ?? '');
      setSelectedModuleId(selectedAssignment.moduleId ?? filteredModules[0]?.id ?? '');
    };
    loadStudents();
  }, [selectedAssignment]);

  const handleRecordGrade = async () => {
    if (!selectedStudentId || !selectedModuleId || !finalPercentage) return;
    setSaving(true);
    try {
      await recordGrade({
        student_id: Number(selectedStudentId),
        module_id: selectedModuleId,
        final_percentage: Number(finalPercentage),
        exam_score: examScore ? Number(examScore) : null,
        result_status: resultStatus,
      });
      toast({
        title: 'Grade recorded',
        description: 'The student grade has been saved successfully.',
      });
      setFinalPercentage('');
      setExamScore('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to record grade',
        description: 'Please check the inputs and try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!selectedStudent || !selectedModule) {
      setAiError('Select a student and module first.');
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const prompt = `Write a concise feedback note (max 120 words) for ${selectedStudent.name ?? 'the student'}.
Module: ${selectedModule.title}.
Final percentage: ${finalPercentage || 'not recorded yet'}.
Exam score: ${examScore || 'not recorded'}.
Progress: ${selectedStudent.progress ?? 'N/A'}%.
GPA: ${selectedStudent.gpa ?? 'N/A'}.
Standing: ${selectedStudent.standing ?? 'good'}.
Include: 1) Summary, 2) Strengths, 3) Areas to improve, 4) Next actions. Use bullet points.`;
      const result = await generateAi({ prompt, mode: 'summary' });
      setAiFeedback(result.text ?? '');
    } catch (error) {
      console.error(error);
      setAiError('Failed to generate feedback. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyFeedback = async () => {
    if (!aiFeedback) return;
    try {
      await navigator.clipboard.writeText(aiFeedback);
      toast({ title: 'Copied', description: 'Feedback copied to clipboard.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Unable to copy feedback.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
          <p className="text-muted-foreground">Track performance and intervene early where needed.</p>
        </div>
        <Button variant="outline">Export Report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Intake</CardTitle>
          <CardDescription>Select the cohort you want to manage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select intake" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                  {assignment.intakeName ?? assignment.courseTitle ?? assignment.courseId}
                  {assignment.moduleTitle ? ` - ${assignment.moduleTitle}` : ''}
                  {assignment.moduleSemester ? ` (Sem ${assignment.moduleSemester})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Cohort</CardTitle>
          <CardDescription>Latest progress and engagement across your courses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <p className="text-sm text-muted-foreground">Loading students...</p>}
          {!loading && students.length === 0 && (
            <p className="text-sm text-muted-foreground">No students enrolled for this intake yet.</p>
          )}
          {students.map((student) => (
            <div key={student.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={student.avatar || `https://i.pravatar.cc/80?u=${student.email}`} alt={student.name} />
                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <Badge variant={student.standing === 'good' ? 'default' : student.standing === 'probation' ? 'secondary' : 'destructive'}>
                  {student.standing ?? 'good'}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{student.progress ?? 0}%</span>
                </div>
                <Progress value={student.progress ?? 0} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>GPA: {student.gpa?.toFixed(2) ?? 'N/A'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Grades</CardTitle>
          <CardDescription>Capture results for students in this intake.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Final Percentage</Label>
            <Input value={finalPercentage} onChange={(event) => setFinalPercentage(event.target.value)} placeholder="e.g. 78" />
          </div>
          <div className="space-y-2">
            <Label>Exam Score (optional)</Label>
            <Input value={examScore} onChange={(event) => setExamScore(event.target.value)} placeholder="e.g. 62" />
          </div>
          <div className="space-y-2">
            <Label>Result Status</Label>
            <Select value={resultStatus} onValueChange={setResultStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Save as draft while CA is still being compiled. Publish only when you are ready for students to see results.
            </p>
          </div>
          <div className="flex items-end">
            <Button onClick={handleRecordGrade} disabled={saving || !selectedStudentId || !selectedModuleId || !finalPercentage}>
              {saving ? 'Saving...' : 'Record Grade'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Feedback Assistant</CardTitle>
          <CardDescription>Generate a personalized feedback note based on performance signals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {aiError}
            </div>
          )}
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {selectedStudent ? (
              <>
                Preparing feedback for <span className="font-semibold">{selectedStudent.name}</span> in{' '}
                <span className="font-semibold">{selectedModule?.title ?? 'selected module'}</span>.
              </>
            ) : (
              'Select a student and module above to generate feedback.'
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerateFeedback} disabled={aiLoading || !selectedStudent || !selectedModule}>
              {aiLoading ? 'Generating...' : 'Generate Feedback'}
            </Button>
            <Button variant="outline" onClick={handleCopyFeedback} disabled={!aiFeedback}>
              Copy Feedback
            </Button>
          </div>
          <Textarea
            value={aiFeedback}
            onChange={(event) => setAiFeedback(event.target.value)}
            placeholder="AI-generated feedback will appear here."
            className="min-h-32"
          />
        </CardContent>
      </Card>
    </div>
  );
}


