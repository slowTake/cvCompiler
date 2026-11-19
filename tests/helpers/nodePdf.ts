/** Reads PDFs in Node with pdf.js's legacy build, for tests and scripts/e2e-pdf.ts. */
import type { PdfContent } from '../../src/pdf/content';
import { extractContent } from '../../src/pdf/extract';

// pdf.js 6 uses Promise.withResolvers, which Node only has from 22.
if (!('withResolvers' in Promise)) {
  Object.assign(Promise, {
    withResolvers<T>() {
      let resolve!: (value: T) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((a, b) => {
        resolve = a;
        reject = b;
      });
      return { promise, resolve, reject };
    },
  });
}

// ...and ArrayBuffer#transferToFixedLength (fonts), also Node 22+.
const proto = ArrayBuffer.prototype as ArrayBuffer & { transferToFixedLength?: (len?: number) => ArrayBuffer };
if (!proto.transferToFixedLength) {
  proto.transferToFixedLength = function (this: ArrayBuffer, len = this.byteLength) {
    const copy = new ArrayBuffer(len);
    new Uint8Array(copy).set(new Uint8Array(this, 0, Math.min(len, this.byteLength)));
    return copy;
  };
}

export async function readPdfNode(bytes: Uint8Array): Promise<PdfContent> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  try {
    return await extractContent(await task.promise, pdfjs.OPS);
  } finally {
    await task.destroy();
  }
}
