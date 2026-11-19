import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CvDocument } from '../model/types';
import { encodeEmbed } from '../pdf/embed';
import { getTemplate } from '../templates/registry';
import { CvRenderer } from './CvRenderer';

/**
 * A clean copy of the CV, outside the app root, that only exists for print.
 * @media print hides #root and shows this, so no editor chrome, zoom
 * transform or on-screen page pushes leak into the PDF.
 */
export function PrintRoot({ doc }: { doc: CvDocument }) {
  const embed = useEmbedUrl(doc);
  return createPortal(
    <div className="print-root">
      <CvRenderer doc={doc} template={getTemplate(doc.meta.templateId)} overrides={doc.meta.style} />
      {/* Carries the CV data for PDF import; see pdf/embed.ts. Must stay empty and visible. */}
      {embed && <a className="cv-embed" href={embed} aria-hidden="true" tabIndex={-1} />}
    </div>,
    document.body,
  );
}

/** Compression is async, so the link trails the document by a tick. */
function useEmbedUrl(doc: CvDocument): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    encodeEmbed(doc).then(
      (next) => current && setUrl(next),
      (err: unknown) => console.error('Embedding the CV in the PDF failed', err),
    );
    return () => {
      current = false;
    };
  }, [doc]);
  return url;
}
