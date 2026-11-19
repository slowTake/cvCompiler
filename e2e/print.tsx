/**
 * Dev-only print harness for the PDF round-trip tests (scripts/e2e-pdf.ts).
 * Renders exactly what Print / PDF renders, for the demo CV in any template:
 *
 *   /e2e/print.html?template=slate[&hide=projects,languages][&tamper=1]
 *
 * `tamper` changes one line of visible text after the embed is built, like
 * editing the PDF in another program would.
 *
 * `data-ready` on <html> flips once the embed link is in place.
 */
import { createRoot } from 'react-dom/client';
import { demoDocument } from '../src/persistence/initialData';
import { PrintRoot } from '../src/preview/PrintRoot';
import '../src/styles';

const params = new URLSearchParams(location.search);
const doc = demoDocument();
doc.meta.templateId = params.get('template') ?? doc.meta.templateId;
const hide = new Set((params.get('hide') ?? '').split(',').filter(Boolean));
doc.meta.sections = doc.meta.sections.map((s) => (hide.has(s.id) ? { ...s, visible: false } : s));

createRoot(document.getElementById('root')!).render(<PrintRoot doc={doc} />);

const ready = () => {
  if (!document.querySelector('.cv-embed')) return void setTimeout(ready, 20);
  if (params.has('tamper')) {
    const org = document.querySelector('.print-root .cv-entry-org');
    if (org) org.textContent = 'Globex Corporation International';
  }
  document.documentElement.dataset.ready = '1';
};
void document.fonts.ready.then(ready);
