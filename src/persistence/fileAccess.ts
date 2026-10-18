/**
 * File System Access API (Chromium only): bind a .json file on disk so that
 * Save writes straight back to it. Other browsers use Import / Export.
 */

type PermissionMode = 'read' | 'readwrite';

/** Permission methods are not in TypeScript's DOM lib yet. */
interface PermissionedHandle extends FileSystemFileHandle {
  queryPermission?(descriptor: { mode: PermissionMode }): Promise<PermissionState>;
  requestPermission?(descriptor: { mode: PermissionMode }): Promise<PermissionState>;
}

interface PickerType {
  description: string;
  accept: Record<string, string[]>;
}

interface FsWindow {
  showOpenFilePicker(options?: {
    types?: PickerType[];
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
  }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: {
    types?: PickerType[];
    suggestedName?: string;
  }): Promise<FileSystemFileHandle>;
}

const JSON_TYPES: PickerType[] = [
  { description: 'CV document (JSON)', accept: { 'application/json': ['.json'] } },
];

export const supportsFileSystemAccess: boolean =
  typeof window !== 'undefined' && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

const fsWindow = () => window as unknown as FsWindow;

/** The user dismissed a picker or a permission prompt. */
export function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/** Shows the open picker. Resolves null when the user cancels. */
export async function pickFileToOpen(): Promise<{ handle: FileSystemFileHandle; text: string } | null> {
  try {
    const [handle] = await fsWindow().showOpenFilePicker({ types: JSON_TYPES, multiple: false });
    const file = await handle.getFile();
    return { handle, text: await file.text() };
  } catch (err) {
    if (isAbort(err)) return null;
    throw err;
  }
}

/**
 * Handles from the open picker start with read access only. Upgrade to
 * readwrite before writing; this may prompt, so call it from a user gesture.
 */
export async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as PermissionedHandle;
  if (!h.queryPermission || !h.requestPermission) return true;
  const descriptor = { mode: 'readwrite' as const };
  if ((await h.queryPermission(descriptor)) === 'granted') return true;
  return (await h.requestPermission(descriptor)) === 'granted';
}

export async function writeToHandle(handle: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(text);
  } finally {
    await writable.close();
  }
}

/** Shows the save picker and writes. Resolves null when the user cancels. */
export async function saveAsNewFile(
  text: string,
  suggestedName: string,
): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await fsWindow().showSaveFilePicker({ types: JSON_TYPES, suggestedName });
    await writeToHandle(handle, text);
    return handle;
  } catch (err) {
    if (isAbort(err)) return null;
    throw err;
  }
}
