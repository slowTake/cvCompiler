/**
 * Thin wrapper over the File System Access API (ADR 0006). Lets the app bind to
 * a user-chosen `.json` and write back to it durably. Feature-detected; where
 * unavailable (Firefox/Safari), the app falls back to Import/Export JSON.
 */

const JSON_TYPES: FilePickerAcceptType[] = [
  { description: 'CV JSON', accept: { 'application/json': ['.json'] } },
]

export function isFsaSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Open a picker, read the chosen file. Returns null if the user cancels. */
export async function pickOpenCvFile(): Promise<{
  handle: FileSystemFileHandle
  text: string
} | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: JSON_TYPES,
      multiple: false,
    })
    const file = await handle.getFile()
    return { handle, text: await file.text() }
  } catch (error) {
    if (isAbort(error)) return null
    throw error
  }
}

/** Open a save picker to bind a new file. Returns null if the user cancels. */
export async function pickSaveCvFile(
  suggestedName = 'cv.json',
): Promise<FileSystemFileHandle | null> {
  try {
    return await window.showSaveFilePicker({ suggestedName, types: JSON_TYPES })
  } catch (error) {
    if (isAbort(error)) return null
    throw error
  }
}

/**
 * Write text to a bound handle. Handles from `showOpenFilePicker` are read-only,
 * so upgrade to readwrite first (a no-op for handles from `showSaveFilePicker`).
 */
export async function writeCvFile(
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> {
  if (handle.requestPermission) {
    const state = await handle.requestPermission({ mode: 'readwrite' })
    if (state !== 'granted') {
      throw new DOMException('Write permission not granted', 'NotAllowedError')
    }
  }
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}
