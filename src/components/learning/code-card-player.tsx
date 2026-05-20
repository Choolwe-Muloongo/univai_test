'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Code2, Eye, FileCode2, Lightbulb, Play, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CodeCardBlock, CodeCardFile, CodeCardTest } from '@/lib/api/course-builder-types';

type CodeCardPlayerProps = {
  block: CodeCardBlock;
};

export function CodeCardPlayer({ block }: CodeCardPlayerProps) {
  const initialFiles = useMemo(() => filesToMap(block.files?.length ? block.files : block.starterFiles ?? []), [block.files, block.starterFiles]);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState(Object.keys(initialFiles)[0] ?? 'main.js');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const testResults = useMemo(() => runSimpleTests(files, block.tests ?? []), [files, block.tests]);
  const activeContent = files[activeFile] ?? '';

  function updateFile(value: string) {
    setFiles((current) => ({ ...current, [activeFile]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full gap-1"><Code2 className="size-3" />{block.language}</Badge>
          <Badge variant="outline" className="rounded-full capitalize">{block.type.replace(/_/g, ' ')}</Badge>
          {block.previewMode ? <Badge variant="secondary" className="rounded-full gap-1"><Eye className="size-3" />{block.previewMode}</Badge> : null}
          {block.aiHelpEnabled ? <Badge variant="outline" className="rounded-full">AI help enabled</Badge> : null}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{block.instructions}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(files).map((fileName) => (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => setActiveFile(fileName)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${activeFile === fileName ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/60'}`}
                >
                  {fileName}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <textarea
              value={activeContent}
              onChange={(event) => updateFile(event.target.value)}
              spellCheck={false}
              className="min-h-[340px] w-full resize-y bg-background p-4 font-mono text-sm outline-none"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" /> Checks</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {testResults.length ? testResults.map((result, index) => (
                <div key={`${result.label}-${index}`} className="flex items-start gap-2 rounded-xl border p-3">
                  <CheckCircle2 className={`mt-0.5 size-4 ${result.pass ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium">{result.pass ? 'Passed' : 'Needs work'}</p>
                    <p className="text-muted-foreground">{result.label}</p>
                  </div>
                </div>
              )) : <p className="text-muted-foreground">No automated checks were added for this card yet.</p>}
            </CardContent>
          </Card>

          {block.expectedOutput ? (
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Play className="size-4" /> Expected output</CardTitle></CardHeader>
              <CardContent><pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs"><code>{block.expectedOutput}</code></pre></CardContent>
            </Card>
          ) : null}

          {block.hints?.length ? (
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4" /> Hints</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowHints((value) => !value)}>{showHints ? 'Hide hints' : 'Show hints'}</Button>
                {showHints ? <ul className="space-y-2 text-sm text-muted-foreground">{block.hints.map((hint, index) => <li key={`${hint}-${index}`}>• {hint}</li>)}</ul> : null}
              </CardContent>
            </Card>
          ) : null}

          {block.solutionFiles?.length ? (
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileCode2 className="size-4" /> Solution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSolution((value) => !value)}>{showSolution ? 'Hide solution' : 'Reveal solution'}</Button>
                {showSolution ? <div className="space-y-3">{block.solutionFiles.map((file) => <div key={file.name}><p className="mb-1 text-xs font-semibold">{file.name}</p><pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs"><code>{file.content}</code></pre></div>)}</div> : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {block.previewMode === 'html' ? <HtmlPreview files={files} /> : null}
      {block.explanation ? <p className="text-sm leading-6 text-muted-foreground">{block.explanation}</p> : null}
    </div>
  );
}

function filesToMap(files: CodeCardFile[]) {
  return Object.fromEntries(files.map((file) => [file.name, file.content ?? '']));
}

function runSimpleTests(files: Record<string, string>, tests: CodeCardTest[]) {
  return tests.map((test) => {
    const fileContent = test.file ? files[test.file] ?? '' : Object.values(files).join('\n');
    const value = test.value ?? '';
    const label = test.description || `${test.type}${test.file ? ` in ${test.file}` : ''}${value ? `: ${value}` : ''}`;
    if (test.type === 'contains') return { label, pass: fileContent.includes(value) };
    if (test.type === 'not_contains') return { label, pass: !fileContent.includes(value) };
    if (test.type === 'equals') return { label, pass: fileContent.trim() === value.trim() };
    if (test.type === 'regex') {
      try { return { label, pass: new RegExp(value).test(fileContent) }; } catch { return { label, pass: false }; }
    }
    return { label, pass: false };
  });
}

function HtmlPreview({ files }: { files: Record<string, string> }) {
  const html = files['index.html'] ?? Object.entries(files).find(([name]) => name.endsWith('.html'))?.[1] ?? '';
  const css = files['style.css'] ?? Object.entries(files).filter(([name]) => name.endsWith('.css')).map(([, content]) => content).join('\n');
  const srcDoc = css ? html.replace('</head>', `<style>${css}</style></head>`) : html;
  if (!html.trim()) return null;
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="text-base">Live HTML preview</CardTitle></CardHeader>
      <CardContent className="p-0"><iframe title="Code card preview" sandbox="" srcDoc={srcDoc} className="h-[320px] w-full bg-white" /></CardContent>
    </Card>
  );
}
