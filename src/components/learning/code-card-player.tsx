'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Eye,
  FileCode2,
  Lightbulb,
  ListChecks,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';

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

type IdeTab = 'editor' | 'preview' | 'trace' | 'terminal' | 'tasks' | 'rubric';

export function CodeCardPlayer({ block }: CodeCardPlayerProps) {
  const sourceFiles = useMemo(() => block.files?.length ? block.files : block.starterFiles ?? [], [block.files, block.starterFiles]);
  const fileMetaByName = useMemo(() => new Map(sourceFiles.map((file) => [file.name, file])), [sourceFiles]);
  const initialFiles = useMemo(() => filesToMap(sourceFiles), [sourceFiles]);
  const initialActiveFile = useMemo(() => Object.keys(initialFiles)[0] ?? defaultFileForLanguage(block.language), [block.language, initialFiles]);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState(initialActiveFile);
  const [activeTab, setActiveTab] = useState<IdeTab>('editor');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const testResults = useMemo(() => runSimpleTests(files, block.tests ?? [], block.expectedOutput), [files, block.tests, block.expectedOutput]);
  const activeContent = files[activeFile] ?? '';
  const activeFileMeta = fileMetaByName.get(activeFile);
  const activeFileReadonly = activeFileMeta?.readonly === true;
  const passedChecks = testResults.filter((result) => result.pass === true).length;
  const automaticChecks = testResults.filter((result) => result.pass !== null).length;
  const runnableInBrowser = block.previewMode === 'html' || block.language.toLowerCase() === 'javascript';

  useEffect(() => {
    setFiles(initialFiles);
    setActiveFile(initialActiveFile);
    setActiveTab('editor');
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
      <EngineHeader block={block} runnableInBrowser={runnableInBrowser} />
      <LearningPanel block={block} />

      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 p-2">
          <IdeTabButton active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} icon={<Code2 className="size-3" />} label="Editor" />
          <IdeTabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={<Eye className="size-3" />} label="Run / Preview" />
          <IdeTabButton active={activeTab === 'trace'} onClick={() => setActiveTab('trace')} icon={<ListChecks className="size-3" />} label="Trace" />
          <IdeTabButton active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} icon={<Terminal className="size-3" />} label="Terminal" />
          <IdeTabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ClipboardCheck className="size-3" />} label="Tasks" />
          <IdeTabButton active={activeTab === 'rubric'} onClick={() => setActiveTab('rubric')} icon={<ShieldCheck className="size-3" />} label="Rubric" />
        </div>

        <div className="p-3 sm:p-4">
          {activeTab === 'editor' ? (
            <EditorWorkspace
              files={files}
              activeFile={activeFile}
              activeContent={activeContent}
              activeFileReadonly={activeFileReadonly}
              fileMetaByName={fileMetaByName}
              setActiveFile={setActiveFile}
              updateFile={updateFile}
              resetFiles={resetFiles}
            />
          ) : null}

          {activeTab === 'preview' ? (
            <PreviewWorkspace files={files} block={block} testResults={testResults} passedChecks={passedChecks} automaticChecks={automaticChecks} />
          ) : null}

          {activeTab === 'trace' ? <TraceWorkspace block={block} files={files} /> : null}
          {activeTab === 'terminal' ? <TerminalWorkspace block={block} /> : null}
          {activeTab === 'tasks' ? <TaskWorkspace block={block} /> : null}
          {activeTab === 'rubric' ? <RubricWorkspace block={block} /> : null}
        </div>
      </div>

      <SupportPanels block={block} showHints={showHints} setShowHints={setShowHints} showSolution={showSolution} setShowSolution={setShowSolution} />
      {block.explanation ? <p className="text-sm leading-6 text-muted-foreground">{block.explanation}</p> : null}
    </div>
  );
}

function EngineHeader({ block, runnableInBrowser }: { block: CodeCardBlock; runnableInBrowser: boolean }) {
  const mode = block.learningMode || 'build';
  const status = block.runnerStatus || (runnableInBrowser ? 'browser_preview' : 'external_sandbox_required');
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full gap-1"><Code2 className="size-3" />{block.language}</Badge>
        <Badge variant="outline" className="rounded-full capitalize">{block.type.replace(/_/g, ' ')}</Badge>
        <Badge variant="secondary" className="rounded-full capitalize">{mode.replace(/_/g, ' ')}</Badge>
        <Badge variant="outline" className="rounded-full capitalize">{status.replace(/_/g, ' ')}</Badge>
        {block.previewMode ? <Badge variant="secondary" className="rounded-full gap-1"><Eye className="size-3" />{block.previewMode}</Badge> : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{block.instructions}</p>
      {status === 'external_sandbox_required' ? (
        <p className="mt-2 rounded-xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          This language needs a secure backend sandbox for real compilation. The current engine provides IDE editing, preview where possible, structure checks, trace teaching, terminal simulation, and manual review.
        </p>
      ) : null}
    </div>
  );
}

function LearningPanel({ block }: { block: CodeCardBlock }) {
  const concepts = block.concepts ?? [];
  const objectives = block.objectives ?? [];
  if (!block.theory && !concepts.length && !objectives.length && !block.projectBrief) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4" /> Teaching brief</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          {block.projectBrief ? <p className="rounded-xl border bg-muted/20 p-3 text-foreground">{block.projectBrief}</p> : null}
          {block.theory ? <p className="whitespace-pre-wrap">{block.theory}</p> : null}
          {concepts.length ? (
            <div className="grid gap-2">
              {concepts.map((concept, index) => (
                <div key={`${concept.name}-${index}`} className="rounded-xl border p-3">
                  <p className="font-semibold text-foreground">{concept.name}</p>
                  {concept.explanation ? <p>{concept.explanation}</p> : null}
                  {concept.example ? <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs"><code>{concept.example}</code></pre> : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {objectives.length ? <ListCard title="Objectives" items={objectives} /> : null}
    </div>
  );
}

function EditorWorkspace(props: {
  files: Record<string, string>;
  activeFile: string;
  activeContent: string;
  activeFileReadonly: boolean;
  fileMetaByName: Map<string, CodeCardFile>;
  setActiveFile: (file: string) => void;
  updateFile: (value: string) => void;
  resetFiles: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="min-w-0 overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(props.files).map((fileName) => {
                const isReadonly = props.fileMetaByName.get(fileName)?.readonly === true;
                return (
                  <button key={fileName} type="button" onClick={() => props.setActiveFile(fileName)} className={`rounded-full border px-3 py-1 text-xs transition ${props.activeFile === fileName ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/60'}`}>
                    <span className="inline-flex items-center gap-1">{isReadonly ? <Lock className="size-3" /> : null}{fileName}</span>
                  </button>
                );
              })}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={props.resetFiles} className="h-8 gap-1 rounded-full text-xs"><RotateCcw className="size-3" /> Reset</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {props.activeFileReadonly ? <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">This file is read-only. Use it as reference while editing the writable files.</div> : null}
          <textarea value={props.activeContent} onChange={(event) => props.updateFile(event.target.value)} readOnly={props.activeFileReadonly} spellCheck={false} className={`min-h-[420px] w-full resize-y p-4 font-mono text-sm outline-none ${props.activeFileReadonly ? 'bg-muted/40 text-muted-foreground' : 'bg-background'}`} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-base">IDE notes</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Use the editor like a mini IDE. Files marked with a lock are reference files.</p>
          <p>For HTML, CSS, and JavaScript, the preview tab can render the result in the browser.</p>
          <p>For Python, PHP, SQL, Java, C, and other compiled/server languages, a secure backend runner is needed before real execution.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewWorkspace({ files, block, testResults, passedChecks, automaticChecks }: { files: Record<string, string>; block: CodeCardBlock; testResults: CodeTestResult[]; passedChecks: number; automaticChecks: number }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {block.previewMode === 'html' ? <HtmlPreview files={files} /> : null}
        {block.language.toLowerCase() === 'javascript' && block.previewMode !== 'html' ? <JavaScriptPreview files={files} /> : null}
        {block.previewMode !== 'html' && block.language.toLowerCase() !== 'javascript' ? <RunnerNotice block={block} /> : null}
        {block.expectedOutput ? <ExpectedOutput value={block.expectedOutput} /> : null}
      </div>
      <ChecksPanel testResults={testResults} passedChecks={passedChecks} automaticChecks={automaticChecks} />
    </div>
  );
}

function TraceWorkspace({ block, files }: { block: CodeCardBlock; files: Record<string, string> }) {
  const trace = block.codeTrace ?? [];
  const fallbackLines = Object.values(files)[0]?.split('\n').slice(0, 12) ?? [];
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4" /> Code trace</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {trace.length ? trace.map((step, index) => (
          <div key={`${step.line ?? index}-${index}`} className="rounded-xl border p-3 text-sm">
            <p className="font-semibold">Step {index + 1}{step.line ? ` · line ${step.line}` : ''}</p>
            {step.code ? <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs"><code>{step.code}</code></pre> : null}
            {step.memory ? <p className="mt-2 text-muted-foreground"><strong>Memory:</strong> {step.memory}</p> : null}
            {step.output ? <p className="text-muted-foreground"><strong>Output:</strong> {step.output}</p> : null}
            {step.explanation ? <p className="text-muted-foreground">{step.explanation}</p> : null}
          </div>
        )) : fallbackLines.map((line, index) => (
          <div key={`${line}-${index}`} className="rounded-xl border p-3 text-sm">
            <p className="font-semibold">Line {index + 1}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs"><code>{line || ' '}</code></pre>
            <p className="mt-2 text-muted-foreground">Ask the learner: what changes in memory, control flow, or output after this line?</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TerminalWorkspace({ block }: { block: CodeCardBlock }) {
  const commands = block.terminalCommands ?? [];
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Terminal className="size-4" /> Terminal lab</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-4">
        {commands.length ? commands.map((command, index) => (
          <div key={`${command.command}-${index}`} className="rounded-xl bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
            <p><span className="text-zinc-400">$</span> {command.command}</p>
            {command.output ? <pre className="mt-2 whitespace-pre-wrap text-zinc-300">{command.output}</pre> : null}
            {command.explanation ? <p className="mt-2 whitespace-pre-wrap text-zinc-400"># {command.explanation}</p> : null}
          </div>
        )) : <p className="text-sm text-muted-foreground">Add terminalCommands to teach package installs, Git workflow, project setup, migrations, tests, or deployment commands.</p>}
      </CardContent>
    </Card>
  );
}

function TaskWorkspace({ block }: { block: CodeCardBlock }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ListCard title="Tasks" items={(block.tasks ?? []).map((task) => `${task.title || 'Task'} — ${task.description || 'Complete this task.'}`)} empty="No tasks were added yet." />
      <ListCard title="Mastery criteria" items={block.masteryCriteria ?? []} empty="No mastery criteria were added yet." />
      <ListCard title="Constraints" items={block.constraints ?? []} empty="No constraints were added yet." />
      <ListCard title="Deliverables" items={block.learnerDeliverables ?? []} empty="No deliverables were added yet." />
    </div>
  );
}

function RubricWorkspace({ block }: { block: CodeCardBlock }) {
  const rubric = block.evaluationRubric ?? [];
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" /> Review rubric</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rubric.length ? rubric.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-xl border p-3 text-sm">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.label}</p>{typeof item.points === 'number' ? <Badge variant="secondary">{item.points} pts</Badge> : null}</div>
            {item.description ? <p className="mt-1 text-muted-foreground">{item.description}</p> : null}
          </div>
        )) : <p className="text-sm text-muted-foreground">No rubric was added yet.</p>}
      </CardContent>
    </Card>
  );
}

function SupportPanels({ block, showHints, setShowHints, showSolution, setShowSolution }: { block: CodeCardBlock; showHints: boolean; setShowHints: (value: boolean) => void; showSolution: boolean; setShowSolution: (value: boolean) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {block.hints?.length ? (
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4" /> Hints</CardTitle></CardHeader><CardContent className="space-y-3"><Button type="button" variant="outline" size="sm" onClick={() => setShowHints(!showHints)}>{showHints ? 'Hide hints' : 'Show hints'}</Button>{showHints ? <ul className="space-y-2 text-sm text-muted-foreground">{block.hints.map((hint, index) => <li key={`${hint}-${index}`}>• {hint}</li>)}</ul> : null}</CardContent></Card>
      ) : null}
      {block.solutionFiles?.length ? (
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileCode2 className="size-4" /> Solution</CardTitle></CardHeader><CardContent className="space-y-3"><Button type="button" variant="outline" size="sm" onClick={() => setShowSolution(!showSolution)}>{showSolution ? 'Hide solution' : 'Reveal solution'}</Button>{showSolution ? <div className="space-y-3">{block.solutionFiles.map((file) => <div key={file.name}><p className="mb-1 text-xs font-semibold">{file.name}</p><pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs"><code>{file.content}</code></pre></div>)}</div> : null}</CardContent></Card>
      ) : null}
    </div>
  );
}

function ChecksPanel({ testResults, passedChecks, automaticChecks }: { testResults: CodeTestResult[]; passedChecks: number; automaticChecks: number }) {
  return (
    <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between gap-2 text-base"><span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Checks</span>{automaticChecks ? <Badge variant="secondary" className="rounded-full">{passedChecks}/{automaticChecks}</Badge> : null}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{testResults.length ? testResults.map((result, index) => <div key={`${result.label}-${index}`} className="flex items-start gap-2 rounded-xl border p-3">{result.pass === true ? <CheckCircle2 className="mt-0.5 size-4 text-primary" /> : result.pass === false ? <XCircle className="mt-0.5 size-4 text-destructive" /> : <AlertCircle className="mt-0.5 size-4 text-muted-foreground" />}<div><p className="font-medium">{result.pass === true ? 'Passed' : result.pass === false ? 'Needs work' : 'Manual review'}</p><p className="text-muted-foreground">{result.label}</p>{result.note ? <p className="mt-1 text-xs text-muted-foreground">{result.note}</p> : null}</div></div>) : <p className="text-muted-foreground">No checks were added for this card yet.</p>}<p className="text-xs text-muted-foreground">Browser checks inspect files. Real multi-language compilation needs a secure backend runner.</p></CardContent></Card>
  );
}

function IdeTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/60'}`}>{icon}{label}</button>;
}

function ListCard({ title, items, empty = 'Nothing added yet.' }: { title: string; items: string[]; empty?: string }) {
  return <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{items.length ? <ul className="space-y-2 text-sm text-muted-foreground">{items.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl border p-3">{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}</CardContent></Card>;
}

function ExpectedOutput({ value }: { value: string }) {
  return <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Play className="size-4" /> Expected output</CardTitle></CardHeader><CardContent><pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs"><code>{value}</code></pre></CardContent></Card>;
}

function RunnerNotice({ block }: { block: CodeCardBlock }) {
  return <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-base">Runner status</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{block.language} needs a secure backend sandbox before UnivAI can compile and run it safely. The IDE, trace, checks, project review, and terminal teaching still work now.</CardContent></Card>;
}

function JavaScriptPreview({ files }: { files: Record<string, string> }) {
  const source = files['main.js'] ?? Object.entries(files).find(([name]) => name.endsWith('.js'))?.[1] ?? '';
  const srcDoc = `<html><body><pre id="out"></pre><script>const out=document.getElementById('out');const old=console.log;console.log=(...args)=>{out.textContent+=args.join(' ')+'\\n';old(...args)};try{${source}}catch(error){out.textContent+='Error: '+error.message}</script></body></html>`;
  return <Card className="overflow-hidden rounded-2xl"><CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="text-base">JavaScript console preview</CardTitle></CardHeader><CardContent className="p-0"><iframe title="JavaScript preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-[260px] w-full bg-white" /></CardContent></Card>;
}

function HtmlPreview({ files }: { files: Record<string, string> }) {
  const html = files['index.html'] ?? Object.entries(files).find(([name]) => name.endsWith('.html'))?.[1] ?? '';
  const css = files['style.css'] ?? Object.entries(files).filter(([name]) => name.endsWith('.css')).map(([, content]) => content).join('\n');
  const js = files['script.js'] ?? Object.entries(files).filter(([name]) => name.endsWith('.js')).map(([, content]) => content).join('\n');
  const withCss = css ? html.includes('</head>') ? html.replace('</head>', `<style>${css}</style></head>`) : `<style>${css}</style>${html}` : html;
  const srcDoc = js ? withCss.includes('</body>') ? withCss.replace('</body>', `<script>${js}</script></body>`) : `${withCss}<script>${js}</script>` : withCss;
  if (!html.trim() && !css.trim() && !js.trim()) return null;
  return <Card className="overflow-hidden rounded-2xl"><CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="text-base">Live HTML preview</CardTitle></CardHeader><CardContent className="p-0"><iframe title="Code card preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-[320px] w-full bg-white" /></CardContent></Card>;
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
