type ExtractMode = 'text' | 'pdf' | 'docx' | 'image' | 'unsupported';

type ExtractResult = {
  text: string;
  mode: ExtractMode;
  warning?: string;
};

export async function extractDocumentText(file: File): Promise<ExtractResult> {
  const lowerName = file.name.toLowerCase();
  const isTextReadable = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.xml'].some((extension) => lowerName.endsWith(extension)) || file.type.startsWith('text/');

  if (isTextReadable) {
    return { text: await file.text(), mode: 'text' };
  }

  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file);
  }

  if (lowerName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(file);
  }

  if (file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].some((extension) => lowerName.endsWith(extension))) {
    return extractImageText(file);
  }

  return {
    text: '',
    mode: 'unsupported',
    warning: `${file.name} is attached, but this file type is not readable yet. Upload TXT, MD, CSV, JSON, HTML, XML, PDF, DOCX, PNG, JPG, JPEG, or WEBP.`,
  };
}

async function extractPdfText(file: File): Promise<ExtractResult> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true,
    } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise;

    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) pages.push(`Page ${pageNumber}: ${pageText}`);
    }

    if (pages.length) {
      return { text: pages.join('\n\n'), mode: 'pdf' };
    }

    const ocrText = await ocrPdf(pdf);
    return {
      text: ocrText,
      mode: 'pdf',
      warning: ocrText ? 'No selectable PDF text was found, so OCR was used. Review the extracted text before generating the course.' : 'The PDF was read, but no selectable text or OCR text was found. It may be image-heavy or protected.',
    };
  } catch (error) {
    try {
      const ocrText = await ocrPdfFromFile(file);
      return {
        text: ocrText,
        mode: 'pdf',
        warning: ocrText ? 'PDF text extraction failed, so OCR fallback was used. Review the extracted text before generating the course.' : formatError('PDF extraction and OCR failed', error),
      };
    } catch (ocrError) {
      return {
        text: '',
        mode: 'pdf',
        warning: `${formatError('PDF extraction failed', error)} ${formatError('OCR fallback failed', ocrError)}`,
      };
    }
  }
}

async function extractDocxText(file: File): Promise<ExtractResult> {
  try {
    const mammoth = await import('mammoth/mammoth.browser');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const messages = result.messages?.map((message) => message.message).filter(Boolean) ?? [];
    return {
      text: result.value?.trim() ?? '',
      mode: 'docx',
      warning: messages.length ? messages.join(' ') : undefined,
    };
  } catch (error) {
    return {
      text: '',
      mode: 'docx',
      warning: error instanceof Error ? `DOCX extraction failed: ${error.message}` : 'DOCX extraction failed.',
    };
  }
}

async function extractImageText(file: File): Promise<ExtractResult> {
  try {
    const text = await recognizeImage(file);
    return {
      text,
      mode: 'image',
      warning: text ? 'OCR was used for this image. Review the extracted text before generating the course.' : 'OCR could not find readable text in this image.',
    };
  } catch (error) {
    return {
      text: '',
      mode: 'image',
      warning: formatError('Image OCR failed', error),
    };
  }
}

async function ocrPdfFromFile(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise;
  return ocrPdf(pdf);
}

async function ocrPdf(pdf: { numPages: number; getPage: (pageNumber: number) => Promise<{ getViewport: (options: { scale: number }) => { width: number; height: number }; render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> }): Promise<string> {
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 30);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const text = await recognizeImage(canvas);
    if (text.trim()) pages.push(`Page ${pageNumber} OCR: ${text.trim()}`);
  }

  return pages.join('\n\n');
}

async function recognizeImage(source: File | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(source);
    return result.data.text.replace(/\s+/g, ' ').trim();
  } finally {
    await worker.terminate();
  }
}

function formatError(prefix: string, error: unknown): string {
  return error instanceof Error ? `${prefix}: ${error.message}` : `${prefix}.`;
}
