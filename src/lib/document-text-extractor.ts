export async function extractDocumentText(file: File): Promise<{ text: string; mode: 'text' | 'pdf' | 'docx' | 'unsupported'; warning?: string }> {
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

  return {
    text: '',
    mode: 'unsupported',
    warning: `${file.name} is attached, but this file type is not readable yet. Upload TXT, MD, CSV, JSON, HTML, XML, PDF, or DOCX.`,
  };
}

async function extractPdfText(file: File): Promise<{ text: string; mode: 'pdf'; warning?: string }> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
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

    return {
      text: pages.join('\n\n'),
      mode: 'pdf',
      warning: pages.length ? undefined : 'The PDF was read, but no selectable text was found. It may be scanned images only.',
    };
  } catch (error) {
    return {
      text: '',
      mode: 'pdf',
      warning: error instanceof Error ? `PDF extraction failed: ${error.message}` : 'PDF extraction failed.',
    };
  }
}

async function extractDocxText(file: File): Promise<{ text: string; mode: 'docx'; warning?: string }> {
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
