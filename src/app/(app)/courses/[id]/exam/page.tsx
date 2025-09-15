'use client';

import { useState } from 'react';
import { notFound, useRouter } from 'next/navigation';

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

const questions = [
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
];

export default function ExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const course = courses.find((c) => c.id === params.id);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  if (!course) {
    notFound();
  }

  const handleNext = () => {
    if (selectedOption === questions[currentQuestionIndex].answer) {
      setScore(score + 1);
    }
    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
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
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
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
    <div className="mx-auto max-w-2xl">
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
  );
}
