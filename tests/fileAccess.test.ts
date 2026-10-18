import { describe, expect, it, vi } from 'vitest';
import { writeToHandle } from '../src/persistence/fileAccess';

function fakeHandle(write: (text: string) => Promise<void>) {
  const writable = {
    write: vi.fn(write),
    close: vi.fn(async () => {}),
    abort: vi.fn(async () => {}),
  };
  const handle = { createWritable: vi.fn(async () => writable) };
  return { handle: handle as unknown as FileSystemFileHandle, writable };
}

describe('writeToHandle', () => {
  it('writes, then closes to commit', async () => {
    const { handle, writable } = fakeHandle(async () => {});
    await writeToHandle(handle, '{"ok":true}');
    expect(writable.write).toHaveBeenCalledWith('{"ok":true}');
    expect(writable.close).toHaveBeenCalledTimes(1);
    expect(writable.abort).not.toHaveBeenCalled();
  });

  it('aborts on a failed write and rethrows the original error', async () => {
    const quota = new DOMException('Disk full', 'QuotaExceededError');
    const { handle, writable } = fakeHandle(async () => {
      throw quota;
    });
    writable.abort.mockRejectedValueOnce(new TypeError('stream errored'));
    await expect(writeToHandle(handle, 'x')).rejects.toBe(quota);
    expect(writable.abort).toHaveBeenCalledTimes(1);
    expect(writable.close).not.toHaveBeenCalled();
  });
});
