import type { ReactNode } from 'react';
import { InlineMath } from 'react-katex';

type MathTextProps = {
  text?: string | number | boolean | null;
  className?: string;
};

const superMap: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', x: 'ˣ', y: 'ʸ',
};

const subMap: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};

export function MathText({ text, className }: MathTextProps) {
  const value = String(text ?? '');
  return <span className={className}>{renderText(value)}</span>;
}

function renderText(value: string): ReactNode[] {
  const parts = splitMathBlocks(value);
  return parts.map((part, index) => {
    if (part.math) {
      return <KatexInline key={index} math={normaliseLatex(part.text)} fallback={renderMath(part.text, `${index}`)} />;
    }
    return <span key={index}>{renderMath(part.text, `${index}`)}</span>;
  });
}

function KatexInline({ math, fallback }: { math: string; fallback: ReactNode[] }) {
  try {
    return <span className="mx-0.5 inline-flex items-center rounded-md bg-muted/40 px-1 py-0.5 text-[0.95em] text-foreground"><InlineMath math={math} /></span>;
  } catch {
    return <span className="mx-0.5 inline-flex items-center rounded-md bg-muted/40 px-1 py-0.5 font-mono text-[0.95em] text-foreground">{fallback}</span>;
  }
}

function splitMathBlocks(value: string) {
  const parts: { text: string; math: boolean }[] = [];
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$|\\\([^)]*\\\)|\\\[[\s\S]*?\\\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) {
    if (match.index > lastIndex) parts.push({ text: value.slice(lastIndex, match.index), math: false });
    parts.push({ text: unwrapMath(match[0]), math: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex), math: false });
  return parts.length ? parts : [{ text: value, math: false }];
}

function unwrapMath(value: string) {
  return value
    .replace(/^\$\$|\$\$$/g, '')
    .replace(/^\$|\$$/g, '')
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/^\\\[|\\\]$/g, '')
    .trim();
}

function normaliseLatex(value: string) {
  return value
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/frac\(([^,]+),\s*([^)]+)\)/g, '\\frac{$1}{$2}')
    .replace(/([A-Za-z0-9)\]])\^([A-Za-z0-9]+)/g, '$1^{$2}')
    .replace(/([A-Za-z0-9)\]])_([A-Za-z0-9]+)/g, '$1_{$2}');
}

function renderMath(value: string, keyPrefix: string): ReactNode[] {
  const cleaned = prepareText(value);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  const regex = /(\\frac\{([^{}]+)\}\{([^{}]+)\}|frac\(([^,]+),\s*([^\)]+)\)|\\sqrt\{([^{}]+)\}|sqrt\(([^\)]+)\)|√\(([^\)]+)\)|([A-Za-z0-9)\]])\^\{?([A-Za-z0-9+\-=()]+)\}?|([A-Za-z0-9)\]])_\{?([A-Za-z0-9+\-=()]+)\}?)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned))) {
    if (match.index > cursor) nodes.push(cleaned.slice(cursor, match.index));

    if (match[1]?.startsWith('\\frac')) {
      nodes.push(<Fraction key={`${keyPrefix}-${match.index}`} top={match[2]} bottom={match[3]} />);
    } else if (match[1]?.startsWith('frac(')) {
      nodes.push(<Fraction key={`${keyPrefix}-${match.index}`} top={match[4]} bottom={match[5]} />);
    } else if (match[6]) {
      nodes.push(<Root key={`${keyPrefix}-${match.index}`} value={match[6]} />);
    } else if (match[7] || match[8]) {
      nodes.push(<Root key={`${keyPrefix}-${match.index}`} value={match[7] || match[8]} />);
    } else if (match[9]) {
      nodes.push(<span key={`${keyPrefix}-${match.index}`}>{match[9]}<sup>{toSuper(match[10])}</sup></span>);
    } else if (match[11]) {
      nodes.push(<span key={`${keyPrefix}-${match.index}`}>{match[11]}<sub>{toSub(match[12])}</sub></span>);
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < cleaned.length) nodes.push(cleaned.slice(cursor));
  return nodes;
}

function prepareText(value: string) {
  return value
    .replace(/\*\*/g, '²')
    .replace(/\btimes\b|\\times/g, '×')
    .replace(/\bdiv\b|\\div/g, '÷')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\infty\b/g, '∞');
}

function Fraction({ top, bottom }: { top?: string; bottom?: string }) {
  return (
    <span className="mx-1 inline-flex translate-y-[0.15em] flex-col items-center align-middle font-mono leading-none">
      <span className="border-b border-current px-1 pb-0.5 text-[0.78em]">{renderMath(String(top ?? ''), `top-${top}`)}</span>
      <span className="px-1 pt-0.5 text-[0.78em]">{renderMath(String(bottom ?? ''), `bottom-${bottom}`)}</span>
    </span>
  );
}

function Root({ value }: { value?: string }) {
  return <span className="mx-0.5 font-mono">√<span className="border-t border-current px-1">{renderMath(String(value ?? ''), `root-${value}`)}</span></span>;
}

function toSuper(value = '') {
  return value.split('').map((char) => superMap[char] ?? char).join('');
}

function toSub(value = '') {
  return value.split('').map((char) => subMap[char] ?? char).join('');
}