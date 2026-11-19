import { useEffect, useState } from 'react';
import { listRepoSaves, type RepoSave } from '../persistence/repoSaves';
import { Modal } from '../ui/Modal';

interface Props {
  onPick: (name: string) => void;
  onClose: () => void;
}

/** Lists the CV files in the repo's saves/ folder (dev server only). */
export function RepoOpenDialog({ onPick, onClose }: Props) {
  const [files, setFiles] = useState<RepoSave[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRepoSaves().then(setFiles, (err: unknown) =>
      setError(err instanceof Error ? err.message : String(err)),
    );
  }, []);

  return (
    <Modal title="Open from saves/" onClose={onClose}>
      {error && <p className="ui-hint">Couldn't read the saves folder: {error}</p>}
      {files && files.length === 0 && (
        <p className="ui-hint">Nothing saved yet. Use "Save to repo" to put a CV in saves/.</p>
      )}
      {files && files.length > 0 && (
        <ul className="ui-save-list">
          {files.map((f) => (
            <li key={f.name}>
              <button type="button" className="ui-btn ui-btn-ghost" onClick={() => onPick(f.name)}>
                {f.name}
                <span className="ui-muted"> · {new Date(f.modified).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
