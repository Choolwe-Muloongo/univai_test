type ExtractMode = 'text' | 'pdf' | 'docx' | 'image' | 'unsupported';

export type DocumentExtractionProgress = {
  fileName: string;
  stage: 'reading' | 'pdf-text' | 'ocr-start' | 'ocr-page' | 'ocr-image' | 'done' | 'error';
  currentPage?: number;
  totalPages?: number;
  percent?: number;
  message: string;
};

type ExtractResult = {
  text: string;
  mode: ExtractMode;
  warning?: string;
};

type ExtractOptions = {
  onProgress?: (progress: DocumentExtractionProgress) => void;
};

export async function extractDocumentText(file: File, options: ExtractOptions = {}): Promise<ExtractResult> {
  const lowerName = file.name.toLowerCase();
  const emit = (progress: Omit<DocumentExtractionProgress, 'fileName'>) => options.onProgress?.({ ...progress, fileName: file.name });
  const isTextReadable = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.xml'].some((extension) => lowerName.endsWith(extension)) || file.type.startsWith('text/');

  emit({ stage: 'reading', percent: 1, message: `Reading ${file.name}...` });

  if (isTextReadable) {
    const text = await file.text();
    emit({ stage: 'done', percent: 100, message: `${file.name} loaded.` });
    return { text, mode: 'text' };
  }

  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file, options);
  }

  if (lowerName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(file, options);
  }

  if (file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].some((extension) => lowerName.endsWith(extension))) {
    return extractImageText(file, options);
  }

  emit({ stage: 'error', percent: 100, message: `${file.name} is not a supported readable file type.` });
  return {
    text: '',
    mode: 'unsupported',
    warning: `${file.name} is attached, but this file type is not readable yet. Upload TXT, MD, CSV, JSON, HTML, XML, PDF, DOCX, PNG, JPG, JPEG, or WEBP.`,
  };
}

async function extractPdfText(file: File, options: ExtractOptions = {}): Promise<ExtractResult> {
  const emit = (progress: Omit<DocumentExtractionProgress, 'fileName'>) => options.onProgress?.({ ...progress, fileName: file.name });

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
      emit({
        stage: 'pdf-text',
        currentPage: pageNumber,
        totalPages: pdf.numPages,
        percent: Math.round((pageNumber / pdf.numPages) * 45),
        message: `Reading PDF text page ${pageNumber} of ${pdf.numPages}...`,
      });
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
      emit({ stage: 'done', percent: 100, message: `${file.name} text extraction complete.` });
      return { text: pages.join('\n\n'), mode: 'pdf' };
    }

    emit({ stage: 'ocr-start', percent: 46, message: 'No selectable text found. Starting OCR for all pages...' });
    const ocrText = await ocrPdf(pdf, file.name, options);
    emit({ stage: 'done', percent: 100, message: `${file.name} OCR complete.` });
    return {
      text: ocrText,
      mode: 'pdf',
      warning: ocrText ? 'No selectable PDF text was found, so OCR was used. Review the extracted text before generating the course.' : 'The PDF was read, but no selectable text or OCR text was found. It may be image-heavy or protected.',
    };
  } catch (error) {
    try {
      emit({ stage: 'ocr-start', percent: 5, message: 'PDF text extraction failed. Starting OCR fallback...' });
      const ocrText = await ocrPdfFromFile(file, options);
      emit({ stage: 'done', percent: 100, message: `${file.name} OCR fallback complete.` });
      return {
        text: ocrText,
        mode: 'pdf',
        warning: ocrText ? 'PDF text extraction failed, so OCR fallback was used. Review the extracted text before generating the course.' : formatError('PDF extraction and OCR failed', error),
      };
    } catch (ocrError) {
      emit({ stage: 'error', percent: 100, message: 'PDF extraction and OCR failed.' });
      return {
        text: '',
        mode: 'pdf',
        warning: `${formatError('PDF extraction failed', error)} ${formatError('OCR fallback failed', ocrError)}`,
      };
    }
  }
}

async function extractDocxText(file: File, options: ExtractOptions = {}): Promise<ExtractResult> {
  const emit = (progress: Omit<DocumentExtractionProgress, 'fileName'>) => options.onProgress?.({ ...progress, fileName: file.name });
  try {
    emit({ stage: 'reading', percent: 10, message: `Reading DOCX ${file.name}...` });
    const mammoth = await import('mammoth/mammoth.browser');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const messages = result.messages?.map((message) => message.message).filter(Boolean) ?? [];
    emit({ stage: 'done', percent: 100, message: `${file.name} loaded.` });
    return {
      text: result.value?.trim() ?? '',
      mode: 'docx',
      warning: messages.length ? messages.join(' ') : undefined,
    };
  } catch (error) {
    emit({ stage: 'error', percent: 100, message: 'DOCX extraction failed.' });
    return {
      text: '',
      mode: 'docx',
      warning: error instanceof Error ? `DOCX extraction failed: ${error.message}` : 'DOCX extraction failed.',
    };
  }
}

async function extractImageText(file: File, options: ExtractOptions = {}): Promise<ExtractResult> {
  const emit = (progress: Omit<DocumentExtractionProgress, 'fileName'>) => options.onProgress?.({ ...progress, fileName: file.name });
  try {
    emit({ stage: 'ocr-image', percent: 20, message: `Running OCR on ${file.name}...` });
    const text = await recognizeImage(file, (percent) => emit({ stage: 'ocr-image', percent, message: `Running OCR on ${file.name}: ${percent}%...` }));
    emit({ stage: 'done', percent: 100, message: `${file.name} OCR complete.` });
    return {
      text,
      mode: 'image',
      warning: text ? 'OCR was used for this image. Review the extracted text before generating the course.' : 'OCR could not find readable text in this image.',
    };
  } catch (error) {
    emit({ stage: 'error', percent: 100, message: 'Image OCR failed.' });
    return {
      text: '',
      mode: 'image',
      warning: formatError('Image OCR failed', error),
    };
  }
}

async function ocrPdfFromFile(file: File, options: ExtractOptions = {}): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise;
  return ocrPdf(pdf, file.name, options);
}

async function ocrPdf(
  pdf: { numPages: number; getPage: (pageNumber: number) => Promise<{ getViewport: (options: { scale: number }) => { width: number; height: number }; render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> },
  fileName: string,
  options: ExtractOptions = {},
): Promise<string> {
  const pages: string[] = [];
  const emit = (progress: Omit<DocumentExtractionProgress, 'fileName'>) => options.onProgress?.({ ...progress, fileName });

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const pagePercentStart = Math.round(((pageNumber - 1) / pdf.numPages) * 100);
    emit({
      stage: 'ocr-page',
      currentPage: pageNumber,
      totalPages: pdf.numPages,
      percent: pagePercentStart,
      message: `OCR page ${pageNumber} of ${pdf.numPages}...`,
    });
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const text = await recognizeImage(canvas, (ocrPercent) => {
      const pageShare = 100 / pdf.numPages;
      const percent = Math.min(99, Math.round(pagePercentStart + (ocrPercent / 100) * pageShare));
      emit({
        stage: 'ocr-page',
        currentPage: pageNumber,
        totalPages: pdf.numPages,
        percent,
        message: `OCR page ${pageNumber} of ${pdf.numPages}: ${ocrPercent}%...`,
      });
    });
    if (text.trim()) pages.push(`Page ${pageNumber} OCR: ${text.trim()}`);
  }

  return pages.join('\n\n');
}

async function recognizeImage(source: File | HTMLCanvasElement, onProgress?: (percent: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (event) => {
      if (event.status === 'recognizing text' && typeof event.progress === 'number') {
        onProgress?.(Math.max(1, Math.min(99, Math.round(event.progress * 100))));
      }
    },
  });
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
