// src/app/(app)/program/page.tsx
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { program } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Clock, BookOpen, ArrowRight } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

export default function ProgramPage() {
  const placeholder = PlaceHolderImages.find((p) => p.id === program.imageId);

  return (
    <div className="space-y-8">
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Image
          src={placeholder?.imageUrl || `https://picsum.photos/seed/${program.id}/1200/400`}
          alt={program.title}
          fill
          className="object-cover"
          data-ai-hint={placeholder?.imageHint || 'education'}
        />
        <div className="absolute inset-0 bg-black/50 flex items-end p-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{program.title}</h1>
            <p className="text-lg text-white/90">{program.description}</p>
          </div>
        </div>
      </div>

       <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle className="font-semibold">Kickstart Your Journey!</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Let our AI create a personalized study plan to guide you through your program.</span>
          <Button asChild>
            <Link href="/study-plan">Generate Study Plan <ArrowRight className="ml-2 h-4 w-4"/></Link>
          </Button>
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Overall Program Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Your Progress</span>
              <span>{program.progress}%</span>
            </div>
            <Progress value={program.progress} className="h-4" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Modules</CardTitle>
          <CardDescription>
            Here are the modules you need to complete for your program.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {program.modules.map((module) => (
            <Card key={module.id}>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle className='text-xl'>{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                        </div>
                        {module.progress === 100 ? (
                            <div className='flex items-center gap-2 text-green-500'>
                                <CheckCircle className='w-5 h-5'/>
                                <span className='font-semibold'>Completed</span>
                            </div>
                        ) : (
                             <div className='flex items-center gap-2 text-muted-foreground'>
                                <Clock className='w-5 h-5'/>
                                <span className='font-semibold'>In Progress</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Module Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <Progress value={module.progress} className="h-2" />
                </div>
                 <Button asChild className='mt-4'>
                    <Link href={`/courses/${program.id}`}>Go to Module</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
