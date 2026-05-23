'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Code2, Eye, FileCode2, Lightbulb, Lock, Play, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CodeCardBlock, CodeCardFile, CodeCardTest } from '@/lib/api/course-builder-types';

type CodeCardPlayerProps = {
  block: CodeCardBlock;
};

type CodeTestResult = {
  label: string;
  pass: boolean | null;
  note?: string;
};

export function CodeCardPlayer({ block }: CodeCardPlayerProps) {
  const sourceFiles = useMemo(() => block.files?.length ? block.files : block.starterFiles ?? [], [block.files, block.starterFiles]);
  const fileMetaByName = useMemo(() => new Map(sourceFiles.map((file) => [file.name, file])), [sourceFiles]);
  const initialFiles = useMemo(() => filesToMap(sourceFiles), [sourceFiles]);
  const initialActiveFile = useMemo(() => Object.keys(initialFiles)[0] ?? defaultFileForLanguage(block.language), [block.language, initialFiles]);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState(initialActiveFile);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const testResults = useMemo(() => runSimpleTests(files, block.tests ?? [], block.expectedOutput), [files, block.tests, block.expectedOutput]);
  const activeContent = files[activeFile] ?? '';
  const activeFileMeta = fileMetaByName.get(activeFile);
  const activeFileReadonly = activeFileMeta?.readonly === true;
  const passedChecks = testResults.filter((result) => result.pass === true).length;
  const automaticChecks = testResults.filter((result) => result.pass !== null).length;

  useEffect(() => {
    setFiles(initialFiles);
    setActiveFile(initialActiveFile);
    setShowHints(false);
    setShowSolution(false);
  }, [initialActiveFile, initialFiles]);

  function updateFile(value: string) {
    if (activeFileReadonly) return;
    setFiles((current) => ({ ...current, [activeFile]: value }));
  }

  function resetFiles() {
    setFiles(initialFiles);
    setActiveFile(initialActiveFile);
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {Object.keys(files).map((fileName) => {
                  const isReadonly = fileMetaByName.get(fileName)?.readonly === true;
                  return (
                    <button
                      key={fileName}
                      type="button"
                      onClick={() => setActiveFile(fileName)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${activeFile === fileName ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/60'}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {isReadonly ? <Lock className="size-3" /> : null}
                        {fileName}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={resetFiles} className="h-8 gap-1 rounded-full text-xs">
                <RotateCcw className="size-3" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeFileReadonly ? (
              <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                This file is read-only. Use it as reference while editing the writable files.
              </div>
            ) : null}
            <textarea
              value={activeContent}
              onChange={(event) => updateFile(event.target.value)}
              readOnly={activeFileReadonly}
              spellCheck={false}
              className={`min-h-[340px] w-full resize-y p-4 font-mono text-sm outline-none ${activeFileReadonly ? 'bg-muted/40 text-muted-foreground' : 'bg-background'}`}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Visual/structure checks</span>
                {automaticChecks ? <Badge variant="secondary" className="rounded-full">{passedChecks}/{automaticChecks}</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {testResults.length ? testResults.map((result, index) => (
                <div key={`${result.label}-${index}`} className="flex items-start gap-2 rounded-xl border p-3">
                  {result.pass === true ? <CheckCircle2 className="mt-0.5 size-4 text-primary" /> : result.pass === false ? <XCircle className="mt-0.5 size-4 text-destructive" /> : <AlertCircle className="mt-0.5 size-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">{result.pass === true ? 'Passed' : result.pass === false ? 'Needs work' : 'Manual review'}</p>
                    <p className="text-muted-foreground">{result.label}</p>
                    {result.note ? <p className="mt-1 text-xs text-muted-foreground">{result.note}</p> : null}
                  </div>
                </div>
              )) : <p className="text-muted-foreground">No visual/structure checks were added for this card yet.</p>}
              <p className="text-xs text-muted-foreground">These checks inspect the written files in the browser. Full server-side execution should be added later for real unit tests.</p>
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

function defaultFileForLanguage(language: string) {
  const normalized = language.toLowerCase();
  if (normalized.includes('python')) return 'main.py';
  if (normalized.includes('php')) return 'index.php';
  if (normalized.includes('html')) return 'index.html';
  if (normalized.includes('css')) return 'style.css';
  if (normalized.includes('sql')) return 'query.sql';
  return 'main.js';
}

function runSimpleTests(files: Record<string, string>, tests: CodeCardTest[], expectedOutput?: string): CodeTestResult[] {
  return tests.map((test) => {
    const fileContent = test.file ? files[test.file] ?? '' : Object.values(files).join('\n');
    const value = test.value ?? '';
    const label = test.description || `${test.type}${test.file ? ` in ${test.file}` : ''}${value ? `: ${value}` : ''}`;
    if (test.type === 'contains') return { label, pass: fileContent.includes(value) };
    if (test.type === 'not_contains') return { label, pass: !fileContent.includes(value) };
    if (test.type === 'equals') return { label, pass: fileContent.trim() === value.trim() };
    if (test.type === 'regex') {
      try { return { label, pass: new RegExp(value).test(fileContent) }; } catch { return { label, pass: false, note: 'The regex pattern is invalid.' }; }
    }
    if (test.type === 'stdout_contains') {
      if (!expectedOutput) return { label, pass: null, note: 'No executable runtime is connected yet, so output checks need manual review.' };
      return { label, pass: expectedOutput.includes(value), note: 'Compared against the expected output text, not live execution.' };
    }
    return { label, pass: null, note: 'This check type needs the future execution engine.' };
  });
}

function HtmlPreview({ files }: { files: Record<string, string> }) {
  const html = files['index.html'] ?? Object.entries(files).find(([name]) => name.endsWith('.html'))?.[1] ?? '';
  const css = files['style.css'] ?? Object.entries(files).filter(([name]) => name.endsWith('.css')).map(([, content]) => content).join('\n');
  const js = files['script.js'] ?? Object.entries(files).filter(([name]) => name.endsWith('.js')).map(([, content]) => content).join('\n');
  const withCss = css ? html.includes('</head>') ? html.replace('</head>', `<style>${css}</style></head>`) : `<style>${css}</style>${html}` : html;
  const srcDoc = js ? withCss.includes('</body>') ? withCss.replace('</body>', `<script>${js}</script></body>`) : `${withCss}<script>${js}</script>` : withCss;
  if (!html.trim() && !css.trim() && !js.trim()) return null;
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="text-base">Live HTML preview</CardTitle></CardHeader>
      <CardContent className="p-0"><iframe title="Code card preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-[320px] w-full bg-white" /></CardContent>
    </Card>
  );
}
