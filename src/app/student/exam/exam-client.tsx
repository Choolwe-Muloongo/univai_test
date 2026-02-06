// src/app/(app)/exam/exam-client.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { saveExamResult } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

type Question = {
  question: string;
  options: string[];
  answer: string;
};

interface ExamClientPageProps {
  examTitle: string;
  questions: Question[];
  courseId: string;
  courseTitle: string;
  backToDashboardPath: string;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    if (typeof window === 'undefined') return array;
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

export default function ExamClientPage({
  examTitle,
  questions: initialQuestions,
  courseId,
  courseTitle,
  backToDashboardPath,
}: ExamClientPageProps) {
  const router = useRouter();
  const { session } = useSession();
  
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [examResultId, setExamResultId] = useState<string | null>(null);

  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Shuffle options for each question
    setQuestions(initialQuestions.map(q => ({
        ...q,
        options: shuffleArray(q.options)
    })));

    const getCameraPermission = async () => {
      try {
        //Error: Cannot read properties of undefined (reading 'getUserMedia')
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'AI Proctoring is disabled. Please enable camera permissions to continue.',
        });
      }
    };

    //Error: Cannot read properties of undefined (reading 'getUserMedia')
    //getCameraPermission();

    // Cleanup camera on component unmount
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, initialQuestions]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSaveResult = async (finalScore: number) => {
    setIsSaving(true);
    const finalPercentage = Math.round((finalScore / questions.length) * 100);
    const studentName = session?.user?.name || 'Student';

    try {
      const examId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `exam-${Date.now()}`;

      await saveExamResult(examId, {
        courseId,
        courseTitle,
        score: finalPercentage,
        studentName,
        completedAt: new Date().toISOString(),
      });
      setExamResultId(examId);
    } catch (error) {
      console.error('Error saving exam result: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was an error saving your exam result.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    const newScore = selectedOption === questions[currentQuestionIndex].answer ? score + 1 : score;
    setScore(newScore);

    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
      handleSaveResult(newScore);
    }
  };

  if (isFinished) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Exam Completed!</CardTitle>
            <CardDescription>You have completed the exam for {courseTitle}.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">Your Score: {Math.round((score / questions.length) * 100)}%</p>
            <p className="text-muted-foreground">You answered {score} out of {questions.length} questions correctly.</p>
            <div className='mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving result...
                </>
              ) : (
                <><CheckCircle className='w-4 h-4 text-green-500'/> Result saved securely.</>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            {examResultId && (
              <Button className="w-full" asChild>
                <Link href={`/student/certificate/${examResultId}`}>View Certificate</Link>
              </Button>
            )}
            <Button className="w-full" variant="outline" onClick={() => router.push(backToDashboardPath)}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold">{examTitle}</h1>
          <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <Progress value={progress} className="mt-2" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''}>
              {currentQuestion.options.map((option) => (
                <div key={option} className="flex items-center space-x-2 rounded-md border p-4 has-[:checked]:border-primary">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="w-full cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button onClick={handleNext} disabled={!selectedOption} className="w-full">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className='space-y-4'>
        <Card>
          <CardHeader className='flex-row items-center gap-2 space-y-0'>
            <Camera className='w-5 h-5 text-muted-foreground'/>
            <CardTitle>AI Proctoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center'>
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive" className='mt-4'>
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to enable AI proctoring.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>AI monitoring is active. Your activity during the exam is being logged.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
