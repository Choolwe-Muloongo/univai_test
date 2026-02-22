'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { useAiContext } from '@/lib/ai-context';
import { getProgram } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AiExamPrepPage() {
  const context = useAiContext();
  const [topic, setTopic] = useState('');
  const [modules, setModules] = useState<{ id: string; title: string; semester?: number | null }[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [questionCount, setQuestionCount] = useState('10');
  const [drill, setDrill] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const program = await getProgram();
        setModules(
          program.modules.map((module) => ({
            id: module.id,
            title: module.title,
            semester: module.semester,
          }))
        );
      } catch (error) {
        console.error('Failed to load modules', error);
      }
    };
    loadModules();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedModule) return;
    setLoading(true);
    try {
      if (!API_BASE_URL) {
        setDrill('AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.');
        return;
      }
      const moduleContext = selectedModule
        ? modules.find((module) => module.id === selectedModule)
        : null;
      const moduleLabel = moduleContext
        ? `${moduleContext.title}${moduleContext.semester ? ` (Semester ${moduleContext.semester})` : ''}`
        : '';
      const focus = topic.trim() || moduleLabel || 'the current module';
      const count = Number(questionCount) || 10;
      const response = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a ${count}-question exam prep drill focused on ${focus}. Difficulty: ${difficulty}. Provide questions with answer keys.`,
          mode: 'quiz',
          context,
        }),
      });
      const data = await response.json();
      setDrill(data.text || 'No drill returned.');
    } catch (error) {
      console.error(error);
      setDrill('Unable to generate drill right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Exam Prep</h1>
        <p className="text-muted-foreground">Practice with AI-generated drills and instant feedback.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a Drill</CardTitle>
          <CardDescription>Enter a topic to generate an exam prep drill.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Module (optional)</p>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
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
              <p className="text-sm font-medium">Difficulty</p>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="foundational">Foundational</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            placeholder="e.g., Python Basics (optional if module selected)"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <Input
            type="number"
            min={5}
            max={30}
            value={questionCount}
            onChange={(event) => setQuestionCount(event.target.value)}
            placeholder="Number of questions"
          />
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Drill
          </Button>
          {drill && <Textarea value={drill} readOnly className="min-h-48" />}
        </CardContent>
      </Card>
    </div>
  );
}

