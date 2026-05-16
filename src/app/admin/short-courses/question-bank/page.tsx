'use client';

import { useEffect, useMemo, useState } from 'react';

import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { generateAi, getCourses } from '@/lib/api';
import type { Course } from '@/lib/api/types';
import { bulkCreateQuestionBankItems, createQuestionBankItem, getQuestionBank, type QuestionBankItem } from '@/lib/api/question-bank';

const difficulties = ['easy', 'medium', 'hard', 'very_hard'];
const questionTypes = ['mcq', 'true_false', 'fill_blank', 'short_answer'];

export default function ShortCourseQuestionBankPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [questionType, setQuestionType] = useState('mcq');
  const [count, setCount] = useState(50);
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [draftJson, setDraftJson] = useState('');
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptions, setManualOptions] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
      if (data[0]) setCourseId(data[0].id);
    }).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    getQuestionBank({ courseId }).then(setItems).catch(() => setItems([]));
  }, [courseId, message]);

  const stats = useMemo(() => difficulties.map((level) => ({ level, count: items.filter((item) => item.difficulty === level).length })), [items]);

  async function generateQuestions() {
    const course = courses.find((item) => item.id === courseId);
    if (!course) {
      setError('Choose a course first.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await generateAi({
        mode: 'general',
        feature: 'short_course_question_bank',
        audience: 'short-course learners',
        brandContext: 'UnivAI uses course questions for practice levels, timed quizzes and final assessment preparation.',
        prompt: `Generate exactly ${count} ${difficulty} ${questionType} questions for this short course. Course title: ${course.title}. Course description: ${course.description}. Use JSON only. Return an array of objects with: question, questionType, options, answer, explanation, difficulty, timeSeconds, tags. For MCQ provide 4 options. Difficulty must be ${difficulty}. questionType must be ${questionType}.`,
      });
      const raw = String((response as Record<string, unknown>).text || (response as Record<string, unknown>).output || (response as Record<string, unknown>).content || JSON.stringify(response));
      const parsed = JSON.parse(cleanJson(raw));
      const questions = (Array.isArray(parsed) ? parsed : parsed.questions ?? []).map((item: QuestionBankItem) => ({
        ...item,
        courseId,
        difficulty: item.difficulty || difficulty,
        questionType: item.questionType || questionType,
        source: 'ai',
      }));
      setDraftJson(JSON.stringify(questions, null, 2));
      setMessage('AI generated a question draft. Review the JSON, then save to the bank.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to generate questions.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true);
    setError(null);
    try {
      const parsed = JSON.parse(cleanJson(draftJson));
      const questions = (Array.isArray(parsed) ? parsed : parsed.questions ?? []).map((item: QuestionBankItem) => ({ ...item, courseId }));
      const response = await bulkCreateQuestionBankItems(questions);
      setMessage(`${response.count} questions saved to the bank.`);
      setDraftJson('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save question draft.');
    } finally {
      setBusy(false);
    }
  }

  async function saveManual() {
    if (!manualQuestion.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createQuestionBankItem({
        courseId,
        question: manualQuestion,
        questionType,
        options: manualOptions.split('\n').map((value) => value.trim()).filter(Boolean),
        answer: manualAnswer,
        explanation: manualExplanation,
        difficulty,
        source: 'manual',
      });
      setManualQuestion('');
      setManualOptions('');
      setManualAnswer('');
      setManualExplanation('');
      setMessage('Manual question saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save question.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ShortCourseShell title="Question Bank" description="Generate and manage large sets of course-focused questions for practice levels, timed quizzes and exams.">
      <div className="space-y-6">
        {error ? <PageError message={error} /> : null}
        {message ? <div className="rounded-xl border bg-muted/40 p-4 text-sm">{message}</div> : null}

        <Card>
          <CardHeader><CardTitle>Question bank setup</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <select className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{difficulties.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={questionType} onChange={(event) => setQuestionType(event.target.value)}>{questionTypes.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select>
            <input className="h-10 rounded-md border bg-background px-3 text-sm" type="number" min={1} max={200} value={count} onChange={(event) => setCount(Number(event.target.value))} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => <Card key={stat.level}><CardHeader><CardTitle className="text-sm capitalize">{stat.level.replace('_', ' ')}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stat.count}</CardContent></Card>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>AI question generation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Generate many questions for a selected course and difficulty. Review before saving.</p>
              <Button onClick={generateQuestions} disabled={busy || !courseId}>{busy ? 'Working...' : `Generate ${count} questions`}</Button>
              <Textarea rows={18} className="font-mono text-xs" value={draftJson} onChange={(event) => setDraftJson(event.target.value)} placeholder="Generated question JSON appears here." />
              <Button onClick={saveDraft} disabled={busy || !draftJson.trim()} className="w-full">Save draft questions to bank</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Manual question</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={4} value={manualQuestion} onChange={(event) => setManualQuestion(event.target.value)} placeholder="Question" />
              <Textarea rows={5} value={manualOptions} onChange={(event) => setManualOptions(event.target.value)} placeholder="Options, one per line" />
              <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={manualAnswer} onChange={(event) => setManualAnswer(event.target.value)} placeholder="Correct answer" />
              <Textarea rows={4} value={manualExplanation} onChange={(event) => setManualExplanation(event.target.value)} placeholder="Explanation shown after practice" />
              <Button onClick={saveManual} disabled={busy || !manualQuestion.trim()} className="w-full">Save manual question</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Current questions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.slice(0, 50).map((item) => <div key={item.id} className="rounded-xl border p-3 text-sm"><p className="font-medium">{item.question}</p><p className="mt-1 text-muted-foreground">{item.difficulty} · {item.questionType} · {item.source ?? 'manual'}</p></div>)}
            {!items.length ? <p className="text-sm text-muted-foreground">No questions yet for this course.</p> : null}
          </CardContent>
        </Card>
      </div>
    </ShortCourseShell>
  );
}

function cleanJson(raw: string) {
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}
