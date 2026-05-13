'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createLecturerExamQuestion,
  deleteLecturerExamQuestion,
  getLecturerAssignments,
  getLecturerExamQuestions,
  updateLecturerExamQuestion,
  generateAi,
} from '@/lib/api';
import type { ExamQuestionRecord, LecturerAssignment } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2 } from 'lucide-react';

const emptyForm = {
  courseId: '',
  semester: '',
  question: '',
  optionsText: '',
  answer: '',
};

type AiQuestion = {
  question: string;
  options: string[];
  answer?: string | null;
};

export default function LecturerExamsPage() {
  const [assignments, setAssignments] = useState<LecturerAssignment[]>([]);
  const [questions, setQuestions] = useState<ExamQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [aiCourseId, setAiCourseId] = useState('');
  const [aiSemester, setAiSemester] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('standard');
  const [aiCount, setAiCount] = useState(3);
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSaving, setAiSaving] = useState(false);

  const courses = useMemo(() => {
    const map = new Map<string, LecturerAssignment>();
    assignments.forEach((assignment) => {
      if (!map.has(assignment.courseId)) {
        map.set(assignment.courseId, assignment);
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentData, questionData] = await Promise.all([
        getLecturerAssignments(),
        getLecturerExamQuestions(),
      ]);
      setAssignments(assignmentData);
      if (!aiCourseId && assignmentData.length > 0) {
        setAiCourseId(assignmentData[0].courseId);
      }
      setQuestions(questionData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const courseMatch = filterCourse === 'all' || question.courseId === filterCourse;
      const semesterMatch = filterSemester === 'all' || String(question.semester ?? '') === filterSemester;
      return courseMatch && semesterMatch;
    });
  }, [questions, filterCourse, filterSemester]);

  const handleEdit = (question: ExamQuestionRecord) => {
    setEditingId(question.id);
    setForm({
      courseId: question.courseId ?? '',
      semester: question.semester ? String(question.semester) : '',
      question: question.question,
      optionsText: question.options.join('\n'),
      answer: question.answer ?? '',
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const options = form.optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (options.length < 2) {
      setError('Provide at least 2 answer options.');
      return;
    }

    const payload = {
      courseId: form.courseId || null,
      semester: form.semester ? Number(form.semester) : null,
      question: form.question.trim(),
      options,
      answer: form.answer.trim() || null,
    };

    if (!payload.courseId) {
      setError('Select a course before saving.');
      return;
    }

    if (!payload.question) {
      setError('Question text is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateLecturerExamQuestion(editingId, payload);
      } else {
        await createLecturerExamQuestion(payload);
      }
      await loadData();
      handleReset();
    } catch (err) {
      console.error(err);
      setError('Failed to save exam question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exam question?')) return;
    try {
      await deleteLecturerExamQuestion(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete exam question.');
    }
  };

  const parseAiQuestions = (text: string): AiQuestion[] | null => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const candidate = start >= 0 && end > start ? text.slice(start, end + 1) : text;
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleGenerateAi = async () => {
    setAiError(null);
    setAiQuestions([]);
    if (!aiCourseId) {
      setAiError('Select a course for AI generation.');
      return;
    }
    setAiLoading(true);
    try {
      const courseLabel = courses.find((course) => course.courseId === aiCourseId)?.courseTitle ?? aiCourseId;
      const semesterLabel = aiSemester ? `Semester ${aiSemester}` : 'current semester';
      const topicLabel = aiTopic.trim() || 'core concepts and applied understanding';
      const prompt = `Create ${aiCount} multiple-choice exam questions for "${courseLabel}" (${semesterLabel}).
Focus on: ${topicLabel}.
Difficulty: ${aiDifficulty}.
Return JSON only in this format:
{"questions":[{"question":"...","options":["A","B","C","D"],"answer":"<exact option>"}]}`;
      const result = await generateAi({ prompt, mode: 'quiz' });
      const parsed = parseAiQuestions(result.text ?? '');
      if (!parsed || parsed.length === 0) {
        setAiError('AI response could not be parsed. Try again with a clearer topic.');
      } else {
        setAiQuestions(parsed);
      }
    } catch (err) {
      console.error(err);
      setAiError('AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseQuestion = (question: AiQuestion) => {
    setEditingId(null);
    setForm({
      courseId: aiCourseId,
      semester: aiSemester,
      question: question.question,
      optionsText: question.options.join('\n'),
      answer: question.answer ?? '',
    });
  };

  const handleAddAllAi = async () => {
    if (!aiCourseId || aiQuestions.length === 0) return;
    setAiSaving(true);
    try {
      for (const question of aiQuestions) {
        await createLecturerExamQuestion({
          courseId: aiCourseId,
          semester: aiSemester ? Number(aiSemester) : null,
          question: question.question,
          options: question.options,
          answer: question.answer ?? null,
        });
      }
      await loadData();
      setAiQuestions([]);
    } catch (err) {
      console.error(err);
      setAiError('Failed to save AI questions. Please try again.');
    } finally {
      setAiSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Bank</h1>
        <p className="text-muted-foreground">
          Create and manage questions for the courses you teach.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Question Library</CardTitle>
            <CardDescription>Filter by course and semester.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[220px]">
                <Label>Course</Label>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId}>
                        {course.courseTitle ?? course.courseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px]">
                <Label>Semester</Label>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        Semester {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading questions...</p>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions yet. Add your first one.</p>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{question.question}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.courseId && (
                            <Badge variant="secondary">{question.courseId.toUpperCase()}</Badge>
                          )}
                          {question.semester && (
                            <Badge variant="outline">Semester {question.semester}</Badge>
                          )}
                          {question.answer && (
                            <Badge variant="outline">Answer: {question.answer}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(question.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="rounded-md border px-3 py-2 text-sm">
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                AI Question Builder
              </CardTitle>
              <CardDescription>Generate exam questions with AI, then review before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {aiError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={aiCourseId} onValueChange={setAiCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId}>
                        {course.courseTitle ?? course.courseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={aiSemester}
                    onChange={(event) => setAiSemester(event.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question Count</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={aiCount}
                    onChange={(event) => setAiCount(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topic Focus</Label>
                <Input
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  placeholder="e.g. Normalization, ER models"
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundational">Foundational</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateAi} disabled={aiLoading || !aiCourseId}>
                {aiLoading ? 'Generating...' : 'Generate Questions'}
              </Button>

              {aiQuestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">AI Suggestions</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddAllAi}
                      disabled={aiSaving}
                    >
                      {aiSaving ? 'Saving...' : 'Add All to Bank'}
                    </Button>
                  </div>
                  {aiQuestions.map((question, index) => (
                    <div key={`${question.question}-${index}`} className="rounded-lg border p-3 space-y-2">
                      <p className="font-medium text-sm">{index + 1}. {question.question}</p>
                      <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                        {question.options.map((option) => (
                          <div key={option} className="rounded border px-2 py-1">
                            {option}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Answer: {question.answer ?? 'Not provided'}</span>
                        <Button size="sm" variant="outline" onClick={() => handleUseQuestion(question)}>
                          Use Question
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Question' : 'Add Question'}</CardTitle>
              <CardDescription>Keep questions aligned to the curriculum.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={form.courseId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, courseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId}>
                          {course.courseTitle ?? course.courseId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={form.semester}
                    onChange={(event) => setForm((prev) => ({ ...prev, semester: event.target.value }))}
                    placeholder="e.g. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={form.question}
                    onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
                    placeholder="Enter the question text"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <Textarea
                    value={form.optionsText}
                    onChange={(event) => setForm((prev) => ({ ...prev, optionsText: event.target.value }))}
                    placeholder={'Option A\nOption B\nOption C\nOption D'}
                  />
                  <p className="text-xs text-muted-foreground">One option per line.</p>
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    value={form.answer}
                    onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                    placeholder="Exact option text"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
