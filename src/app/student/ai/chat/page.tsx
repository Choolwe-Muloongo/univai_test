'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api/client';
import { useAiContext } from '@/lib/ai-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

const STORAGE_KEY = 'univai_ai_chat';

const suggestions = [
  'Explain the difference between hybrid and online learning in simple terms.',
  'Create a 5-step plan to catch up on missed lessons.',
  'Summarize my last lesson in bullet points.',
  'Give me 3 practice questions for this topic.',
];

async function requestAiResponse(prompt: string, context: string) {
  if (!API_BASE_URL) {
    return 'AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.';
  }

  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode: 'tutor', context }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'AI request failed');
  }

  const data = await response.json();
  return data.text as string;
}

export default function AiChatPage() {
  const context = useAiContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMessages(JSON.parse(stored) as ChatMessage[]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const historyPrompt = useMemo(() => {
    return messages
      .slice(-6)
      .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
      .join('\n');
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = `${historyPrompt}\nUser: ${userMessage.content}\nAssistant:`;
      const reply = await requestAiResponse(prompt, context);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply.trim() || 'No response returned.',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, the AI service is unavailable right now. Please try again.',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground">Ask questions, get explanations, and plan your next study steps.</p>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                UnivAI Assistant
              </CardTitle>
              <CardDescription>Responses are based on your prompts and recent context.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear chat
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={listRef}
            className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-4"
          >
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Start by asking a question about your program.</p>
            )}
            {messages.map((message) => (
              <div
                key={`${message.createdAt}-${message.role}`}
                className={`rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything about your courses, assignments, or study plan..."
              className="min-h-24"
            />
            <div className="flex items-center justify-end">
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

