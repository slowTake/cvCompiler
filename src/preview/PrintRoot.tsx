import { createPortal } from 'react-dom';
import type { CvDocument } from '../model/types';
import { getTemplate } from '../templates/registry';
import { CvRenderer } from './CvRenderer';

/**
 * A clean copy of the CV, outside the app root, that only exists for print.
 * @media print hides #root and shows this, so no editor chrome, zoom
 * transform or on-screen page pushes leak into the PDF.
 */
export function PrintRoot({ doc }: { doc: CvDocument }) {
  return createPortal(
    <div className="print-root">
      <CvRenderer doc={doc} template={getTemplate(doc.meta.templateId)} overrides={doc.meta.style} />
    </div>,
    document.body,
  );
}
