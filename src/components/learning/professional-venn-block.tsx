import { MathText } from '@/components/learning/math-text';

type AnyBlock = Record<string, any>;

export function ProfessionalVennBlock({ block }: { block: AnyBlock }) {
  const setCount = Math.min(3, Math.max(1, Number(block.setCount ?? block.vennSetCount ?? 2)));
  const rawLabels = Array.isArray(block.labels)
    ? block.labels
    : String(block.vennLabels ?? 'A,B,C').split(',');
  const labels = rawLabels.map((label: unknown) => String(label).trim()).filter(Boolean);
  const highlight = normalizeVennHighlight(String(block.highlight ?? block.vennHighlight ?? 'none'));
  const description = typeof block.description === 'string' ? block.description : typeof block.vennDescription === 'string' ? block.vennDescription : '';
  const title = typeof block.title === 'string' && block.title.trim() ? block.title : vennLabelForHighlight(highlight, setCount);
  const diagramId = `venn-${setCount}-${highlight.replace(/[^a-z0-9]/gi, '-')}`;

  return (
    <div className="space-y-3">
      {description ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={description} /></p> : null}
      <div className="rounded-3xl border bg-gradient-to-br from-muted/30 via-background to-primary/5 p-2 sm:p-4">
        <div className="w-full">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Venn diagram</p>
              <p className="text-sm font-semibold"><MathText text={title} /></p>
            </div>
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              {setCount} set{setCount === 1 ? '' : 's'}
            </span>
          </div>

          <svg viewBox="0 0 520 330" className="block h-auto max-h-[340px] w-full max-w-full" role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
            <defs>
              <circle id={`${diagramId}-a`} cx="215" cy="160" r="92" />
              <circle id={`${diagramId}-b`} cx="305" cy="160" r="92" />
              <circle id={`${diagramId}-c`} cx="260" cy="95" r="92" />
              <clipPath id={`${diagramId}-clip-b`}><use href={`#${diagramId}-b`} /></clipPath>
              <clipPath id={`${diagramId}-clip-c`}><use href={`#${diagramId}-c`} /></clipPath>
              <mask id={`${diagramId}-mask-union`}>
                <rect width="520" height="330" fill="black" />
                <use href={`#${diagramId}-a`} fill="white" />
                {setCount >= 2 ? <use href={`#${diagramId}-b`} fill="white" /> : null}
                {setCount >= 3 ? <use href={`#${diagramId}-c`} fill="white" /> : null}
              </mask>
              <mask id={`${diagramId}-mask-outside`}>
                <rect width="520" height="330" fill="white" />
                <use href={`#${diagramId}-a`} fill="black" />
                {setCount >= 2 ? <use href={`#${diagramId}-b`} fill="black" /> : null}
                {setCount >= 3 ? <use href={`#${diagramId}-c`} fill="black" /> : null}
              </mask>
              <mask id={`${diagramId}-mask-not-a`}><rect width="520" height="330" fill="white" /><use href={`#${diagramId}-a`} fill="black" /></mask>
              <mask id={`${diagramId}-mask-not-b`}><rect width="520" height="330" fill="white" /><use href={`#${diagramId}-b`} fill="black" /></mask>
              <mask id={`${diagramId}-mask-not-c`}><rect width="520" height="330" fill="white" /><use href={`#${diagramId}-c`} fill="black" /></mask>
              <mask id={`${diagramId}-mask-a-minus-b`}><rect width="520" height="330" fill="black" /><use href={`#${diagramId}-a`} fill="white" /><use href={`#${diagramId}-b`} fill="black" /></mask>
              <mask id={`${diagramId}-mask-b-minus-a`}><rect width="520" height="330" fill="black" /><use href={`#${diagramId}-b`} fill="white" /><use href={`#${diagramId}-a`} fill="black" /></mask>
            </defs>

            <rect x="36" y="30" width="448" height="270" rx="24" className="fill-background stroke-border" strokeWidth="2" />
            {['complementA', 'complementB', 'complementC', 'outside', 'deMorganUnion'].includes(highlight) ? <rect x="36" y="30" width="448" height="270" rx="24" fill="hsl(var(--primary))" opacity="0.1" /> : null}

            <use href={`#${diagramId}-a`} fill="hsl(var(--muted))" opacity="0.44" className="stroke-primary" strokeWidth="2.5" />
            {setCount >= 2 ? <use href={`#${diagramId}-b`} fill="hsl(var(--muted))" opacity="0.44" className="stroke-primary" strokeWidth="2.5" /> : null}
            {setCount >= 3 ? <use href={`#${diagramId}-c`} fill="hsl(var(--muted))" opacity="0.38" className="stroke-primary" strokeWidth="2.5" /> : null}

            <VennHighlight id={diagramId} highlight={highlight} setCount={setCount} />

            <use href={`#${diagramId}-a`} fill="transparent" className="stroke-primary" strokeWidth="3" />
            {setCount >= 2 ? <use href={`#${diagramId}-b`} fill="transparent" className="stroke-primary" strokeWidth="3" /> : null}
            {setCount >= 3 ? <use href={`#${diagramId}-c`} fill="transparent" className="stroke-primary" strokeWidth="3" /> : null}

            <text x="148" y="78" className="fill-foreground text-[16px] font-semibold">{labels[0] || 'A'}</text>
            {setCount >= 2 ? <text x="356" y="78" className="fill-foreground text-[16px] font-semibold">{labels[1] || 'B'}</text> : null}
            {setCount >= 3 ? <text x="260" y="24" textAnchor="middle" className="fill-foreground text-[16px] font-semibold">{labels[2] || 'C'}</text> : null}
            <text x="260" y="284" textAnchor="middle" className="fill-muted-foreground text-[12px]">Universe</text>
          </svg>
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl border bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
        <span><strong className="text-foreground">Highlighted:</strong> {vennLabelForHighlight(highlight, setCount)}</span>
        <span><strong className="text-foreground">Try:</strong> A, B, union, intersection, A-B, not A, outside</span>
      </div>
    </div>
  );
}

function VennHighlight({ id, highlight, setCount }: { id: string; highlight: string; setCount: number }) {
  const color = 'hsl(var(--primary))';
  const opacity = 0.55;
  if (highlight === 'none') return null;
  if (highlight === 'A') return <use href={`#${id}-a`} fill={color} opacity={opacity} />;
  if (highlight === 'B' && setCount >= 2) return <use href={`#${id}-b`} fill={color} opacity={opacity} />;
  if (highlight === 'C' && setCount >= 3) return <use href={`#${id}-c`} fill={color} opacity={opacity} />;
  if (highlight === 'union') return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity={opacity} mask={`url(#${id}-mask-union)`} />;
  if (highlight === 'outside' || highlight === 'deMorganUnion') return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity="0.3" mask={`url(#${id}-mask-outside)`} />;
  if (highlight === 'complementA') return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity="0.25" mask={`url(#${id}-mask-not-a)`} />;
  if (highlight === 'complementB' && setCount >= 2) return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity="0.25" mask={`url(#${id}-mask-not-b)`} />;
  if (highlight === 'complementC' && setCount >= 3) return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity="0.25" mask={`url(#${id}-mask-not-c)`} />;
  if (highlight === 'differenceAB' && setCount >= 2) return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity={opacity} mask={`url(#${id}-mask-a-minus-b)`} />;
  if (highlight === 'differenceBA' && setCount >= 2) return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity={opacity} mask={`url(#${id}-mask-b-minus-a)`} />;
  if (highlight === 'intersection' && setCount === 1) return <use href={`#${id}-a`} fill={color} opacity={opacity} />;
  if ((highlight === 'intersection' || highlight === 'intersectionAB') && setCount >= 2) return <use href={`#${id}-a`} fill={color} opacity={opacity} clipPath={`url(#${id}-clip-b)`} />;
  if (highlight === 'intersectionAC' && setCount >= 3) return <use href={`#${id}-a`} fill={color} opacity={opacity} clipPath={`url(#${id}-clip-c)`} />;
  if (highlight === 'intersectionBC' && setCount >= 3) return <use href={`#${id}-b`} fill={color} opacity={opacity} clipPath={`url(#${id}-clip-c)`} />;
  return <rect x="36" y="30" width="448" height="270" rx="24" fill={color} opacity="0.18" />;
}

function normalizeVennHighlight(value: string) {
  const compact = value.trim().replace(/\s+/g, '').replace(/[∩]/g, 'intersection').replace(/[∪]/g, 'union').toLowerCase();
  const map: Record<string, string> = {
    '': 'none',
    none: 'none',
    a: 'A',
    b: 'B',
    c: 'C',
    union: 'union',
    aunionb: 'union',
    aub: 'union',
    aorb: 'union',
    intersection: 'intersection',
    aintersectionb: 'intersectionAB',
    anb: 'intersectionAB',
    aandb: 'intersectionAB',
    ab: 'intersectionAB',
    aintersectionc: 'intersectionAC',
    bintersectionc: 'intersectionBC',
    complementa: 'complementA',
    nota: 'complementA',
    anot: 'complementA',
    acomplement: 'complementA',
    complementb: 'complementB',
    notb: 'complementB',
    bcomplement: 'complementB',
    complementc: 'complementC',
    notc: 'complementC',
    ccomplement: 'complementC',
    differenceab: 'differenceAB',
    aminusb: 'differenceAB',
    'a-b': 'differenceAB',
    aonly: 'differenceAB',
    differenceba: 'differenceBA',
    bminusa: 'differenceBA',
    'b-a': 'differenceBA',
    bonly: 'differenceBA',
    outside: 'outside',
    demorganunion: 'deMorganUnion',
  };
  return map[compact] ?? value.trim();
}

function vennLabelForHighlight(highlight: string, setCount: number) {
  const labels: Record<string, string> = {
    none: 'No region selected',
    A: 'Set A',
    B: 'Set B',
    C: 'Set C',
    union: setCount >= 3 ? 'A ∪ B ∪ C' : 'A ∪ B',
    intersection: setCount >= 3 ? 'A ∩ B ∩ C' : 'A ∩ B',
    intersectionAB: 'A ∩ B',
    intersectionAC: 'A ∩ C',
    intersectionBC: 'B ∩ C',
    differenceAB: 'A − B',
    differenceBA: 'B − A',
    complementA: "A' / not A",
    complementB: "B' / not B",
    complementC: "C' / not C",
    outside: 'Outside all sets',
    deMorganUnion: "(A ∪ B)' / outside the union",
  };
  return labels[highlight] ?? highlight;
}
