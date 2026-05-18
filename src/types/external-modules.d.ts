declare module 'plotly.js' {
  export type Data = Record<string, unknown>;
}

declare module 'react-plotly.js' {
  import type { ComponentType } from 'react';

  const Plot: ComponentType<Record<string, unknown>>;
  export default Plot;
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc?: string };
  export function getDocument(source: unknown): { promise: Promise<any> };
}

declare module 'tesseract.js' {
  export function createWorker(
    language?: string,
    oem?: number,
    options?: { logger?: (event: { status?: string; progress?: number }) => void },
  ): Promise<{
    recognize(source: unknown): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }>;

  export function recognize(
    image: unknown,
    language?: string,
    options?: Record<string, unknown>,
  ): Promise<{ data?: { text?: string } }>;
}
