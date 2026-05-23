'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AnimatedAccountingTable({ columns, rows, title = 'Accounting workpaper' }: { columns: string[]; rows: unknown[][]; title?: string }) {
  const safeRows = useMemo(() => rows.map((row) => row.map((cell) => String(cell ?? ''))), [rows]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(() => Math.max(safeRows.length - 1, 0));
  const maxStep = Math.max(safeRows.length - 1, 0);
  const visibleRows = safeRows.slice(0, step + 1);

  useEffect(() => {
    setStep(maxStep);
    setIsPlaying(false);
  }, [maxStep, columns.length]);

  useEffect(() => {
    if (!isPlaying || !safeRows.length) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= maxStep) {
          window.clearInterval(timer);
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 750);
    return () => window.clearInterval(timer);
  }, [isPlaying, maxStep, safeRows.length]);

  const replay = () => {
    setStep(0);
    setIsPlaying(safeRows.length > 1);
  };

  return (
    <div className="space-y-2">
      {safeRows.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="truncate">Animated walkthrough · {title} · row {Math.min(step + 1, safeRows.length)} of {safeRows.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setStep((current) => Math.max(0, current - 1))} aria-label="Previous accounting row">
              <ChevronLeft className="size-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setIsPlaying((current) => !current)} aria-label={isPlaying ? 'Pause accounting animation' : 'Play accounting animation'}>
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setStep((current) => Math.min(maxStep, current + 1))} aria-label="Next accounting row">
              <ChevronRight className="size-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={replay} aria-label="Replay accounting animation">
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-2xl border">
        <table className="w-full table-fixed text-[11px] sm:text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column, columnIndex) => (
                <th key={`${column}-${columnIndex}`} className="break-words px-2 py-2 text-left align-top font-semibold sm:px-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${row.join('|')}`}
                className="border-t transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-2"
              >
                {Array.from({ length: columns.length }).map((_, cellIndex) => {
                  const cell = row[cellIndex] ?? '';
                  const isMoneyLike = /(^\(?-?K?\d)|\d\.\d|\d,%|\)$/.test(cell.trim());
                  const isFinalRow = rowIndex === visibleRows.length - 1 && visibleRows.length === safeRows.length;
                  return (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className={`break-words px-2 py-2 align-top text-muted-foreground transition-colors duration-500 sm:px-3 ${isMoneyLike ? 'font-medium tabular-nums text-foreground' : ''} ${isFinalRow ? 'bg-primary/5' : ''}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
