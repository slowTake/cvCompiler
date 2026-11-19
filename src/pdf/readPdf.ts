/**
 * Reads a PDF file in the browser. pdf.js is large, so it loads on first use
 * rather than with the app. Nothing leaves the machine: the file is parsed
 * in a local web worker.
 */
import type { PdfContent } from './content';
import { PDF_FAILURE_MESSAGES, PdfReadError } from './errors';
import { extractContent } from './extract';

async function loadPdfJs() {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

export async function readPdf(bytes: ArrayBuffer): Promise<PdfContent> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) });
  let pdf;
  try {
    pdf = await task.promise;
  } catch (err) {
    void task.destroy();
    if ((err as { name?: string } | null)?.name === 'PasswordException') {
      throw new PdfReadError('password', PDF_FAILURE_MESSAGES.password);
    }
    throw new PdfReadError('invalid', PDF_FAILURE_MESSAGES.invalid);
  }
  try {
    return await extractContent(pdf, pdfjs.OPS);
  } finally {
    void task.destroy();
  }
}

/** Renders each page to a PNG data URL, for showing the PDF beside the review. */
export async function renderPdfPages(bytes: ArrayBuffer, scale = 1.25): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) });
  try {
    const pdf = await task.promise;
    const images: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      // 'print' renders in plain timeouts; the default waits on animation
      // frames, which never come while the tab is in the background.
      await page.render({ canvas, viewport, intent: 'print' }).promise;
      images.push(canvas.toDataURL('image/png'));
    }
    return images;
  } finally {
    void task.destroy();
  }
}
