/**
 * Minimal ambient types for the File System Access API entry points that the
 * TS DOM lib doesn't yet ship (FileSystemFileHandle + writable stream already
 * exist there). Only what `@/lib/fileAccess` uses.
 */
interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string | string[]>
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[]
  multiple?: boolean
  excludeAcceptAllOption?: boolean
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

// Non-standard (Chromium) permission methods, present when the API is supported.
interface FileSystemHandle {
  queryPermission?(
    desc?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
  requestPermission?(
    desc?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions,
  ): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>
}
