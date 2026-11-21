import {
  FileText,
  FolderGit2,
  FolderOpen,
  Printer,
  Save,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from './editor/Editor';
import { RepoOpenDialog } from './editor/RepoOpenDialog';
import { usePdfImport } from './editor/usePdfImport';
import type { EditTarget } from './model/editTarget';
import { formatIssues, parseCvJson, type CvIssue } from './model/normalize';
import type { CvDocument } from './model/types';
import { chooseCvFile, downloadText, fileNameFor } from './persistence/download';
import {
  ensureWritePermission,
  pickFileToOpen,
  saveAsNewFile,
  supportsFileSystemAccess,
  writeToHandle,
} from './persistence/fileAccess';
import { readRepoSave, supportsRepoSaves, writeRepoSave } from './persistence/repoSaves';
import { useCvDocument } from './persistence/useCvDocument';
import { Preview } from './preview/Preview';
import { PrintRoot } from './preview/PrintRoot';
import { Modal } from './ui/Modal';
import { useToast } from './ui/toast';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl+';

const warnBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');

interface ImportProblem {
  fileName: string;
  errors: CvIssue[];
}

export function App({ initial }: { initial: { doc: CvDocument; clean: boolean } }) {
  const { doc, json, dirty, source, generation, update, replace, markSaved } = useCvDocument(initial);
  const { notify } = useToast();
  const [problem, setProblem] = useState<ImportProblem | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [repoDialog, setRepoDialog] = useState(false);
  const [dragging, setDragging] = useState(false);

  const confirmDiscard = useCallback(
    () => !dirty || window.confirm('You have unsaved changes. Discard them?'),
    [dirty],
  );

  /** Parses file text; shows the error dialog and returns null when it is broken. */
  const parseOrReport = useCallback((fileName: string, text: string) => {
    const result = parseCvJson(text);
    if (!result.ok) {
      setProblem({ fileName, errors: result.errors });
      return null;
    }
    return result.doc;
  }, []);

  const fail = useCallback(
    (what: string, err: unknown) => {
      console.error(err);
      notify(`${what} failed: ${err instanceof Error ? err.message : String(err)}`, { tone: 'error' });
    },
    [notify],
  );

  const open = useCallback(async () => {
    if (!confirmDiscard()) return;
    try {
      const picked = await pickFileToOpen();
      if (!picked) return;
      const next = parseOrReport(picked.handle.name, picked.text);
      if (!next) return;
      replace(next, { name: picked.handle.name, handle: picked.handle });
      notify(`Opened ${picked.handle.name}`);
    } catch (err) {
      fail('Open', err);
    }
  }, [confirmDiscard, parseOrReport, replace, notify, fail]);

  const exportJson = useCallback(() => {
    const name = source?.name ?? fileNameFor(doc.meta.title);
    downloadText(name, json);
    // Without a bound file, the download is the saved copy.
    if (!source?.handle) markSaved(json, { name });
    notify(`Exported ${name}`);
  }, [doc.meta.title, json, source, markSaved, notify]);

  const saveAs = useCallback(async () => {
    try {
      const handle = await saveAsNewFile(json, source?.name ?? fileNameFor(doc.meta.title));
      if (!handle) return;
      markSaved(json, { name: handle.name, handle });
      notify(`Saved ${handle.name}`, { tone: 'success' });
    } catch (err) {
      fail('Save', err);
    }
  }, [json, source, doc.meta.title, markSaved, notify, fail]);

  const saveToRepo = useCallback(async () => {
    const name = source?.repo ? source.name : fileNameFor(doc.meta.title);
    try {
      await writeRepoSave(name, json);
      markSaved(json, { name, repo: true });
      notify(`Saved saves/${name}`, { tone: 'success' });
    } catch (err) {
      fail('Save to repo', err);
    }
  }, [source, doc.meta.title, json, markSaved, notify, fail]);

  const openFromRepo = useCallback(
    async (name: string) => {
      setRepoDialog(false);
      try {
        const next = parseOrReport(name, await readRepoSave(name));
        if (!next) return;
        replace(next, { name, repo: true });
        notify(`Opened saves/${name}`);
      } catch (err) {
        fail('Open', err);
      }
    },
    [parseOrReport, replace, notify, fail],
  );

  const save = useCallback(async () => {
    // Repo-bound files, and Firefox in dev (no File System Access), save into saves/.
    if (source?.repo || (supportsRepoSaves && !supportsFileSystemAccess)) return saveToRepo();
    if (!supportsFileSystemAccess) return exportJson();
    if (!source?.handle) return saveAs();
    try {
      if (!(await ensureWritePermission(source.handle))) {
        notify('Saving needs write permission to the file. Try Save again or use Save as…', {
          tone: 'error',
        });
        return;
      }
      await writeToHandle(source.handle, json);
      markSaved(json);
      notify(`Saved ${source.name}`, { tone: 'success' });
    } catch (err) {
      fail('Save', err);
    }
  }, [source, json, exportJson, saveAs, saveToRepo, markSaved, notify, fail]);

  // A PDF has no editable copy behind it, so its import starts out unsaved.
  const pdf = usePdfImport(
    useCallback((next: CvDocument) => replace(next, { name: fileNameFor(next.meta.title) }, false), [replace]),
  );

  /** Imports a chosen or dropped file: a CV's JSON, or a PDF. */
  const importFile = useCallback(
    async (file: File) => {
      try {
        if (file.type === 'application/pdf' || /\.pdf$/iu.test(file.name)) return await pdf.start(file);
        const next = parseOrReport(file.name, await file.text());
        if (!next) return;
        replace(next, { name: file.name });
        notify(`Imported ${file.name}`);
      } catch (err) {
        fail('Import', err);
      }
    },
    [pdf, parseOrReport, replace, notify, fail],
  );

  const importCv = useCallback(async () => {
    if (!confirmDiscard()) return;
    const file = await chooseCvFile();
    if (file) await importFile(file);
  }, [confirmDiscard, importFile]);

  const askOpenFromRepo = useCallback(() => {
    if (confirmDiscard()) setRepoDialog(true);
  }, [confirmDiscard]);

  // Keyboard shortcuts. Read the latest callbacks through a ref.
  const actions = useRef({ save, saveAs, open, importCv });
  actions.current = { save, saveAs, open, importCv };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        void (e.shiftKey && supportsFileSystemAccess ? actions.current.saveAs() : actions.current.save());
      } else if (key === 'o') {
        e.preventDefault();
        void (supportsFileSystemAccess ? actions.current.open() : actions.current.importCv());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drop a .json or .pdf anywhere to import it.
  const dropped = useRef({ confirmDiscard, importFile });
  dropped.current = { confirmDiscard, importFile };
  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      // Only leaving the window ends the drag; moving between elements fires this too.
      if (!e.relatedTarget) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file && dropped.current.confirmDiscard()) void dropped.current.importFile(file);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  // The PDF's default file name comes from document.title.
  const title = doc.meta.title.trim() || doc.identity.name.trim() || 'CV';
  useEffect(() => {
    const original = document.title;
    const before = () => (document.title = title);
    const after = () => (document.title = original);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [title]);

  // Only a bound file can fall behind; the browser cache keeps everything else.
  const boundAndDirty = dirty && !!(source?.handle || source?.repo);
  useEffect(() => {
    if (!boundAndDirty) return;
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [boundAndDirty]);

  return (
    <>
      <div className="ui-app">
        <header className="ui-topbar">
          <div className="ui-brand">
            cv<span>Compiler</span>
          </div>
          <div className="ui-file-status" title={source?.handle || source?.repo ? 'Save writes to this file' : undefined}>
            <FileText size={15} />
            <span className="ui-file-name">
              {source ? source.name : 'Not linked to a file'}
              {source && !source.handle && !source.repo && supportsFileSystemAccess && (
                <span className="ui-muted"> (not linked)</span>
              )}
            </span>
            {dirty ? (
              <span className="ui-dirty" title="Unsaved changes">
                ● Unsaved
              </span>
            ) : (
              <span className="ui-clean">Saved</span>
            )}
          </div>
          <div className="ui-toolbar">
            {supportsFileSystemAccess && (
              <>
                <button type="button" className="ui-btn" onClick={() => void open()} title={`Open a .json file (${MOD}O)`}>
                  <FolderOpen size={15} /> Open…
                </button>
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => void save()}
                  title={`Save to the linked file (${MOD}S). ${isMac ? '⇧⌘S' : 'Ctrl+Shift+S'} to save as.`}
                >
                  <Save size={15} /> Save
                </button>
                <button type="button" className="ui-btn ui-btn-ghost" onClick={() => void saveAs()}>
                  Save as…
                </button>
                <span className="ui-toolbar-sep" />
              </>
            )}
            {supportsRepoSaves && (
              <>
                <button
                  type="button"
                  className="ui-btn ui-btn-ghost"
                  onClick={askOpenFromRepo}
                  title="Open a CV from the repo's saves/ folder"
                >
                  <FolderGit2 size={15} /> Open from repo
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-ghost"
                  onClick={() => void saveToRepo()}
                  title="Write this CV to the repo's saves/ folder"
                >
                  <Save size={15} /> Save to repo
                </button>
                <span className="ui-toolbar-sep" />
              </>
            )}
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => window.print()}>
              <Printer size={15} /> Print / PDF
            </button>
          </div>
        </header>

        <main className="ui-split">
          <div className="ui-pane ui-pane-form">
            {/* A fresh Editor per loaded document drops pending Undo actions. */}
            <Editor key={generation} doc={doc} update={update} editTarget={editTarget} />
          </div>
          <div className="ui-pane ui-pane-preview">
            <Preview doc={doc} onEdit={setEditTarget} />
          </div>
        </main>

        {pdf.dialog}

        {repoDialog && <RepoOpenDialog onPick={(n) => void openFromRepo(n)} onClose={() => setRepoDialog(false)} />}

        {problem && (
          <Modal title="This file can't be loaded" onClose={() => setProblem(null)}>
            <p>
              <strong>{problem.fileName}</strong> doesn't match the CV format. Nothing was changed.
            </p>
            <ul className="ui-error-list">
              {formatIssues(problem.errors).map((line) => (
                <li key={line}>
                  <code>{line}</code>
                </li>
              ))}
            </ul>
            <p className="ui-hint">See docs/DATA-MODEL.md for the expected structure.</p>
            <div className="ui-modal-actions">
              <button type="button" className="ui-btn ui-btn-primary" onClick={() => setProblem(null)}>
                OK
              </button>
            </div>
          </Modal>
        )}
      </div>
      {dragging && (
        <div className="ui-drop-overlay" aria-hidden="true">
          <div className="ui-drop-card">
            <Upload size={22} />
            <strong>Drop a CV to import it</strong>
            <span className="ui-muted">A .json file or a PDF. It never leaves this computer.</span>
          </div>
        </div>
      )}
      <PrintRoot doc={doc} />
    </>
  );
}
