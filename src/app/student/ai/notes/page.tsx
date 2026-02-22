'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpenCheck, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/client';
import { useAiContext } from '@/lib/ai-context';
import { getProgram } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AiNotesPage() {
  const context = useAiContext();
  const [topic, setTopic] = useState('');
  const [modules, setModules] = useState<{ id: string; title: string; semester?: number | null }[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [notes, setNotes] = useState('');
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
        setNotes('AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.');
        return;
      }
      const moduleContext = selectedModule
        ? modules.find((module) => module.id === selectedModule)
        : null;
      const moduleLabel = moduleContext
        ? `${moduleContext.title}${moduleContext.semester ? ` (Semester ${moduleContext.semester})` : ''}`
        : '';
      const focus = topic.trim() || moduleLabel || 'the current module';
      const response = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create concise study notes for: ${focus}. Include key terms, definitions, and 3 bullet takeaways.`,
          mode: 'summary',
          context,
        }),
      });
      const data = await response.json();
      setNotes(data.text || 'No notes returned.');
    } catch (error) {
      console.error(error);
      setNotes('Unable to generate notes right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Notes</h1>
        <p className="text-muted-foreground">
          Auto-generated summaries and key takeaways from your lessons.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Notes</CardTitle>
          <CardDescription>Enter a topic or lesson to generate study notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select module (optional)" />
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
            <Input
              placeholder="e.g., Database normalization (optional if module selected)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Notes</CardTitle>
          <CardDescription>Review and copy your AI-generated notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes ? (
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <BookOpenCheck className="mt-1 h-4 w-4 text-primary" />
                <Textarea value={notes} readOnly className="min-h-40" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Generate a topic to see notes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

