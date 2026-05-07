'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getCourseExamQuestions, payShortCourseCertificate, submitShortCourseExam } from '@/lib/api';

type Question = { question: string; options: string[]; answer?: string };

export default function ShortCourseExamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  useEffect(() => { getCourseExamQuestions(courseId).then(setQuestions); }, [courseId]);
  const submit = async () => setResult(await submitShortCourseExam(courseId, answers));
  const certificate = async () => { const r = await payShortCourseCertificate(courseId); const url = r.checkout_url ?? r.checkoutUrl; if (url) window.location.href = url; };
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Short-course exam</CardTitle></CardHeader><CardContent className="space-y-6">{questions.map((q, i) => <div key={q.question} className="rounded-lg border p-4"><p className="font-medium">{i + 1}. {q.question}</p><RadioGroup value={answers[i]} onValueChange={(value) => setAnswers((prev) => { const next = [...prev]; next[i] = value; return next; })}>{q.options.map((option) => <div key={option} className="mt-3 flex items-center gap-2"><RadioGroupItem value={option} id={`${i}-${option}`} /><Label htmlFor={`${i}-${option}`}>{option}</Label></div>)}</RadioGroup></div>)}<Button onClick={submit} className="bg-[#00694E] hover:bg-[#00563f]">Submit exam</Button>{result ? <div className="rounded-lg border p-4"><p className="font-bold">Score: {result.score}%</p><p>{result.passed ? 'Passed — you may now pay the certificate fee.' : 'Please review the course and try again.'}</p>{result.passed ? <Button onClick={certificate} className="mt-3">Pay certificate fee</Button> : null}</div> : null}</CardContent></Card><Button variant="outline" asChild><Link href={`/student/short-courses/${courseId}`}>Back to course</Link></Button></div>;
}
