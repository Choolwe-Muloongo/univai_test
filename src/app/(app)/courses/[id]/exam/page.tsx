'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';


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
import { courses } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import Link from 'next/link';


const allQuestions = [
  {
    question: 'What is a key principle of software engineering?',
    options: ['Rapid Prototyping', 'Modularity and Separation of Concerns', 'Minimalism', 'Code Obfuscation'],
    answer: 'Modularity and Separation of Concerns',
  },
  {
    question: 'Which data structure operates on a Last-In, First-Out (LIFO) basis?',
    options: ['Queue', 'Stack', 'Linked List', 'Tree'],
    answer: 'Stack',
  },
  {
    question: 'What does SDLC stand for?',
    options: ['Software Design Life Cycle', 'System Development Life Cycle', 'Software Development Life Cycle', 'System Design Life Cycle'],
    answer: 'Software Development Life Cycle',
  },
  {
    question: 'What is the time complexity of a binary search algorithm?',
    options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
    answer: 'O(log n)',
  },
  {
    question: 'Which of the following is NOT a pillar of Object-Oriented Programming?',
    options: ['Inheritance', 'Polymorphism', 'Abstraction', 'Compilation'],
    answer: 'Compilation',
  }
];

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const course = courses.find((c) => c.id === id);
  
  const [questions, setQuestions] = useState(allQuestions.slice(0, 3));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [examResultId, setExamResultId] = useState<string | null>(null);

  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    setQuestions(shuffleArray(allQuestions).slice(0, 3));

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
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

    getCameraPermission();
  }, [toast]);


  if (!course) {
    notFound();
  }

  const saveExamResult = async (finalScore: number) => {
    setIsSaving(true);
    try {
        const userRole = localStorage.getItem('userRole');
        const userSchoolId = localStorage.getItem('userSchoolId');
        let userId = 'anonymous';

        if(userRole === 'student' && userSchoolId) {
            userId = `student-${userSchoolId}`;
        } else if (userRole) {
            userId = userRole;
        }

      const docRef = await addDoc(collection(db, "examResults"), {
        userId: userId,
        courseId: course.id,
        courseTitle: course.title,
        studentName: 'UnivAI Student', // Placeholder name
        score: Math.round((finalScore / questions.length) * 100),
        completedAt: serverTimestamp(),
      });
      setExamResultId(docRef.id);
    } catch (error) {
      console.error("Error saving exam result: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error saving your exam result.",
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
      saveExamResult(newScore);
    }
  };

  if (isFinished) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Exam Completed!</CardTitle>
            <CardDescription>You have completed the exam for {course.title}.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">Your Score: {Math.round((score / questions.length) * 100)}%</p>
            <p className="text-muted-foreground">You answered {score} out of {questions.length} questions correctly.</p>
            <div className='mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                {isSaving ? 'Saving result...' : <><CheckCircle className='w-4 h-4 text-green-500'/> Result saved securely.</>}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            {examResultId && (
              <Button className="w-full" asChild>
                  <Link href={`/certificate/${examResultId}`}>View Certificate</Link>
              </Button>
            )}
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard')}>
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
          <h1 className="text-3xl font-bold">Exam: {course.title}</h1>
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
            </Header>
            <CardContent>
                <p className='text-sm text-muted-foreground'>AI monitoring is active. Your activity during the exam is being logged.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
