import { useCallback, useState, type ReactNode } from 'react';
import type { CvDocument } from '../model/types';
import type { PdfContent } from '../pdf/content';
import { hasHiddenSections } from '../pdf/embed';
import { PdfReadError } from '../pdf/errors';
import { importPdfContent } from '../pdf/importPdf';
import type { ParsedCv } from '../pdf/parse';
import { readPdf } from '../pdf/readPdf';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/toast';
import { PdfReview } from './PdfReview';

type Step =
  | null
  | { kind: 'review'; fileName: string; bytes: ArrayBuffer; parsed: ParsedCv; damagedEmbed: boolean }
  | { kind: 'modified'; fileName: string; bytes: ArrayBuffer; content: PdfContent; doc: CvDocument }
  | { kind: 'error'; fileName: string; message: string };

/**
 * PDF import, start to finish. A cvCompiler PDF restores at once; one that
 * was edited elsewhere asks which version to use; any other PDF goes through
 * the review screen. `load` receives the document the person accepted.
 */
export function usePdfImport(load: (doc: CvDocument) => void): { start: (file: File) => Promise<void>; dialog: ReactNode } {
  const { notify } = useToast();
  const [step, setStep] = useState<Step>(null);
  const close = useCallback(() => setStep(null), []);

  const restore = useCallback(
    (doc: CvDocument) => {
      setStep(null);
      load(doc);
      notify(
        hasHiddenSections(doc)
          ? 'Restored from a cvCompiler PDF. Sections you had hidden aren’t stored in PDFs, so they come back empty.'
          : 'Restored from a cvCompiler PDF: text, template and layout are all back.',
        { tone: 'success' },
      );
    },
    [load, notify],
  );

  const review = useCallback(async (fileName: string, bytes: ArrayBuffer, content: PdfContent) => {
    const result = await importPdfContent(content, { ignoreEmbed: true });
    if (result.kind === 'parsed') setStep({ kind: 'review', fileName, bytes, parsed: result.result, damagedEmbed: false });
  }, []);

  const start = useCallback(
    async (file: File) => {
      notify(`Reading ${file.name}…`);
      try {
        const bytes = await file.arrayBuffer();
        const content = await readPdf(bytes);
        const result = await importPdfContent(content);
        if (result.kind === 'parsed') {
          setStep({ kind: 'review', fileName: file.name, bytes, parsed: result.result, damagedEmbed: result.damagedEmbed });
        } else if (result.modified) {
          setStep({ kind: 'modified', fileName: file.name, bytes, content, doc: result.doc });
        } else {
          restore(result.doc);
        }
      } catch (err) {
        console.error(err);
        const message =
          err instanceof PdfReadError
            ? err.message
            : `Something went wrong while reading it (${err instanceof Error ? err.message : String(err)}).`;
        setStep({ kind: 'error', fileName: file.name, message });
      }
    },
    [notify, restore],
  );

  let dialog: ReactNode = null;
  if (step?.kind === 'review') {
    dialog = (
      <PdfReview
        fileName={step.fileName}
        bytes={step.bytes}
        parsed={step.parsed}
        damagedEmbed={step.damagedEmbed}
        onCancel={close}
        onLoad={(doc) => {
          setStep(null);
          load(doc);
          notify(`Imported ${step.fileName}. Save it to keep an editable copy.`, { tone: 'success' });
        }}
      />
    );
  } else if (step?.kind === 'modified') {
    dialog = (
      <Modal title="This PDF was changed after it was exported" onClose={close}>
        <p>
          <strong>{step.fileName}</strong> was made with cvCompiler, but its text no longer matches the CV saved inside
          it, so it was probably edited in another program.
        </p>
        <p className="ui-hint">
          The cvCompiler version restores everything exactly but misses those edits. Reading the visible text keeps the
          edits, but you'll need to check the result.
        </p>
        <div className="ui-modal-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void review(step.fileName, step.bytes, step.content)}>
            Read the visible text
          </button>
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => restore(step.doc)}>
            Use the cvCompiler version
          </button>
        </div>
      </Modal>
    );
  } else if (step?.kind === 'error') {
    dialog = (
      <Modal title="This PDF can't be imported" onClose={close}>
        <p>
          <strong>{step.fileName}</strong>: {step.message}
        </p>
        <p className="ui-hint">Nothing was changed.</p>
        <div className="ui-modal-actions">
          <button type="button" className="ui-btn ui-btn-primary" onClick={close}>
            OK
          </button>
        </div>
      </Modal>
    );
  }

  return { start, dialog };
}
